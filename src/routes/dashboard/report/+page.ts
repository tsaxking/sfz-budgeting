import { Transactions } from '$lib/model/transactions';
import { DataArr } from 'drizzle-struct/front-end';

export const load = async (event) => {
	const transactions = new DataArr(
		Transactions.Transactions,
		event.data.transactions.map((t) => Transactions.Transactions.Generator(t.transaction))
	);
	const transactionTags: {
		[key: string]: Transactions.TransactionTagData[];
	} = {};
	for (const t of event.data.transactions) {
		const tags = t.tags.map((tag) => Transactions.TransactionTags.Generator(tag));
		transactionTags[t.transaction.id] = tags;
	}
	// const budgets = event.data.budgets.map(b => ({
	//     ...b,
	//     budget: Budgeting.Budgets.Generator(b.budget),
	//     tags: b.tags.map(t => Budgeting.BudgetTags.Generator(t)),
	//     transactions: b.transactions.map(t => Transactions.Transactions.Generator(t)),
	// }));
	return {
		transactions,
		transactionTags,
		from: event.data.from,
		to: event.data.to,
		buckets: new DataArr(
			Transactions.Buckets,
			event.data.buckets.map((b) => Transactions.Buckets.Generator(b))
		),
		startBalance: event.data.startBalance,
		endBalance: event.data.endBalance,
		tags: new DataArr(
			Transactions.Tags,
			event.data.tags.map((t) => Transactions.Tags.Generator(t))
		)
		// budgets,
	};
};
