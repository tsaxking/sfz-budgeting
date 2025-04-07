import { Budgeting } from '$lib/model/budgets.js';
import { Transactions } from '$lib/model/transactions.js';
import { DataArr } from 'drizzle-struct/front-end';

export const load = async (event) => {
	const budget = Budgeting.Budgets.Generator(event.data.budget);
	const tags = new DataArr(
		Budgeting.BudgetTags,
		event.data.tags.map((t) => Budgeting.BudgetTags.Generator(t))
	);
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
	return {
		budget,
		tags,
		transactions,
		transactionTags,
		date: event.data.date
	};
};
