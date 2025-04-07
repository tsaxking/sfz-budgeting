<script lang="ts">
    import { Transactions } from '$lib/model/transactions';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
    import { dateString } from 'ts-utils/clock';
	import Tag from '../tags/Tag.svelte';
	import { alert } from '$lib/utils/prompts';

    interface Props {
        bucket: Transactions.BucketData;
    };

    const { bucket }: Props = $props();

    let name = $state('');
    let description = $state('');
    let amount = $state(0);
    let date = $state(dateString('YYYY-MM-DDThh:mm')(new Date()));
    let reviewed = $state(true);
    let allTags = $state(new DataArr(Transactions.Tags, []));
    let selectedTags = $state(new Set<string>([]))

    export const save = async () => {
        const res = await Transactions.createTransaction({
            bucket,
            name,
            description,
            amount,
            date: new Date(date),
            reviewed,
            tags: Array.from(selectedTags),
        });

        if (res.isErr()) {
            alert('Error: failed to create transaction');
            console.error(res.error);
            return false;
        }
        if (!res.value.success) {
            alert('Error: failed to create transaction');
            console.error(res.value.message);
            return false;
        }

        return true;
    }

    onMount(() => {
        allTags = Transactions.Tags.all(false);
    });
</script>

<div class="container-fluid">
    <div class="row mb-3">
        <label for="transaction-name-new" class="form-label">Name</label>
        <input bind:value={name} type="email" class="form-control" id="transaction-name-new">
    </div>
    <div class="row mb-3">
        <label for="transaction-description-new" class="form-label">Description</label>
        <textarea bind:value={description} class="form-control" id="transaction-description-new" rows="3">
        </textarea>
    </div>
    <div class="row mb-3">
        <div class="col-md-6">
            <label for="transaction-amount-new" class="form-label">Amount</label>
            <input bind:value={amount} type="number" class="form-control" id="transaction-amount-new">
        </div>
        <div class="col-md-6">
            <label for="transaction-date-new" class="form-label">Date</label>
            <input bind:value={date} type="datetime-local" class="form-control" id="transaction-date-new">
        </div>
    </div>
    <div class="row mb-3">
        <p>Tags</p>
        <ul class="list">
            {#each $allTags as tag}
                <li class="list-item">
                    <div class="d-flex">
                        <input type="checkbox" class="form-check" id="transaction-tag-{tag.data.id}" autocomplete="off" checked={selectedTags.has(String(tag.data.id))} onchange={(event) => {
                            if (event.currentTarget.checked) {
                                selectedTags.add(String(tag.data.id));
                            } else {
                                selectedTags.delete(String(tag.data.id));
                            }
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
        <input type="checkbox" class="btn-check" id="transaction-reviewed-new" autocomplete="off" bind:checked={reviewed}>  
        <label class="btn btn-outline-success" for="transaction-reviewed-new">Reviewed</label>
    </div>
</div>