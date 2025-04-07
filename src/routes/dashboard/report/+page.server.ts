import { Budgeting } from '$lib/server/structs/budgets';
import { Transactions } from '$lib/server/structs/transactions.js';
import { resolveAll } from 'ts-utils/check';
import { dateString } from 'ts-utils/clock';

export const load = async (event) => {
	let from = event.url.searchParams.get('from');
	let to = event.url.searchParams.get('to');

	if (!from) {
		from = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toDateString();
	}
	if (!to) {
		to = new Date(Date.now()).toDateString();
	}

	const buckets = await Transactions.Buckets.all({ type: 'stream' }).await().unwrap();

	const transactions = resolveAll(
		await Promise.all(buckets.map((b) => Transactions.transactionsFromBucket(b)))
	)
		.unwrap()
		.flat();

	const currentBalance = buckets.reduce((acc, b) => {
		return acc + b.data.balance;
	}, 0);

	const fromTransactions = transactions.filter((t) => {
		return new Date(t.transaction.data.date) >= new Date(from);
	});

	const afterTransactions = transactions.filter((t) => {
		return new Date(t.transaction.data.date) >= new Date(to);
	});

	const startBalance =
		fromTransactions.reduce((acc, t) => {
			return acc - t.transaction.data.amount;
		}, currentBalance) / 100;

	const endBalance =
		afterTransactions.reduce((acc, t) => {
			return acc - t.transaction.data.amount;
		}, startBalance) / 100;

	const tags = await Transactions.Tags.all({ type: 'stream' }).await().unwrap();

	return {
		transactions: transactions
			.filter(
				(t) =>
					new Date(t.transaction.data.date) >= new Date(from) &&
					new Date(t.transaction.data.date) <= new Date(to)
			)
			.sort(
				(a, b) =>
					new Date(b.transaction.data.date).getTime() - new Date(a.transaction.data.date).getTime()
			)
			.map((t) => ({
				transaction: t.transaction.safe(),
				tags: t.tags.map((tag) => tag.safe())
			})),
		from: dateString('YYYY-MM-DD')(new Date(from)),
		to: dateString('YYYY-MM-DD')(new Date(to)),
		buckets: buckets.map((b) => b.safe()),
		startBalance,
		endBalance,
		tags: tags.map((tag) => tag.safe())
	};
};
