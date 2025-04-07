<script lang="ts">
	import { onMount } from 'svelte';
	import {
		createGrid,
		ModuleRegistry,
		ClientSideRowModelModule,
		type GridOptions,
		themeQuartz,
		PaginationModule,
		type GridApi,
		QuickFilterModule,
		ValidationModule,
		RowAutoHeightModule,
		ColumnAutoSizeModule,
		TextFilterModule,
		NumberFilterModule,
		ClientSideRowModelApiModule,
		EventApiModule,
		DateFilterModule,
		RowApiModule
	} from 'ag-grid-community';

	// import "ag-grid-community/styles/ag-grid.css";
	// import "ag-grid-community/styles/ag-theme-balham.css";
	import { Transactions } from '$lib/model/transactions';
	import { dateTime } from 'ts-utils/clock';
	import { cost } from 'ts-utils/text';
	import { confirm, rawModal } from '$lib/utils/prompts';
	import { mount } from 'svelte';
	import Details from './Details.svelte';
	import { DataArr } from 'drizzle-struct/front-end';
	import BulkUpdate from './BulkUpdate.svelte';
	import { writable } from 'svelte/store';

	// Register AG Grid Modules
	ModuleRegistry.registerModules([
		ClientSideRowModelModule,
		PaginationModule,
		QuickFilterModule,
		ValidationModule,
		RowAutoHeightModule,
		ColumnAutoSizeModule,
		TextFilterModule,
		NumberFilterModule,
		ClientSideRowModelApiModule,
		EventApiModule,
		DateFilterModule,
		RowApiModule
	]);

	interface Props {
		transactions: Transactions.TransactionArr;
		transactionTags: { [key: string]: Transactions.TransactionTagData[] };
	}

	const { transactions, transactionTags }: Props = $props();

	let tags = new DataArr(Transactions.Tags, []);
	let gridDiv: HTMLDivElement;

	let income: number = $state(0);
	let expenses: number = $state(0);
	let total: number = $state(0);
	let bulkUpdateTransactions: Transactions.TransactionData[] = $state([]);

	const columnDefs: GridOptions['columnDefs'] = [
		{
			headerName: 'Name',
			field: 'data.name',
			filter: true
		},
		{
			headerName: 'Amount',
			width: 100,
			field: 'data.amount',
			filter: true,
			cellRenderer: ({ value }) => {
				const amt = Number(value);
				const cls = amt > 0 ? 'text-success' : amt < 0 ? 'text-danger' : '';
				return `<span class="${cls}">${cost(amt)}</span>`;
			}
		},
		{
			headerName: 'Date',
			field: 'data.date',
			filter: true,
			valueFormatter: ({ value }) => dateTime(value)
		},
		{
			width: 100,
			headerName: 'Reviewed',
			filter: true,
			cellRenderer: ({ data }) => {
				const reviewed = data.data.reviewed;
				const icon = reviewed ? 'check_circle' : 'cancel';
				const color = reviewed ? 'text-success' : 'text-danger';
				return `<button class="btn" data-action="review" data-id="${data.data.id}">
					<i class="material-icons ${color}">${icon}</i>
				</button>`;
			}
		},
		{
			headerName: 'Details',
			filter: true,
			field: 'data.description',
			cellRenderer: ({ data }) => {
				const description = data.data.description || '';
				return `<span class="text-truncate" style="max-width: 200px;" title="${description}">${description}</span>`;
			}
		},
		{
			headerName: 'Tags',
			filter: true,
			field: 'tags',
			cellRenderer: ({ data }) => {
				const tagList = transactionTags[String(data.data.id)] || [];
				return tagList
					.map((tag) => {
						const tagDef = tags.data.find((t) => String(t.data.id) === String(tag.data.tagId));
						if (!tagDef) return '';
						return `<span class="badge me-1" style="background:${tagDef.data.color}">${tagDef.data.name}</span>`;
					})
					.join(' ');
			}
		},
		{
			width: 100,
			filter: true,
			headerName: 'View',
			cellRenderer: ({ data }) => {
				return `<button class="btn" data-action="details" data-id="${data.data.id}">
					<i class="material-icons">info</i>
				</button>`;
			}
		},
		{
			width: 100,
			headerName: 'Update',
			cellRenderer: ({ data }) => {
				const has = bulkUpdateTransactions.find((t) => String(t.data.id) === String(data.data.id));
				const checked = has ? 'checked' : '';
				// Just a checkbox to select the transaction for bulk update
				return `<input type="checkbox" class="form-check" data-id="${data.data.id}" ${checked} />`;
			},
			// If the checkbox is checked, add the transaction to the selected transactions
			onCellClicked: (event) => {
				const target = (event.event?.target as HTMLElement)?.closest(
					"input[type='checkbox']"
				) as HTMLInputElement;
				if (!target) return;
				const transactionId = target.dataset.id;
				const transaction = $transactions.find((t) => String(t.data.id) === transactionId);
				if (!transaction) return;
				if (target.checked) {
					if (bulkUpdateTransactions.find((t) => String(t.data.id) === transactionId)) return;
					bulkUpdateTransactions.push(transaction);
				} else {
					bulkUpdateTransactions = bulkUpdateTransactions.filter(
						(t) => String(t.data.id) !== transactionId
					);
				}
			}
		}
	];

	const checkAll = () => {
		grid.forEachNodeAfterFilter((node) => {
			const data = node.data as Transactions.TransactionData;
			if (bulkUpdateTransactions.find((t) => String(t.data.id) === String(data.data.id))) return;
			bulkUpdateTransactions.push(data);
			const el = document.querySelector(
				`input[type='checkbox'][data-id="${data.data.id}"]`
			) as HTMLInputElement;
			if (el) {
				el.checked = true;
			}
		});
	};

	const handleActionClick = async (event: Event) => {
		const target = (event.target as HTMLElement).closest('button');
		if (!target) return;

		const action = target.dataset.action;
		const id = target.dataset.id;
		const transaction = $transactions.find((t) => String(t.data.id) === id);
		if (!transaction) return;

		if (action === 'details') {
			let save = () => {};
			const m = rawModal(
				'Transaction Details',
				[
					{ text: 'Close', color: 'secondary', onClick: () => m.hide() },
					{ text: 'Save', color: 'success', onClick: () => save() },
					{
						text: 'Delete',
						color: 'danger',
						onClick: async () => {
							const res = await confirm('Delete this transaction?', { title: 'Delete' });
							if (!res) return;
							transaction.delete();
							m.hide();
							location.reload();
						}
					}
				],
				(body) => {
					const details = mount(Details, {
						target: body,
						props: { transaction, tags: transactionTags[String(transaction.data.id)] }
					});
					save = details.save.bind(details);
					return details;
				}
			);
			m.show();
		} else if (action === 'review') {
			const reviewed = !transaction.data.reviewed;
			const res = await confirm(
				`Are you sure you want to ${reviewed ? 'review' : 'unreview'} this transaction?`,
				{ title: 'Review Transaction' }
			);
			if (!res) return;
			transaction.update((t) => ({ ...t, reviewed }));
		}
	};

	let grid: ReturnType<typeof createGrid>;

	const render = () => {
		if (grid) grid.destroy();

		const darkTheme = themeQuartz.withParams({
			backgroundColor: '#212529',
			browserColorScheme: 'dark',
			chromeBackgroundColor: {
				ref: 'foregroundColor',
				mix: 0.07,
				onto: 'backgroundColor'
			},
			foregroundColor: '#FFF',
			headerFontSize: 14
		});

		const gridOptions: GridOptions = {
			columnDefs,
			rowData: $transactions.map((t) => ({
				data: {
					...t.data,
					amount: Number(t.data.amount) / 100,
					date: new Date(String(t.data.date))
				},
				tags: (transactionTags[String(t.data.id)] || [])
					.map((t) => {
						return tags.data.find((tag) => String(tag.data.id) === String(t.data.tagId));
					})
					.filter(Boolean)
					.map((t) => t.data.name)
					.join(' ')
			})),
			rowHeight: 50,
			onCellClicked: (event) => {
				if (event.event) handleActionClick(event.event);
			},
			defaultColDef: {
				resizable: true,
				sortable: true
			},
			theme: darkTheme
		};

		grid = createGrid(gridDiv, gridOptions);

		renderSummary();

		grid.addEventListener('filterChanged', renderSummary);
	};

	const renderSummary = () => {
		income = 0;
		expenses = 0;
		total = 0;

		grid.forEachNodeAfterFilter((node) => {
			const data = node.data as Transactions.TransactionData;
			if (Number(data.data.amount) > 0) {
				income += Number(data.data.amount);
			} else {
				expenses += Number(data.data.amount) * -1;
			}

			total += Number(data.data.amount);
		});
	};

	onMount(() => {
		tags = Transactions.Tags.all(false);

		render();

		const unsubTags = tags.subscribe(() => {
			render();
		});

		return () => {
			unsubTags();
			grid.destroy();
		};
	});

	const uncheckAll = () => {
		grid.forEachNode((node) => {
			const data = node.data as Transactions.TransactionData;
			const el = document.querySelector(
				`input[type='checkbox'][data-id="${data.data.id}"]`
			) as HTMLInputElement;
			if (el) {
				el.checked = false;
			}
		});
		bulkUpdateTransactions = [];
	};

	const bulkUpdate = async () => {
		if (bulkUpdateTransactions.length === 0) {
			const doThis = await confirm(
				'No transactions selected for bulk update. Apply to all that are filtered?'
			);
			if (!doThis) return;

			checkAll();
			if (bulkUpdateTransactions.length === 0) {
				alert('No transactions found');
				return;
			}
		}

		let save = () => {};
		const m = rawModal(
			`Bulk Update Transactions (${bulkUpdateTransactions.length})`,
			[
				{ text: 'Close', color: 'secondary', onClick: () => m.hide() },
				{ text: 'Save', color: 'success', onClick: () => save() }
			],
			(body) => {
				const bulk = mount(BulkUpdate, {
					target: body,
					props: {
						transactions: bulkUpdateTransactions,
						transactionTags
					}
				});
				save = bulk.save.bind(bulk);
				return bulk;
			}
		);

		m.show();
	};
</script>

<div class="h-100 d-flex flex-column">
	<div class="d-flex justify-content-between align-items-center mb-2">
		<p>
			Net: <span class="text-success">{cost(total)}</span>
		</p>
		<p>
			Expenses: <span class="text-danger">{cost(expenses)}</span>
		</p>
		<p>
			Income: <span class="text-success">{cost(income)}</span>
		</p>
		<div class="btn-group" role="group">
			<button type="button" class="btn btn-primary" onclick={checkAll}>Select All</button>
			<button type="button" class="btn btn-secondary" onclick={uncheckAll}>Unselect All</button>
			<button type="button" class="btn btn-primary" onclick={bulkUpdate}
				>Bulk Update ({bulkUpdateTransactions.length})</button
			>
		</div>
	</div>
	<div bind:this={gridDiv} class="ag-theme-balham ag-grid w-100" style="flex: 1"></div>
</div>
