import { Transactions } from '$lib/server/structs/transactions.js'

export const load = async (event) => {
    const buckets = await Transactions.Buckets.all({ type: 'stream', }).await().unwrap();
    return {
        buckets: buckets.map(b => b.safe()),
    }
}