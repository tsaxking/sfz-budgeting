import { browser } from '$app/environment';
import budget from '$lib/imports/budget';
import { sse } from '$lib/utils/sse';
import { Struct } from 'drizzle-struct/front-end';

export namespace Budgeting {
	export const Budgets = new Struct({
		name: 'budgets',
		structure: {
			name: 'string',
			description: 'string',
			type: 'string', // monthly, yearly, etc.
			amount: 'number'
			// startDate: 'string', //iso date
		},
		socket: sse,
		browser: browser
	});

	export type BudgetData = typeof Budgets.sample;

	export const BudgetTags = new Struct({
		name: 'budget_tags',
		structure: {
			budgetId: 'string',
			tagId: 'string'
		},
		socket: sse,
		browser: browser
	});

	export type BudgetTagData = typeof BudgetTags.sample;
}
