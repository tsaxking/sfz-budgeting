<script lang="ts">
	import { Transactions } from '$lib/model/transactions';
	import { Form } from '$lib/utils/form';
	import { Color } from 'colors/color';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import Tag from './Tag.svelte';

	let tags = $state(new DataArr(Transactions.Tags, []));

	onMount(() => {
		tags = Transactions.Tags.all(false);
	});

	const addTag = async () => {
		const tag = await new Form()
			.input('name', {
				type: 'text',
				label: 'Name',
				required: true,
				disabled: false
			})
			.input('description', {
				type: 'text',
				label: 'Description',
				required: true,
				disabled: false
			})
			.input('color', {
				type: 'color',
				label: 'Color',
				required: true,
				disabled: false
			})
			.prompt({
				title: 'New Tag',
				send: false
			});
		if (tag.isOk()) {
			const newTag = await Transactions.Tags.new({
				name: tag.value.value.name,
				description: tag.value.value.description,
				color: tag.value.value.color
			});

			if (newTag.isErr()) {
				alert({
					title: 'Error',
					message: newTag.error,
					type: 'error'
				});
			}
		}
	};

	const editTag = async (tag: Transactions.TagData) => {
		const data = await new Form()
			.input('name', {
				type: 'text',
				label: 'Name',
				required: true,
				disabled: false,
				value: tag.data.name
			})
			.input('description', {
				type: 'text',
				label: 'Description',
				required: true,
				disabled: false,
				value: tag.data.description
			})
			.input('color', {
				type: 'color',
				label: 'Color',
				required: true,
				disabled: false,
				value: tag.data.color
			})
			.prompt({
				title: 'New Tag',
				send: false
			});

		if (data.isOk()) {
			const res = await tag.update((t) => ({
				...t,
				name: data.value.value.name,
				description: data.value.value.description,
				color: data.value.value.color
			}));

			if (res.isErr()) {
				alert({
					title: 'Error',
					message: res.error,
					type: 'error'
				});
			}
		}
	};

	const removeTag = async () => {};
</script>

<ul class="list h-100" style="overflow-y: auto;">
	{#each $tags as tag}
		<li class="list-item">
			<button type="button" class="btn w-100" onclick={() => editTag(tag)}>
				<Tag name={tag.data.name || 'Tag'} color={tag.data.color || '#000000'} />
				{tag.data.description}
			</button>
		</li>
	{/each}

	<li class="list-item">
		<button type="button" class="btn btn-primary w-100" onclick={addTag}>
			<span class="material-icons">add</span>
			Add Tag
		</button>
	</li>
</ul>
