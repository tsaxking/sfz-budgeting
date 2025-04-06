import { Transactions } from '$lib/model/transactions.js';
import { DataArr } from 'drizzle-struct/front-end';

export const load = async (event) => {
    const transactions = new DataArr(Transactions.Transactions, event.data.transactions.map(t => Transactions.Transactions.Generator(t.transaction)));
    const transactionTags: {
        [key: string]: Transactions.TransactionTagData[];
    } = {};
    for (const t of event.data.transactions) {
        const tags = t.tags.map(tag => Transactions.TransactionTags.Generator(tag));
        transactionTags[t.transaction.id] = tags;
    }
    return {
        bucket: Transactions.Buckets.Generator(event.data.bucket),
        transactions,
        transactionTags,
    }
};