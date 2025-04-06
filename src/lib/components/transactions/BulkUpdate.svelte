<script lang="ts">
	import { Transactions } from "$lib/model/transactions";
	import { DataArr } from "drizzle-struct/front-end";
	import Tag from '../tags/Tag.svelte';
	import { onMount } from "svelte";
	import { alert } from "$lib/utils/prompts";

    interface Props {
        transactions: Transactions.TransactionData[];
        transactionTags: {
            [key: string]: Transactions.TransactionTagData[];
        };
    };

    const { transactions, transactionTags }: Props = $props();

    let allTags = $state(new DataArr(Transactions.Tags, []));
    let selectedTags: string[] | undefined = $state(undefined);
    let intersectTags = $state(new Set<string>());
    let reviewed: boolean|undefined = $state(undefined);
    let name: string|undefined = $state(undefined);

    onMount(() => {
        allTags = Transactions.Tags.all(false);

        const uniqueNames = new Set(transactions.map(t => t.data.name));
        if (uniqueNames.size === 1) {
            name = transactions[0].data.name;
            // nameInput.value = String(name);
        } else {
            name = undefined;
        }

        const uniqueReviewed = new Set(transactions.map(t => t.data.reviewed));
        if (uniqueReviewed.size === 1) {
            reviewed = transactions[0].data.reviewed;
            // reviewedInput.checked = Boolean(reviewed);
        } else {
            reviewed = undefined;
        }

        // if all transactions have the same tags, set selectedTags to that

        const uniqueTags = new Set<string>();
        for (let i = 0; i < transactions.length; i++) {
            const t = transactions[i];
            if (i === 0) {
                const tags = transactionTags[String(t.data.id)];
                if (!tags) continue;
                for (const tag of tags) {
                    uniqueTags.add(String(tag.data.tagId));
                }
            } else {
                const tags = transactionTags[String(t.data.id)];
                if (!tags) continue;
                const tagIds = new Set<string>();
                for (const tag of tags) {
                    tagIds.add(String(tag.data.tagId));
                }
                for (const tag of uniqueTags) {
                    if (!tagIds.has(tag)) {
                        uniqueTags.delete(tag);
                    }
                }
            }
        }

        intersectTags = uniqueTags;
    });

    export const save = async () => {
        const res = await Transactions.bulkUpdate({
            transactions,
            name,
            reviewed,
            tags: selectedTags,
        });

        if (res.isErr()) {
            console.error(res.error);
            alert('Error updating transactions');
        } else {
            const value = res.value;
            if (value.success) {
                location.reload();
            } else {
                alert('Error updating transactions: ' + value.message);
                console.error(value.message);
            }
        }
    };

    // let nameInput: HTMLInputElement;
    // let reviewedInput: HTMLInputElement;
</script>

<div class="container-fluid">
    <div class="row mb-3">
        <label for="bulk-transaction-name" class="form-label">Name</label>
        <input bind:value={name} type="email" class="form-control" id="bulk-transaction-name">
    </div>
    <div class="row mb-3">
        <p>Tags</p>
        <ul class="list">
            {#each $allTags as tag}
                <li class="list-item">
                    <div class="d-flex">
                        <input type="checkbox" class="form-check" id="transaction-tag-{tag.data.id}" autocomplete="off" checked={intersectTags.has(String(tag.data.id))} onchange={(event) => {
                            if (event.currentTarget.checked) {
                                intersectTags.add(String(tag.data.id));
                            } else {
                                intersectTags.delete(String(tag.data.id));
                            }



                            selectedTags = Array.from(intersectTags);
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
        <input bind:checked={reviewed} type="checkbox" class="btn-check" id="bulk-transaction-reviewed" autocomplete="off">  
        <label class="btn btn-outline-success" for="bulk-transaction-reviewed">Reviewed</label>
    </div>
</div>
