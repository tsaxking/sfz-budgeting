<script lang="ts">
	import { Dashboard } from "$lib/model/dashboard";
	import { Transactions } from "$lib/model/transactions";
	import { Form } from "$lib/utils/form";
	import { listen } from "$lib/utils/struct-listener.js";
	import { DataArr, Struct } from "drizzle-struct/front-end";
	import { onMount } from "svelte";
    import DB from '$lib/components/dashboard/Dashboard.svelte';
    import Card from "$lib/components/dashboard/Card.svelte";
    import nav from '$lib/imports/budget.js';
	import { cost } from "ts-utils/text";
	import Progress from "$lib/components/budgets/Progress.svelte";
    nav();

    const { data } = $props();


    const budgets = $state(data.budgets);

    const total = $derived(budgets.reduce((acc, b) => acc + Number(b.budget.data.amount), 0));
    const spent = $derived(budgets.reduce((acc, b) => acc + Number(b.transactions.reduce((acc, t) => acc + Number(t.data.amount), 0)), 0) * -1);
    const left = $derived(total - spent);
    let buckets = $state(new DataArr(Transactions.Buckets, data.buckets));

    onMount(() => {
        listen(buckets, () => true);
    });

    const bucketCard = new Dashboard.Card({
        name: 'Buckets',
        icon: 'account_balance',
        id: 'buckets',
        iconType: 'material-icons',
        size: {
            height: 1,
            width: 1,
        }
    });

    const budgetCard = new Dashboard.Card({
        name: 'Budgets',
        icon: 'account_balance',
        id: 'budgets',
        iconType: 'material-icons',
        size: {
            height: 1,
            width: 1,
        },
    });

    const dashboard = $state(new Dashboard.Dashboard({
        name: 'Dashboard',
        cards: [bucketCard],
        id: 'dashboard',
    }));
</script>

<DB {dashboard}>
    {#snippet body()}
        <Card card={bucketCard}>
            {#snippet body()}
            <button class="btn btn-primary w-100" onclick={async () => {
                const res = await new Form()
                    .input('name', {
                        type: 'text',
                        label: 'Name',
                        required: true,
                        disabled: false,
                    })
                    .input('description', {
                        type: 'text',
                        label: 'Description',
                        required: false,
                        disabled: false,
                    })
                    .input('balance', {
                        type: 'number',
                        label: 'Balance',
                        required: true,
                        disabled: false,
                    })
                    .prompt({
                        title: 'New Bucket',
                        send: false,
                    });

                if (res.isOk()) {
                    console.log(res.value);
                    const newRes = await Transactions.Buckets.new({
                        name: res.value.value.name,
                        description: res.value.value.description,
                        balance: Math.round(Number(res.value.value.balance) * 100),
                        color: '#000000',
                        icon: 'account_balance',
                        type: 'bucket',
                        isDefault: $buckets.length === 0,
                    });
                    console.log(newRes);
                }

            }}>
                <i class="material-icons">
                    add
                </i>
                New Bucket
            </button>
                <ul class="list p-0">
                    {#each $buckets as bucket}
                        <li class="list-item">
                            <a href="/dashboard/bucket/{bucket.data.id}" class="btn w-100 h-100 text-start">
                                <h5 class="card-title">{bucket.data.name}</h5>
                                <p class="card-text">Balance: {cost(Number(bucket.data.balance) / 100)}</p>
                            </a>
                        </li>
                    {/each}
                </ul>
            {/snippet}
        </Card>
        <Card card={budgetCard}>
            {#snippet body()}
                <div class="container-fluid" style="overflow-y: auto; max-height: 100%;">
                    <div class="row mb-3">
                        <div class="card layer-3">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h5>
                                        Budget Overview
                                        <small class="text-muted">
                                            {#if spent > total}
                                                <span class="text-danger">{(left / 100).toLocaleString('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                })} Over Budget</span>
                                            {:else if spent === total}
                                                <span class="text-warning">
                                                    {(left / 100).toLocaleString('en-US', {
                                                        style: 'currency',
                                                        currency: 'USD',
                                                    })} At Budget
                                                </span>
                                            {:else}
                                                <span class="text-success">
                                                    {(left / 100).toLocaleString('en-US', {
                                                        style: 'currency',
                                                        currency: 'USD',
                                                    })} Under Budget
                                                </span>
                                            {/if}
                                        </small>
                                    </h5>
                                </div>
                                <div class="progress position-relative p-0">
                                    <div class="progress-bar"
                                        style="width: {(spent / total) * 100}%;"
                                    >
                                    </div>
                                    <p class="mb-0 position-absolute">
                                        {(spent / 100).toLocaleString('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                        })} of {(total / 100).toLocaleString('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {#each budgets as budget}
                        <div class="row mb-3">
                            <div class="card layer-3">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <h5>
                                            {budget.budget.data.name}
                                        </h5>
                                        <div class="btn-group" role="group">
                                            <a href="/dashboard/budgets/{budget.budget.data.id}" class="btn btn-sm">
                                                <i class="material-icons">visibility</i>
                                            </a>
                                        </div>
                                    </div>
                            <Progress
                            budget={budget.budget}
                            tags={budget.tags}
                            transactions={budget.transactions}
                        />
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/snippet}
        </Card>
    {/snippet}
</DB>