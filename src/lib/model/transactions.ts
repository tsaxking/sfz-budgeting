import { browser } from "$app/environment";
import { sse } from "$lib/utils/sse";
import { DataArr, Struct } from "drizzle-struct/front-end";

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
            name: 'string',
            description: 'string',
            balance: 'number',
            type: 'string',
            color: 'string',
            icon: 'string',
            isDefault: 'boolean',
        },
        socket: sse,
        browser: browser,
    });

    export type BucketData = typeof Buckets.sample;
    export type BucketArr = DataArr<typeof Buckets.data.structure>;

    export const csvImport = (name: string, contents: string, bucket: BucketData, forceReview: boolean) => {
        return Buckets.call('csv-import', {
            name,
            contents,
            bucketId: bucket.data.id,
            forceReview,
        });
    };

    export const CSVImports = new Struct({
        name: 'csv_imports',
        structure: {
            name: 'string',
            bucketId: 'string',
            parserVersion: 'string',
            notes: 'string',
            contents: 'string',
            forceReview: 'boolean',
        },
        socket: sse,
        browser: browser,
    });
    export type CSVImportData = typeof CSVImports.sample;
    export type CSVImportArr = DataArr<typeof CSVImports.data.structure>;

    export const Transactions = new Struct({
        name: 'transactions',
        structure: {
            name: 'string',
            description: 'string',
            amount: 'number',
            bucketId: 'string',
            importId: 'string',
            date: 'string',
            originalRow: 'string',
            reviewed: 'boolean',
        },
        socket: sse,
        browser: browser,
    });
    export type TransactionData = typeof Transactions.sample;
    export type TransactionArr = DataArr<typeof Transactions.data.structure>;

    export const Tags = new Struct({
        name: 'tags',
        structure: {
            name: 'string',
            description: 'string',
            color: 'string',
        },
        socket: sse,
        browser: browser,
    });
    export type TagData = typeof Tags.sample;
    export type TagArr = DataArr<typeof Tags.data.structure>;

    export const TransactionTags = new Struct({
        name: 'transaction_tags',
        structure: {
            transactionId: 'string',
            tagId: 'string',
        },
        socket: sse,
        browser: browser,
    });
    export type TransactionTagData = typeof TransactionTags.sample;
    export type TransactionTagArr = DataArr<typeof TransactionTags.data.structure>;

    export const Pictures = new Struct({
        name: 'transaction_pictures',
        structure: {
            name: 'string',
            description: 'string',
            transactionId: 'string',
            filename: 'string',
        },
        socket: sse,
        browser: browser,
    });
    export type PictureData = typeof Pictures.sample;
    export type PictureArr = DataArr<typeof Pictures.data.structure>;




    export const bulkUpdate = (data: {
        transactions: TransactionData[];
        name?: string;
        tags?: string[];
        reviewed?: boolean;
    }) => Transactions.call('bulk-update', {
        transactions: data.transactions.map(t => t.data.id),
        name: data.name,
        tags: data.tags,
        reviewed: data.reviewed,
    });

    export const createTransaction = (data: {
        bucket: BucketData;
        name: string;
        amount: number;
        date: Date;
        tags: string[];
        reviewed: boolean;
        description: string;
    }) => {
        return Transactions.call('create', {
            ...data,
            bucket: data.bucket.data.id,
            date: data.date.toISOString(),
        });
    };
}