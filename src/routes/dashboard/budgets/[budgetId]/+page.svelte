<script lang="ts">
	import Progress from '$lib/components/budgets/Progress.svelte';
	import Transactions from '$lib/components/transactions/Transactions.svelte';
	import { listen } from '$lib/utils/struct-listener';
	import { mount, onMount } from 'svelte';
	import { capitalize } from 'ts-utils/text';
	import nav from '$lib/imports/budget.js';
	import { confirm, rawModal } from '$lib/utils/prompts.js';
	import type { Budgeting } from '$lib/model/budgets.js';
	import Edit from '$lib/components/budgets/Edit.svelte';
	import Chart from '$lib/components/transactions/Chart.svelte';
	nav();

	const { data } = $props();
	const budget = $state(data.budget);
	const transactions = $state(data.transactions);
	const budgetTags = $state(data.tags);
	const transactionTags = $state(data.transactionTags);
	const spent = $derived(transactions.data.reduce((acc, t) => acc + Number(t.data.amount), 0) * -1);
	const normalized = $derived(spent / Number(budget.data.amount));
	const date = $derived(new Date(data.date));
	const total = $derived(Number(budget.data.amount));
	const left = $derived(total - spent);

	onMount(() => {
		const offTags = listen(budgetTags, (t) => t.data.budgetId === budget.data.id);

		const searchParams = new URLSearchParams(window.location.search);
		searchParams.set('date', date.toDateString());
		// location.search = searchParams.toString();

		return () => {
			offTags();
		};
	});

	const showDetails = async (budget: Budgeting.BudgetData, tags: Budgeting.BudgetTagData[]) => {
		let save = () => {};
		const m = rawModal(
			'Budget Details',
			[
				{
					text: 'Close',
					color: 'secondary',
					onClick: () => m.hide()
				},
				{
					text: 'Save',
					color: 'success',
					onClick: () => {
						save();
					}
				},
				{
					text: 'Delete',
					color: 'danger',
					onClick: async () => {
						const res = await confirm(`Are you sure you want to delete this budget?`, {
							title: 'Delete Budget'
						});
						if (!res) {
							return;
						}
						budget.delete();
						m.hide();
					}
				}
			],
			(body) => {
				const edit = mount(Edit, {
					target: body,
					props: {
						budget,
						tags
					}
				});
				save = edit.save.bind(edit);
				return edit;
			}
		);

		m.show();
	};
</script>

<div class="container layer-1">
	<div class="row mb-3">
		<div class="d-flex justify-content-between">
			<h1>
				{capitalize($budget.type || 'unknown')}
				{$budget.name} Budget:
				<span class="text-muted">
					{(normalized * 100).toFixed(2)}%
				</span>
			</h1>
			<button class="btn" onclick={() => showDetails(budget, $budgetTags)}>
				<i class="material-icons">edit</i>
			</button>
		</div>
		<hr />
	</div>
	<div class="row mb-3">
		{#if spent > total}
			<span class="text-danger"
				>{(left / 100).toLocaleString('en-US', {
					style: 'currency',
					currency: 'USD'
				})} Over Budget</span
			>
		{:else if total === spent}
			<span class="text-warning">
				{(left / 100).toLocaleString('en-US', {
					style: 'currency',
					currency: 'USD'
				})} At Budget
			</span>
		{:else}
			<span class="text-success">
				{(left / 100).toLocaleString('en-US', {
					style: 'currency',
					currency: 'USD'
				})} Under Budget
			</span>
		{/if}
	</div>
	<div class="row mb-3">
		<div class="d-flex">
			<button
				type="button"
				class="btn btn-secondary"
				onclick={() => {
					if (budget.data.type === 'monthly') {
						const newDate = new Date(date);
						newDate.setMonth(newDate.getMonth() - 1);
						const searchParams = new URLSearchParams(window.location.search);
						searchParams.set('date', newDate.toDateString());
						location.search = searchParams.toString();
					} else if (budget.data.type === 'weekly') {
						const newDate = new Date(date);
						newDate.setDate(newDate.getDate() - 7);
						const searchParams = new URLSearchParams(window.location.search);
						searchParams.set('date', newDate.toDateString());
						location.search = searchParams.toString();
					} else if (budget.data.type === 'yearly') {
						const newDate = new Date(date);
						newDate.setFullYear(newDate.getFullYear() - 1);
						const searchParams = new URLSearchParams(window.location.search);
						searchParams.set('date', newDate.toDateString());
						location.search = searchParams.toString();
					} else {
						alert('Unknown budget type');
					}
				}}
			>
				Previous
			</button>
			<button
				type="button"
				class="btn btn-secondary ms-2"
				onclick={() => {
					if (budget.data.type === 'monthly') {
						const newDate = new Date(date);
						newDate.setMonth(newDate.getMonth() + 1);
						const searchParams = new URLSearchParams(window.location.search);
						searchParams.set('date', newDate.toDateString());
						location.search = searchParams.toString();
					} else if (budget.data.type === 'weekly') {
						const newDate = new Date(date);
						newDate.setDate(newDate.getDate() + 7);
						const searchParams = new URLSearchParams(window.location.search);
						searchParams.set('date', newDate.toDateString());
						location.search = searchParams.toString();
					} else if (budget.data.type === 'yearly') {
						const newDate = new Date(date);
						newDate.setFullYear(newDate.getFullYear() + 1);
						const searchParams = new URLSearchParams(window.location.search);
						searchParams.set('date', newDate.toDateString());
						location.search = searchParams.toString();
					} else {
						alert('Unknown budget type');
					}
				}}
			>
				Next
			</button>
		</div>
	</div>
	<div class="row mb-3">
		<Progress {budget} tags={$budgetTags} transactions={$transactions} />
	</div>
	<div class="row mb-3">
		<div style="height: 500px;">
			<Transactions {transactions} {transactionTags} />
		</div>
	</div>
	<div class="row mb-3">
		<div style="height: 300px;">
			<Chart transactions={$transactions} classes="layer-2" />
		</div>
	</div>
</div>
