import { Budgeting } from '$lib/server/structs/budgets.js';
import { resolveAll } from 'ts-utils/check';

export const load = async (event) => {
	const budgets = await Budgeting.Budgets.all({ type: 'stream' }).await().unwrap();

	const infos = resolveAll(
		await Promise.all(budgets.map((b) => Budgeting.getBudgetInfo(b, new Date())))
	).unwrap();
	return {
		budgets: infos.map((b) => ({
			...b,
			budget: b.budget.safe(),
			transactions: b.transactions.map((t) => t.transaction.safe()),
			tags: b.tags.map((t) => t.safe())
		}))
	};
};
