import { text, integer } from "drizzle-orm/pg-core";
import { Struct } from "drizzle-struct/back-end";
import { attemptAsync, resolveAll } from "ts-utils/check";
import { Transactions } from "./transactions";

export namespace Budgeting {
    export const Budgets = new Struct({
        name: 'budgets',
        structure: {
            name: text('name').notNull(),
            description: text('description').notNull(),
            type: text('type').notNull(), // monthly, yearly, etc.
            amount: integer('amount').notNull(),
            startDate: text('start_date').notNull(),
        },
    });

    export type BudgetData = typeof Budgets.sample;

    export const BudgetTags = new Struct({
        name: 'budget_tags',
        structure: {
            budgetId: text('budget_id').notNull(),
            tagId: text('tag_id').notNull(),
        },
    });

    export type BudgetTagData = typeof BudgetTags.sample;

    export const getBudgetInfo = (budget: BudgetData) => {
        return attemptAsync(async () => {
            const tags = (await BudgetTags.fromProperty('budgetId', budget.id, { type: 'stream', }).await()).unwrap();
            const transactions = resolveAll(await Promise.all(tags.map(t => Transactions.transactionsFromTag(t.data.tagId)))).unwrap().flat();
            const total = transactions.reduce((acc, t) => acc + t.data.amount, 0);
            return {
                total,
                left: budget.data.amount - total,
                count: transactions.length,
                percent: (total / budget.data.amount) * 100,
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