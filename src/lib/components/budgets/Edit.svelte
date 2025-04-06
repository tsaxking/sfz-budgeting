<script lang="ts">
	import { Budgeting } from "$lib/model/budgets";
	import { Transactions } from "$lib/model/transactions";
	import { DataArr } from "drizzle-struct/front-end";
	import { onMount } from "svelte";
	import Tag from "../tags/Tag.svelte";
	import { dateString } from "ts-utils/clock";

    interface Props {
        budget: Budgeting.BudgetData;
        tags: Budgeting.BudgetTagData[];
    };

    const { budget, tags }: Props = $props();

    let name = $state(budget.data.name);
    let description = $state(budget.data.description);
    let amount = $state(Number(budget.data.amount) / 100);
    let type = $state(budget.data.type);
    let selectedTags = $state(new Set(tags.map(t => t.data.tagId)));


    let allTags = $state(new DataArr(Transactions.Tags, []));


    onMount(() => {
        allTags = Transactions.Tags.all(false);
    });

    export const save = async () => {
        budget.update(b => ({
            ...b,
            name: name,
            description: description,
            amount: amount * 100,
            type: type?.toLowerCase(),
        }));
        await saveTags();
        location.reload(); // to refresh the tags
    };

    const saveTags = async () => {
        const promises: Promise<unknown>[] = [];
        for (const tag of tags) promises.push(tag.delete());
        for (const tagId of Array.from(selectedTags).filter(Boolean)) {
            promises.push(Budgeting.BudgetTags.new({
                tagId: tagId,
                budgetId: String(budget.data.id),
            }));
        }
        return Promise.all(promises);
    };
</script>

<div class="container-fluid">
    <div class="row mb-3">
        <label for="budget-name-{$budget.id}" class="form-label">Name</label>
        <input bind:value={name} type="email" class="form-control" id="budget-name-{$budget.id}">
    </div>
    <div class="row mb-3">
        <label for="budget-description-{$budget.id}" class="form-label">Description</label>
        <textarea bind:value={description} class="form-control" id="budget-description-{$budget.id}" rows="3">
        </textarea>
    </div>
    <div class="row mb-3">
        <label for="budget-amount-{$budget.id}" class="form-label">Amount</label>
        <input bind:value={amount} type="number" class="form-control" id="budget-amount-{$budget.id}">
    </div>
    <div class="row mb-3">
        <label for="budget-type-{$budget.id}" class="form-label">Type</label>
        <select bind:value={type} class="form-select" id="budget-type-{$budget.id}">
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
        </select>
    </div>
    <div class="row mb-3">
        <p>Tags</p>
        <ul class="list">
            {#each $allTags as tag}
                <li class="list-item">
                    <div class="d-flex">
                        <input type="checkbox" class="form-check" id="budget-tag-{tag.data.id}" autocomplete="off" checked={selectedTags.has(tag.data.id)} onchange={(event) => {
                            if (event.currentTarget.checked) {
                                selectedTags.add(tag.data.id);
                            } else {
                                selectedTags.delete(tag.data.id);
                            }
                        }} />
                        <label class="ms-3" for="budget-tag-{tag.data.id}">
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
</div>