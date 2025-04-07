<script lang="ts">
	import type { Transactions } from '$lib/model/transactions';
	import { Budgeting } from '$lib/model/budgets';
	import { Form } from '$lib/utils/form';
	import { capitalize } from 'ts-utils/text';
	import { dateString } from 'ts-utils/clock';
	import { confirm, rawModal } from '$lib/utils/prompts';
	import { mount } from 'svelte';
	import Edit from './Edit.svelte';

	interface Props {
		budget: Budgeting.BudgetData;
		tags: Budgeting.BudgetTagData[];
		transactions: Transactions.TransactionData[];
	}

	const { budget, transactions, tags }: Props = $props();
	const total = transactions.reduce((acc, t) => acc + Number(t.data.amount), 0) * -1;
	const normalized = total / Number(budget.data.amount);
</script>

<div>
	<div
		class="progress position-relative"
		role="progressbar"
		aria-label="Basic example"
		aria-valuenow={total}
		aria-valuemin="0"
		aria-valuemax={$budget.amount}
	>
		<div class="progress-bar" style="width: {normalized * 100}%;"></div>
		<p class="mb-0 position-absolute">
			{(total / 100).toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD'
			})} of {(Number($budget.amount) / 100).toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD'
			})}
		</p>
	</div>
</div>
