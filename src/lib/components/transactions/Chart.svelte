<script lang="ts">
	import type { Transactions } from '$lib/model/transactions';
	import { Chart } from 'chart.js';
	import { onMount } from 'svelte';

	interface Props {
		transactions: Transactions.TransactionData[];
		balance?: number;
		type?: 'days' | 'weeks' | 'months'; // default 'days'
		classes?: string;
	}

	let { transactions, balance = 0, type = 'days', classes = '' }: Props = $props();

	$effect(() => render(type));

	let canvas: HTMLCanvasElement;
	let chart: Chart;

	const groupTransactions = (
		transactions: Transactions.TransactionData[],
		type: 'days' | 'weeks' | 'months'
	) => {
		const map = new Map<string, { income: number; expense: number }>();

		for (const tx of transactions) {
			let date: string;
			const d = new Date(String(tx.data.date));
			if (type === 'days') {
				date = d.toISOString().split('T')[0];
			} else if (type === 'weeks') {
				const weekStart = new Date(d);
				weekStart.setDate(d.getDate() - d.getDay());
				date = weekStart.toISOString().split('T')[0];
			} else {
				date = d.toISOString().slice(0, 7); // YYYY-MM
			}

			const entry = map.get(date) ?? { income: 0, expense: 0 };
			const amt = Number(tx.data.amount) / 100;

			if (amt >= 0) entry.income += amt;
			else entry.expense -= Math.abs(amt);

			map.set(date, entry);
		}

		const dates = Array.from(map.keys()).sort();
		let runningBalance = balance;
		const incomes: number[] = [];
		const expenses: number[] = [];
		const balances: number[] = [];

		for (const date of dates) {
			const entry = map.get(date)!;
			runningBalance += entry.income + entry.expense;
			incomes.push(entry.income);
			expenses.push(entry.expense);
			balances.push(runningBalance);
		}

		return { labels: dates, incomes, expenses, balances };
	};

	const render = (type: 'days' | 'weeks' | 'months') => {
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return console.error('Failed to get canvas context');
		if (chart) chart.destroy();

		const { labels, incomes, expenses, balances } = groupTransactions(transactions, type);

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: 'Income',
						data: incomes,
						// borderColor: "green",
						// backgroundColor: "rgba(0, 128, 0, 0.1)",
						fill: true,
						tension: 0.3
					},
					{
						label: 'Expenses',
						data: expenses,
						// borderColor: "red",
						// backgroundColor: "rgba(255, 0, 0, 0.1)",
						fill: true,
						tension: 0.3
					},
					{
						label: 'Balance',
						data: balances,
						// borderColor: "blue",
						// backgroundColor: "rgba(0, 0, 255, 0.1)",
						fill: false,
						tension: 0.3
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {}
			}
		});
	};

	onMount(() => {
		render(type);
	});
</script>

<div class="card h-100 {classes}">
	<div class="card-body h-100">
		<div class="btn-group" role="group" aria-label="Transaction Chart Type">
			<input
				type="radio"
				class="btn-check"
				name="chart-type"
				id="chart-days"
				value="days"
				bind:group={type}
			/>
			<label class="btn btn-outline-primary" for="chart-days">Days</label>

			<input
				type="radio"
				class="btn-check"
				name="chart-type"
				id="chart-weeks"
				value="weeks"
				bind:group={type}
			/>
			<label class="btn btn-outline-primary" for="chart-weeks">Weeks</label>

			<input
				type="radio"
				class="btn-check"
				name="chart-type"
				id="chart-months"
				value="months"
				bind:group={type}
			/>
			<label class="btn btn-outline-primary" for="chart-months">Months</label>
		</div>

		<canvas bind:this={canvas} style="flex: 1;"></canvas>
	</div>
</div>
