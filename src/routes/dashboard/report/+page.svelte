<script lang="ts">
	import Chart from '$lib/components/transactions/Chart.svelte';
	import TagChart from '$lib/components/transactions/TagChart.svelte';
	import Transactions from '$lib/components/transactions/Transactions.svelte';
	import nav from '$lib/imports/budget.js';
	import { months } from 'ts-utils/clock';
	nav();

	const { data } = $props();
	const transactions = $state(data.transactions);
	const transactionTags = $state(data.transactionTags);
	const buckets = $state(data.buckets);
	const endBalance = $state(data.endBalance);
	const startBalance = $state(data.startBalance);
	const tags = $state(data.tags);

	let renderedTransactions = $state(transactions.data);

	let from = $state(data.from);
	let to = $state(data.to);

	const years: number[] = $state([]);
	for (let i = new Date().getFullYear(); i >= 2023; i--) {
		years.push(i);
	}

	const go = (from: Date, to: Date) => {
		const params = new URLSearchParams();
		params.set('from', from.toDateString());
		params.set('to', to.toDateString());
		const url = new URL(window.location.href);
		url.search = params.toString();
		window.history.pushState({}, '', url);
		window.location.reload();
	};
</script>

<div class="container layer-1">
	<div class="row mb-3">
		<div class="col-12">
			<h1>Report</h1>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col-md-4">
			<input
				type="date"
				class="form-control"
				bind:value={from}
				onchange={(e) => {
					const date = new Date(e.currentTarget.value);
					go(date, new Date(to));
				}}
			/>
		</div>
		<div class="col-md-4">
			<input
				type="date"
				class="form-control"
				bind:value={to}
				onchange={(e) => {
					const date = new Date(e.currentTarget.value);
					go(new Date(from), date);
				}}
			/>
		</div>
		<div class="col-md-4">
			<select
				class="form-select"
				onchange={(e) => {
					const value = e.currentTarget.value;
					const [y, month] = value.split(' ');
					const year = Number(y);
					if (month) {
						const start = new Date(year, months.indexOf(month), 1);
						const end = new Date(year, months.indexOf(month) + 1, 0);
						go(start, end);
					} else {
						const start = new Date(year, 0, 1);
						const end = new Date(year, 11, 31);
						go(start, end);
					}
				}}
			>
				<option disabled selected>Select A Period</option>
				{#each years as year}
					<option value={year}>{year}</option>
					{#each months.slice().reverse() as month}
						<option value="{year} {month}">{month} {year}</option>
					{/each}
				{/each}
			</select>
		</div>
	</div>
	<div class="row mb-3">
		<div style="height: 500px;">
			<Transactions {transactions} {transactionTags} onfilter={(transactions) => renderedTransactions = transactions}/>
		</div>
	</div>
	<hr />
	<div class="row mb-3">
		<h3>All Transactions</h3>
		<div style="height: 500px;">
			<Chart transactions={renderedTransactions} balance={startBalance} classes="layer-3" />
		</div>
	</div>
	<hr />
	<div class="row mb-3">
		<h3>Tag Transactions</h3>
		{#key renderedTransactions}
			<TagChart transactions={renderedTransactions} {transactionTags} tags={$tags} />
		{/key}
	</div>
</div>
