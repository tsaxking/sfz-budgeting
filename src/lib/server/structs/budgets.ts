import { text, integer } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';
import { attemptAsync, resolveAll } from 'ts-utils/check';
import { Transactions } from './transactions';
import { match } from 'ts-utils/match';

export namespace Budgeting {
	export const Budgets = new Struct({
		name: 'budgets',
		structure: {
			name: text('name').notNull(),
			description: text('description').notNull(),
			type: text('type').notNull(), // monthly, yearly, etc.
			amount: integer('amount').notNull()
			// startDate: text('start_date').notNull(),
		},
		validators: {
			type: (value) => typeof value === 'string' && ['weekly', 'monthly', 'yearly'].includes(value)
		}
	});

	export type BudgetData = typeof Budgets.sample;

	export const BudgetTags = new Struct({
		name: 'budget_tags',
		structure: {
			budgetId: text('budget_id').notNull(),
			tagId: text('tag_id').notNull()
		}
	});

	export type BudgetTagData = typeof BudgetTags.sample;

	export const getBudgetInfo = (budget: BudgetData, date: Date) => {
		return attemptAsync(async () => {
			const tags = (
				await BudgetTags.fromProperty('budgetId', budget.id, { type: 'stream' }).await()
			).unwrap();
			const transactions = resolveAll(
				await Promise.all(tags.map((t) => Transactions.transactionsFromTag(t.data.tagId)))
			)
				.unwrap()
				.flat();

			const from = match<string, Date>(budget.data.type)
				.case('weekly', () => {
					// start of the week is Sunday
					const day = date.getDay();
					const diff = (day + 6) % 7; // Sunday is 0, so we need to subtract 1
					return new Date(date.getFullYear(), date.getMonth(), date.getDate() - diff);
				})
				.case('monthly', () => {
					// start of the month is the first day of the month
					return new Date(date.getFullYear(), date.getMonth(), 1);
				})
				.case('yearly', () => {
					// start of the year is the first day of the year
					return new Date(date.getFullYear(), 0, 1);
				})
				.default(() => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1))
				.exec()
				.unwrap();

			const to = match<string, Date>(budget.data.type)
				.case('weekly', () => {
					// end of the week is Saturday
					const day = date.getDay();
					const diff = (day + 6) % 7; // Sunday is 0, so we need to subtract 1
					return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (6 - diff));
				})
				.case('monthly', () => {
					// end of the month is the last day of the month
					const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
					return new Date(date.getFullYear(), date.getMonth(), nextMonth.getDate());
				})
				.case('yearly', () => {
					// end of the year is the last day of the year
					return new Date(date.getFullYear(), 11, 31);
				})
				.default(() => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1))
				.exec()
				.unwrap();

			return {
				transactions: transactions.filter((t) => {
					const transactionDate = new Date(t.transaction.data.date);
					return transactionDate >= from && transactionDate <= to;
				}),
				tags,
				budget
			};
		});
	};

	// export const PaymentPlans = new Struct({
	//     name: 'payment_plans',
	//     structure: {
	//         name: text('name').notNull(),
	//         description: text('description').notNull(),
	//         startDate: text('start_date').notNull(),
	//     },
	// });
}

export const _budgets = Budgeting.Budgets.table;
export const _budgetTags = Budgeting.BudgetTags.table;
// export const _paymentPlans = Budgeting.PaymentPlans.table;
