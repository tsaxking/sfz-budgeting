import { Budgeting } from '$lib/model/budgets';
import { Transactions } from '$lib/model/transactions.js';

export const load = async (event) => {
	const budgets = event.data.budgets.map((b) => ({
		...b,
		budget: Budgeting.Budgets.Generator(b.budget),
		tags: b.tags.map((t) => Budgeting.BudgetTags.Generator(t)),
		transactions: b.transactions.map((t) => Transactions.Transactions.Generator(t))
	}));
	return {
		buckets: event.data.buckets.map((b) => Transactions.Buckets.Generator(b)),
		budgets
	};
};
