<script lang="ts">
    import { Transactions } from '$lib/model/transactions';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
    import { dateString } from 'ts-utils/clock';
	import Tag from '../tags/Tag.svelte';

    interface Props {
        transaction: Transactions.TransactionData;
        tags: Transactions.TransactionTagData[];
    }

    const { transaction, tags }: Props = $props();

    let name = $state(transaction.data.name);
    let description = $state(transaction.data.description);
    let amount = $state(Number(transaction.data.amount) / 100);
    let date = $state(dateString('YYYY-MM-DDThh:mm')(new Date(String(transaction.data.date))));
    let reviewed = $state(!!transaction.data.reviewed);
    let allTags = $state(new DataArr(Transactions.Tags, []));
    let selectedTags = $state(new Set(tags.map(t => t.data.tagId)))

    export const save = async () => {
        transaction.update(t => ({
            ...t,
            name: name,
            description: description,
            amount: amount * 100,
            date: new Date(date).toISOString(),
            reviewed: reviewed,
        }));
        await saveTags();
        location.reload(); // to refresh the tags
    }

    onMount(() => {
        allTags = Transactions.Tags.all(false);
    });

    const saveTags = async () => {
        const promises: Promise<unknown>[] = [];
        for (const tag of tags) promises.push(tag.delete());
        for (const tagId of Array.from(selectedTags).filter(Boolean)) {
            promises.push(Transactions.TransactionTags.new({
                tagId: tagId,
                transactionId: String(transaction.data.id),
            }));
        }
        return Promise.all(promises);
    };
</script>

<div class="container-fluid">
    <div class="row mb-3">
        <label for="transaction-name-{$transaction.id}" class="form-label">Name</label>
        <input bind:value={name} type="email" class="form-control" id="transaction-name-{$transaction.id}">
    </div>
    <div class="row mb-3">
        <label for="transaction-description-{$transaction.id}" class="form-label">Description</label>
        <textarea bind:value={description} class="form-control" id="transaction-description-{$transaction.id}" rows="3">
        </textarea>
    </div>
    <div class="row mb-3">
        <div class="col-md-6">
            <label for="transaction-amount-{$transaction.id}" class="form-label">Amount</label>
            <input bind:value={amount} type="number" class="form-control" id="transaction-amount-{$transaction.id}">
        </div>
        <div class="col-md-6">
            <label for="transaction-date-{$transaction.id}" class="form-label">Date</label>
            <input bind:value={date} type="datetime-local" class="form-control" id="transaction-date-{$transaction.id}">
        </div>
    </div>
    <div class="row mb-3">
        <p>Tags</p>
        <ul class="list">
            {#each $allTags as tag}
                <li class="list-item">
                    <div class="d-flex">
                        <input type="checkbox" class="form-check" id="transaction-tag-{tag.data.id}" autocomplete="off" checked={selectedTags.has(tag.data.id)} onchange={(event) => {
                            if (event.currentTarget.checked) {
                                selectedTags.add(tag.data.id);
                            } else {
                                selectedTags.delete(tag.data.id);
                            }
                            console.log('selectedTags', selectedTags);
                        }} />
                        <label class="ms-3" for="transaction-tag-{tag.data.id}">
                            <Tag
                                name={tag.data.name || ''}
                                color={tag.data.color || ''}
                            />
                        </label>
                    </div>
                </li>
            {/each}
        </ul>
    </div>
    <div class="row mb-3">
        <input type="checkbox" class="btn-check" id="transaction-reviewed-{$transaction.id}" autocomplete="off" bind:checked={reviewed}>  
        <label class="btn btn-outline-success" for="transaction-reviewed-{$transaction.id}">Reviewed</label>
    </div>
</div>