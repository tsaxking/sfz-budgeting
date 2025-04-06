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
    nav();

    const { data } = $props();

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
                                <p class="card-text">Balance: ${(Number(bucket.data.balance) / 100).toFixed(2)}</p>
                            </a>
                        </li>
                    {/each}
                </ul>
            {/snippet}
        </Card>
    {/snippet}
</DB>