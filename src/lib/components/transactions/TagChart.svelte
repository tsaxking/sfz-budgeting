<script lang="ts">
	import type { Transactions } from "$lib/model/transactions";
	import { onMount } from "svelte";
    import { Chart } from "chart.js";

    interface Props {
        transactions: Transactions.TransactionData[];
        transactionTags: {
            [key: string]: Transactions.TransactionTagData[];
        };
        tags: Transactions.TagData[];
    };

    const { transactionTags, transactions, tags }: Props = $props();
    const pivot: {
        tag: Transactions.TagData;
        transactions: Transactions.TransactionData[];
    }[] = $state([]);

    for (const id of Object.keys(transactionTags)) {
        const transaction = transactions.find(t => t.data.id === id);

        if (!transaction) {
            continue;
        }

        const ttags = transactionTags[id];
        if (!ttags) {
            continue;
        }
        for (const tt of ttags) {
            const tag = tags.find(t => t.data.id === tt.data.tagId);
            if (!tag) {
                continue;
            }
            const id = String(tt.data.tagId);
            const pivotTag = pivot.find(p => p.tag.data.id === id);
            if (pivotTag) {
                pivotTag.transactions.push(transaction);
            } else {
                pivot.push({
                    tag,
                    transactions: [transaction],
                });
            }
        }
    }

    let chart: Chart;

    const render = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: pivot.map(p => String(p.tag.data.name)),
                datasets: [
                    {
                        label: 'Transactions',
                        data: pivot.map(p => p.transactions.reduce((acc, cur) => {
                            return acc + Number(cur.data.amount) / 100;
                        }, 0))
                    }
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    };

    onMount(() => {
        render();
    });

    let canvas: HTMLCanvasElement;
</script>

<div class="card layer-3" style="height: 500px;">
    <canvas bind:this={canvas} class="h-100"></canvas>
</div>