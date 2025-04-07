<script lang="ts">
	import { Transactions } from '$lib/model/transactions';
	import { loadFileContents } from '$lib/utils/downloads.js';
	import { alert, confirm, prompt, rawModal } from '$lib/utils/prompts.js';
	import { mount } from 'svelte';
	import { cost } from 'ts-utils/text';
	import New from '../transactions/New.svelte';

	interface Props {
		bucket: Transactions.BucketData;
	}

	const { bucket }: Props = $props();
</script>

<div class="container-fluid">
	<div class="row mb-3">
		<div class="col">
			<h5>
				Balance: {cost(Number($bucket.balance) / 100)}
				<button
					type="button"
					class="btn"
					onclick={async () => {
						const res = await prompt('Set new balance', {
							type: 'number',
							default: String(Number($bucket.balance) / 100)
						});
						console.log(res);
						if (res === null) {
							return;
						}
						const newBalance = Number(res);
						if (isNaN(newBalance)) {
							alert('Invalid balance');
							return;
						}

						if (
							!(await confirm(`Are you sure you want to set the balance to ${cost(newBalance)}?`, {
								title: 'Set Balance'
							}))
						) {
							return;
						}

						bucket.update((b) => ({
							...b,
							balance: Math.round(newBalance * 100)
						}));
					}}
				>
					<i class="material-icons">edit</i>
				</button>
			</h5>
		</div>
	</div>

	<div class="row mb-3">
		<button
			type="button"
			class="btn btn-primary"
			onclick={async () => {
				const res = await loadFileContents();
				if (res.isErr()) {
					alert('Error: failed to load file');
					console.error(res.error);
					return;
				}
				const [file] = res.value;
				if (!file) {
					alert('Error: no file selected');
					console.error('No file selected');
					return;
				}

				// headers of the csv must have:
				// Description, Amount, Date

				const headers = file.text
					.split('\n')[0]
					.split(',')
					.map((h) => h.trim().replaceAll('"', ''));
				const descriptionIndex = headers.indexOf('Description');
				const amountIndex = headers.indexOf('Amount');
				const dateIndex = headers.indexOf('Date');
				if (descriptionIndex === -1 || amountIndex === -1 || dateIndex === -1) {
					alert('Invalid CSV file, headers must include: Description, Amount, Date');
					console.error('Invalid CSV file, headers must include: Description, Amount, Date');
					return;
				}

				if (!(await confirm('Are you sure you want to import this file?'))) {
					return;
				}

				const forceReview = await confirm('Do you want to approve all the transactions?');

				const importRes = await Transactions.csvImport(file.name, file.text, bucket, forceReview);

				if (importRes.isErr()) {
					alert('Error: failed to import file');
					console.error(importRes.error);
					return;
				}

				if (!importRes.value.success) {
					alert('Error: failed to import file');
					console.error(importRes.value.message);
					return;
				}
			}}
		>
			<i class="material-icons"> upload </i>
			Import CSV
		</button>
		<button
			type="button"
			class="btn btn-success"
			onclick={async () => {
				let save = () => new Promise<boolean>((res) => res(false));
				const m = rawModal(
					'Create Transaction',
					[
						{
							text: 'Close',
							color: 'secondary',
							onClick: () => m.hide()
						},
						{
							text: 'Save',
							color: 'success',
							onClick: async () => {
								const res = await save();
								if (!res) return;
								m.hide();
								location.reload();
							}
						}
					],
					(body) => {
						const newTransaction = mount(New, {
							target: body,
							props: {
								bucket
							}
						});
						save = newTransaction.save.bind(newTransaction);
						return newTransaction;
					}
				);
				m.show();
			}}
		>
			<i class="material-icons">add</i>
			New Transaction
		</button>
	</div>
</div>
