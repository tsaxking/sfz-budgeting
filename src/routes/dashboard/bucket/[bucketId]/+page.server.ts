import { Transactions } from '$lib/server/structs/transactions.js';
import { fail } from '@sveltejs/kit';

export const load = async (event) => {
    const bucket = await Transactions.Buckets.fromId(event.params.bucketId).unwrap();
    if (!bucket) {
        throw fail(404);
    }

    // const transactions = await Transactions.Transactions.fromProperty('bucketId', bucket.data.id, { type: 'stream' }).await();

    // if (transactions.isErr()) {
    //     throw fail(500);
    // }

    const transactions = await Transactions.transactionsFromBucket(bucket);
    if (transactions.isErr()) {
        throw fail(500);
    }

    return {
        bucket: bucket.safe(),
        transactions: transactions.value.map(t => ({
            transaction: t.transaction.safe(),
            tags: t.tags.map(tag => tag.safe()),
        })),
    }
};