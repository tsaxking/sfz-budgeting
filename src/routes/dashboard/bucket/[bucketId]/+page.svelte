<script lang="ts">
	import { Dashboard } from '$lib/model/dashboard.js';
	import { Transactions } from '$lib/model/transactions.js';
	import { loadFileContents } from '$lib/utils/downloads.js';
	import { alert } from '$lib/utils/prompts.js';
	import DB from '$lib/components/dashboard/Dashboard.svelte';
	import Card from '$lib/components/dashboard/Card.svelte';
	import Balance from '$lib/components/bucket/Balance.svelte';
	import BucketTransactions from '$lib/components/transactions/BucketTransactions.svelte';
	import TagList from '$lib/components/tags/TagList.svelte';
	import { listen } from '$lib/utils/struct-listener.js';
	import { onMount } from 'svelte';
	import nav from '$lib/imports/budget.js';
	import Chart from '$lib/components/transactions/Chart.svelte';
	nav();

	const { data } = $props();
	const bucket = $derived(data.bucket);
	const transactions = $state(data.transactions);
	transactions.sort((a, b) => {
		const aDate = new Date(String(a.data.date));
		const bDate = new Date(String(b.data.date));
		return bDate.getTime() - aDate.getTime();
	});
	const transactionTags = $state(data.transactionTags);

	const balance = new Dashboard.Card({
		name: 'Balance',
		icon: 'account_balance',
		id: 'balance',
		iconType: 'material-icons',
		size: {
			height: 1,
			width: 1
		}
	});

	const transactionCard = new Dashboard.Card({
		name: 'Transactions',
		icon: 'list',
		id: 'transactions',
		iconType: 'material-icons',
		size: {
			height: 1,
			width: 2
		}
	});

	const tags = new Dashboard.Card({
		name: 'Tags',
		icon: 'label',
		id: 'tags',
		iconType: 'material-icons',
		size: {
			height: 1,
			width: 1
		}
	});

	const chart = new Dashboard.Card({
		name: 'Chart',
		icon: 'show_chart',
		id: 'chart',
		iconType: 'material-icons',
		size: {
			height: 1,
			width: 2
		}
	});

	const dashboard = $state(
		new Dashboard.Dashboard({
			cards: [balance, transactionCard, tags, chart],
			id: 'bucket',
			name: `Bucket: ${$bucket.name}`
		})
	);

	onMount(() => {
		const offTransactions = listen(transactions, (t) => t.data.bucketId === bucket.data.id);
		return () => {
			offTransactions();
		};
	});
</script>

<DB {dashboard}>
	{#snippet body()}
		<Card card={balance}>
			{#snippet body()}
				<Balance {bucket} />
			{/snippet}
		</Card>
		<Card card={transactionCard}>
			{#snippet body()}
				<BucketTransactions {bucket} {transactionTags} {transactions} />
			{/snippet}
		</Card>
		<Card card={tags}>
			{#snippet body()}
				<TagList />
			{/snippet}
		</Card>
		<Card card={chart}>
			{#snippet body()}
				<Chart
					transactions={$transactions}
					balance={(Number(bucket.data.balance) -
						$transactions.reduce((acc, t) => acc + Number(t.data.amount), 0)) /
						100}
				/>
			{/snippet}
		</Card>
	{/snippet}
</DB>
