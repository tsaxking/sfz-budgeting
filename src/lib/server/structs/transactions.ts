import { boolean, integer } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';
import { attemptAsync, resolveAll } from 'ts-utils/check';
import { DB } from '../db';
import { eq } from 'drizzle-orm';
import { Account } from './account';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import { Stream } from 'ts-utils/stream';

export namespace Transactions {
    export enum BucketType {
        CREDIT = 'credit',
        DEBIT = 'debit',
        SAVINGS = 'savings',
        CHECKING = 'checking',
        INVESTMENT = 'investment',
        LOAN = 'loan',
        CASH = 'cash',
        OTHER = 'other',
    }

    export const Buckets = new Struct({
        name: 'buckets',
        structure: {
            name: text('name').notNull(),
            description: text('description').notNull(),
            balance: integer('balance').notNull(), // pennies
            type: text('type').notNull(), // BucketType enum
            color: text('color').notNull(), // Hex color code
            icon: text('icon').notNull(), // Icon name
            isDefault: boolean('is_default').notNull(), // Whether this is the default bucket
        },
    });

    export type BucketData = typeof Buckets.sample;

    Buckets.callListen('csv-import', async (event, data) => {
        if (!event.locals.account) {
            return {
                success: false,
                message: 'Not logged in',
            }
        }

        if (!await Account.isAdmin(event.locals.account)) {
            return {
                success: false,
                message: 'Not authorized',
            }
        }

        const parsed = z.object({
            name: z.string(),
            contents: z.string(),
            bucketId: z.string(),
            forceReview: z.boolean(),
        }).safeParse(data);

        if (!parsed.success) {
            return {
                success: false,
                message: 'Invalid data',
            }
        }

        const { name, contents, bucketId } = parsed.data;
        const bucket = await Buckets.fromId(bucketId).unwrap();
        if (!bucket) {
            return {
                success: false,
                message: 'Bucket not found',
            }
        }
        if (!isValidCSV(contents)) {
            return {
                success: false,
                message: 'Invalid CSV',
            }
        }
        const csvImport = await CSVImports.new({
            name,
            bucketId: bucketId,
            parserVersion: '1.0',
            notes: 'Imported from CSV',
            contents,
            forceReview: parsed.data.forceReview,
        });
        if (csvImport.isErr()) {
            return {
                success: false,
                message: 'Failed to create CSV import',
            }
        }

        return {
            success: true,
        }
    });

    const isValidCSV = (contents: string) => {
        try {
            const parser = parse(contents, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });
            const parsed = z.array(z.object({
                Date: z.string(),
                Description: z.string(),
                Amount: z.string(),
            })).parse(parser);
            return parsed.length > 0;
        } catch {
            return false;
        }
    };

    const parseCSV = (contents: string) => {
        const stream = new Stream<{
            date: Date;
            description: string;
            amount: number;
        }>();
        try {
            const parser = parse(contents, {
                columns: true,
            });
            const parsed = z.array(z.object({
                Date: z.string(),
                Description: z.string(),
                Amount: z.string(),
            })).parse(parser);
            setTimeout(() => {
                for (const record of parsed) {
                    const date = new Date(record.Date);
                    const description = record.Description;
                    const amount = Math.round(parseFloat(record.Amount) * 100);
                    stream.add({
                        date,
                        description,
                        amount,
                    });
                }
            });
        } catch (error) {
            stream.error(new Error('Failed to parse CSV: ' + error));
        }
        return stream;
    };

    export const CSVImports = new Struct({
        name: 'csv_imports',
        structure: {
            name: text('name').notNull(),
            bucketId: text('bucket_id').notNull(),
            parserVersion: text('parser_version').notNull(),
            notes: text('notes').notNull(),
            contents: text('contents').notNull(),
            forceReview: boolean('force_review').notNull(), // Whether to force review of transactions
        },
    });

    CSVImports.on('create', (csvImport) => {
        const contents = parseCSV(csvImport.data.contents);
        contents.pipe(async (record) => {
            console.log('record', record);
            const exists = await Transactions.fromProperty('bucketId', csvImport.data.bucketId, { type: 'stream', }).await();
            if (exists.isOk()) {
                const find = exists.value.find(t => {
                    const date = new Date(t.data.date);
                    return date.getTime() === record.date.getTime() && t.data.description === record.description && record.amount === t.data.amount;
                });
                if (find) {
                    // already exists
                    return;
                }
            }
            Transactions.new({
                bucketId: csvImport.data.bucketId,
                importId: csvImport.id,
                name: 'CSV Import',
                description: record.description,
                amount: record.amount,
                date: record.date.toISOString(),
                originalRow: JSON.stringify(record),
                reviewed: csvImport.data.forceReview,
            });
        });
    });
    CSVImports.on('delete', (csvImport) => {
        Transactions.fromProperty('importId', csvImport.id, { type: 'stream' }).pipe(t => t.delete());
    });
    CSVImports.on('archive', (csvImport) => {
        Transactions.fromProperty('importId', csvImport.id, { type: 'stream' }).pipe(t => t.setArchive(true));
    });
    CSVImports.on('restore', (csvImport) => {
        Transactions.fromProperty('importId', csvImport.id, { type: 'stream' }).pipe(t => t.setArchive(false));
    });

    export const Transactions = new Struct({
        name: 'transactions',
        structure: {
            name: text('name').notNull(),
            description: text('description').notNull(),
            amount: integer('amount').notNull(), // pennies (positive or negative)
            bucketId: text('bucket_id').notNull(),
            importId: text('import_id').notNull(),
            date: text('date').notNull(), // ISO String
            originalRow: text('original_row').notNull(), // Original row from CSV
            reviewed: boolean('reviewed').notNull(), // Whether the transaction has been reviewed by the user
        },
    });

    export type TransactionData = typeof Transactions.sample;

    export const getTags = (transaction: TransactionData) => {
        return TransactionTags.fromProperty('transactionId', transaction.id, { type: 'stream' }).await();
    };

    export const getTransactionsBetween = (from: Date, to: Date) => {
        return attemptAsync(async () => {
            const transactions = await Transactions.all({ type: 'stream' }).await().unwrap();
            transactions.sort((a, b) => {
                const A = new Date(a.data.date);
                const B = new Date(b.data.date);
                return A.getTime() - B.getTime();
            }
            );
            return Promise.all(transactions.filter(t => {
                const date = new Date(t.data.date);
                return date.getTime() >= from.getTime() && date.getTime() <= to.getTime();
            }
            ).map(async t => {
                const tags = await getTags(t).unwrap();
                return {
                    transaction: t,
                    tags,
                }
            }
            ));
        });
    };

    export const transactionsFromBucket = (bucket: BucketData) => {
        return attemptAsync(async () => {
            const transactions = await Transactions.fromProperty('bucketId', bucket.id, { type: 'stream' }).await().unwrap();
            transactions.sort((a, b) => {
                const A = new Date(a.data.date);
                const B = new Date(b.data.date);
                return A.getTime() - B.getTime();
            })
            return Promise.all(transactions.map(async t => {
                const tags = await getTags(t).unwrap();
                return {
                    transaction: t,
                    tags,
                }
            }));
        });
    };

    const changeBalance = (bucketId: string, amount: number) => {
        return attemptAsync(async () => {
            const bucket = (await Buckets.fromId(bucketId)).unwrap();
            if (bucket) {
                bucket.update({
                    balance: bucket.data.balance + amount,
                });
            }
        });
    }

    Transactions.on('create', (transaction) => {
        if (!transaction.data.reviewed) {
            return;
        }
        const bucketId = transaction.data.bucketId;
        const amount = transaction.data.amount;

        changeBalance(bucketId, amount);
    });
    Transactions.on('update', ({ from, to }) => {
        if (to.data.reviewed === from.reviewed) {
            // updated a reviewed transaction
            const fromBucketId = from.bucketId;
            const toBucketId = to.data.bucketId;
    
            if (fromBucketId !== toBucketId) {
                changeBalance(fromBucketId, -from.amount);
                changeBalance(toBucketId, to.data.amount);
            } else {
                changeBalance(fromBucketId, to.data.amount - from.amount);
            }
        } else if (to.data.reviewed && !from.reviewed) {
            // reviewed a transaction
            // this means the transaction was validated
            const bucketId = to.data.bucketId;
            const amount = to.data.amount;

            changeBalance(bucketId, amount);
        } else if (!to.data.reviewed && from.reviewed) {
            // unreviewed a transaction
            // this means the transaction was unvalidated
            const bucketId = from.bucketId;
            const amount = from.amount;

            changeBalance(bucketId, -amount);
        }

    });
    Transactions.on('delete', (transaction) => {
        if (!transaction.data.reviewed) {
            return;
        }
        const bucketId = transaction.data.bucketId;
        const amount = transaction.data.amount;

        changeBalance(bucketId, -amount);
    });
    Transactions.on('archive', (transaction) => {
        if (!transaction.data.reviewed) {
            return;
        }
        const bucketId = transaction.data.bucketId;
        const amount = transaction.data.amount;

        changeBalance(bucketId, -amount);
    });
    Transactions.on('restore', (transaction) => {
        if (!transaction.data.reviewed) {
            return;
        }
        const bucketId = transaction.data.bucketId;
        const amount = transaction.data.amount;

        changeBalance(bucketId, amount);
    });

    Transactions.callListen('bulk-update', async (event, data) => {
        if (!event.locals.account) {
            return {
                success: false,
                message: 'Not logged in',
            }
        }

        if (!await Account.isAdmin(event.locals.account)) {
            return {
                success: false,
                message: 'Not authorized',
            }
        }

        const parsed = z.object({
            transactions: z.array(z.string()),
            name: z.string().optional(),
            tags: z.array(z.string()).optional(),
            reviewed: z.boolean().optional(),
        }).safeParse(data);


        if (!parsed.success) {
            return {
                success: false,
                message: 'Invalid data',
            }
        }

        const { transactions, name, tags, reviewed } = parsed.data;

        const res = resolveAll(await Promise.all(transactions.map(async (id) => {
            return attemptAsync(async () => {
                const transaction = await Transactions.fromId(id).unwrap();
                if (!transaction) return; // ignore if not found

                await transaction.update({
                    name: name ?? transaction.data.name,
                    reviewed: reviewed ?? transaction.data.reviewed,
                }).unwrap();

                if (tags) {
                    const currentTags = await getTags(transaction).unwrap();
                    await Promise.all(currentTags.map(t => t.delete()));
                    await Promise.all(tags.map(async (tagId) => {
                        const tag = await Tags.fromId(tagId).unwrap();
                        if (tag) {
                            await TransactionTags.new({
                                transactionId: transaction.id,
                                tagId: tag.id,
                            });
                        }
                    }));
                }
            });
        })));

        if (res.isErr()) {
            return {
                success: false,
                message: 'Failed to update transactions',
            }
        }

        return {
            success: true,
        }
    });

    Transactions.callListen('create', async (event, data) => {
        if (!event.locals.account) {
            return {
                success: false,
                message: 'Not logged in',
            }
        }

        if (!await Account.isAdmin(event.locals.account)) {
            return {
                success: false,
                message: 'Not authorized',
            }
        }

        const parsed = z.object({
            bucket: z.string(),
            name: z.string(),
            amount: z.number(),
            date: z.string(),
            tags: z.array(z.string()),
            reviewed: z.boolean(),
            description: z.string(),
        }).safeParse(data);

        if (!parsed.success) {
            console.error('Failed to parse data', parsed.error);
            return {
                success: false,
                message: 'Invalid data',
            }
        }

        const { bucket, name, amount, date, tags, reviewed, description } = parsed.data;

        if (new Date(date).toString() === 'Invalid Date') {
            return {
                success: false,
                message: 'Invalid date',
            }
        }
        if (isNaN(amount)) {
            return {
                success: false,             
                message: 'Invalid amount',      
            }   
        }


        const bucketData = await Buckets.fromId(bucket).unwrap();
        if (!bucketData) {
            return {
                success: false,
                message: 'Bucket not found',
            }
        }
        const transaction = await Transactions.new({
            bucketId: bucket,
            name,
            amount,
            date,
            reviewed,
            description,
            originalRow: JSON.stringify(parsed.data),
            importId: '',
        });

        if (transaction.isErr()) {
            return {
                success: false,
                message: 'Failed to create transaction',
            }
        }

        await Promise.all(tags.map(async (tagId) => {
            const tag = await Tags.fromId(tagId).unwrap();
            if (tag) {
                await TransactionTags.new({
                    transactionId: transaction.value.id,
                    tagId: tag.id,
                });
            }
        }));

        return {
            success: true,
        }
    });

    export const Tags = new Struct({
        name: 'tags',
        structure: {
            name: text('name').notNull(),
            description: text('description').notNull(),
            color: text('color').notNull(), // Hex color code
        },
        validators: {
            // color: (color: unknown) => {
            //     if (typeof color !== 'string') {
            //         return false;
            //     }
            //     const hexColor = /^#[0-9A-F]{6}$/i;
            //     if (!hexColor.test(color)) {
            //         return false;
            //     }
            //     return true;
            // }
        }
    });

    Tags.on('delete', (tag) => {
        TransactionTags.fromProperty('tagId', tag.id, { type: 'stream' }).pipe(t => t.delete());
    });

    export const TransactionTags = new Struct({
        name: 'transaction_tags',
        structure: {
            transactionId: text('transaction_id').notNull(),
            tagId: text('tag_id').notNull(),
        }
    });

    export const transactionsFromTag = (tagId: string) => {
        return attemptAsync(async () => {
            const res = await DB.select()
                .from(Transactions.table)
                .innerJoin(TransactionTags.table, eq(TransactionTags.table.transactionId, Transactions.table.id))
                .where(eq(TransactionTags.table.tagId, tagId));

            return Promise.all(res.map(async r => {
                const transaction = Transactions.Generator(r.transactions);
                const tags = await getTags(transaction).unwrap();
                return {
                    transaction,
                    tags,
                }
            }));
        });
    };

    export const Pictures = new Struct({
        name: 'transaction_pictures',
        structure: {
            name: text('name').notNull(),
            description: text('description').notNull(),
            transactionId: text('transaction_id').notNull(),
            filename: text('filename').notNull(),
        },
    });
}

export const _buckets = Transactions.Buckets.table;
export const _transactions = Transactions.Transactions.table;
export const _csv_imports = Transactions.CSVImports.table;
export const _transaction_tags = Transactions.TransactionTags.table;
export const _transaction_pictures = Transactions.Pictures.table;
export const _tags = Transactions.Tags.table;
export const _transactions_table = Transactions.Transactions.table;
export const _buckets_table = Transactions.Buckets.table;