import { Budgeting } from '$lib/server/structs/budgets.js';
import { fail } from '@sveltejs/kit';

export const load = async (event) => {
    let date = event.url.searchParams.get('date');
    if (!date) {
        date = new Date().toDateString();
    }

    const budget = await Budgeting.Budgets.fromId(event.params.budgetId).unwrap();
    if (!budget) {
        throw fail(404);
    }
    const info = await Budgeting.getBudgetInfo(budget, new Date(date)).unwrap();

    return {
        transactions: info.transactions.map(t => ({
            transaction: t.transaction.safe(),
            tags: t.tags.map(tag => tag.safe()),
        })),
        budget: info.budget.safe(),
        tags: info.tags.map(t => t.safe()),
        date,
    }
};