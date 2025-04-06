import { Transactions } from '$lib/model/transactions.js';

export const load = async (event) => {
    return {
        buckets: event.data.buckets.map(b => Transactions.Buckets.Generator(b)),
    }
};