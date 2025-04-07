<script lang="ts">
	import DB from '$lib/components/dashboard/Dashboard.svelte';
	import Card from '$lib/components/dashboard/Card.svelte';
	import { Transactions } from '$lib/model/transactions.js';
	import { Dashboard } from '$lib/model/dashboard.js';
	import nav from '$lib/imports/budget.js';
	import Progress from '$lib/components/budgets/Progress.svelte';
	import { Form } from '$lib/utils/form.js';
	import { Budgeting } from '$lib/model/budgets.js';
	import { confirm, rawModal } from '$lib/utils/prompts.js';
	import { mount } from 'svelte';
	import Edit from '$lib/components/budgets/Edit.svelte';
	nav();

	const { data } = $props();

	const budgets = $state(data.budgets);

	const total = $derived(budgets.reduce((acc, b) => acc + Number(b.budget.data.amount), 0));
	const spent = $derived(
		budgets.reduce(
			(acc, b) => acc + Number(b.transactions.reduce((acc, t) => acc + Number(t.data.amount), 0)),
			0
		) * -1
	);
	const left = $derived(total - spent);

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
		<h1>Budgets</h1>
	</div>
	<div class="row mb-3">
		<div class="card layer-3">
			<div class="card-body">
				<div class="d-flex justify-content-between align-items-center mb-2">
					<h5>
						Budget Overview
						<small class="text-muted">
							{#if spent > total}
								<span class="text-danger"
									>{(left / 100).toLocaleString('en-US', {
										style: 'currency',
										currency: 'USD'
									})} Over Budget</span
								>
							{:else if spent === total}
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
						</small>
					</h5>
				</div>
				<div class="progress position-relative">
					<div class="progress-bar" style="width: {(spent / total) * 100}%;"></div>
					<p class="mb-0 position-absolute">
						{(spent / 100).toLocaleString('en-US', {
							style: 'currency',
							currency: 'USD'
						})} of {(total / 100).toLocaleString('en-US', {
							style: 'currency',
							currency: 'USD'
						})}
					</p>
				</div>
			</div>
		</div>
	</div>
	{#each budgets as budget}
		<div class="row mb-3">
			<div class="card layer-3">
				<div class="card-body">
					<div class="d-flex justify-content-between align-items-center mb-2">
						<h5>
							{budget.budget.data.name}
						</h5>
						<div class="btn-group" role="group">
							<button
								type="button"
								class="btn btn-sm"
								onclick={() => showDetails(budget.budget, budget.tags)}
							>
								<i class="material-icons">edit</i>
							</button>
							<a href="/dashboard/budgets/{budget.budget.data.id}" class="btn btn-sm">
								<i class="material-icons">visibility</i>
							</a>
						</div>
					</div>
					<Progress budget={budget.budget} tags={budget.tags} transactions={budget.transactions} />
				</div>
			</div>
		</div>
	{/each}
	<div class="row mb-3">
		<button
			type="button"
			class="btn btn-primary"
			onclick={async () => {
				const res = await new Form()
					.input('name', {
						type: 'text',
						label: 'Name',
						required: true,
						disabled: false
					})
					.input('description', {
						type: 'text',
						label: 'Description',
						required: false,
						disabled: false
					})
					.input('amount', {
						type: 'number',
						label: 'Amount',
						required: true,
						disabled: false
					})
					// .input('startDate', {
					//     type: 'date',
					//     label: 'Start Date',
					//     required: true,
					//     disabled: false,
					// })
					.input('type', {
						type: 'select',
						label: 'Type',
						required: true,
						disabled: false,
						options: ['Monthly', 'Yearly']
					})
					.prompt({
						title: 'New Budget',
						send: false
					});

				if (res.isErr()) {
					console.error(res.error);
					return;
				}

				const data = res.value.value;
				// const date = new Date(data.startDate);
				// date.setHours(0, 0, 0, 0);
				const budgetRes = await Budgeting.Budgets.new({
					name: data.name,
					description: data.description,
					amount: Math.round(Number(data.amount) * 100),
					// startDate: date.toISOString(),
					type: data.type.toLowerCase()
				});

				location.reload();
			}}
		>
			<i class="material-icons">add</i>
			Add Budget
		</button>
	</div>
</div>
