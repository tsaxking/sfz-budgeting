<script lang="ts">
    import { Transactions } from "$lib/model/transactions";
	import { confirm, rawModal } from "$lib/utils/prompts";
	import { dateTime } from "ts-utils/clock";
    import { cost } from 'ts-utils/text';
	import Details from "./Details.svelte";
	import { mount, onMount } from "svelte";
	import Tag from "../tags/Tag.svelte";
	import { DataArr } from "drizzle-struct/front-end";
    interface Props {
        transactions: Transactions.TransactionArr;
        transactionTags: {
            [key: string]: Transactions.TransactionTagData[];
        };
    }

    const { transactions, transactionTags, }: Props = $props();

    let tags = $state(new DataArr(Transactions.Tags, []));


    const showDetails = (transaction: Transactions.TransactionData) => {
        let save = () => {};
        const m = rawModal('Transaction Details', [
            {
                text: 'Close',
                color: 'secondary',
                onClick: () => m.hide(),
            },
            {
                text: 'Save',
                color: 'success',
                onClick: () => {
                    save();
                },
            },
            {
                text: 'Delete',
                color: 'danger',
                onClick: async () => {
                    const res = await confirm(
                        `Are you sure you want to delete this transaction?`,
                        {
                            title: "Delete Transaction",
                        }
                    );
                    if (!res) {
                        return;
                    }
                    transaction.delete();
                    m.hide();
                }
            }
        ], (body) => {
            const details = mount(Details, {
                target: body,
                props: {
                    transaction,
                    tags: transactionTags[String(transaction.data.id)]
                }
            });
            save = details.save.bind(details);
            return details;
        });

        m.show();
    };

    const setReview = async (transaction: Transactions.TransactionData, reviewed: boolean) => {
        const res = await confirm(
            `Are you sure you want to ${reviewed ? "review" : "unreview"} this transaction?`,
            {
                title: "Review Transaction",
            }
        );
        if (!res) {
            return;
        }

        transaction.update(t => ({
            ...t,
            reviewed,
        }));
    };

    onMount(() => {
        tags = Transactions.Tags.all(false);
    });
</script>

<div class="table-responsive scroll-y h-100">
    <table class="table table-striped table-0">
        <thead class="position-sticky top-0">
            <tr>
                <!-- <th>Name</th> -->
                <th>Description</th>
                <th>Amount</th>
                <!-- <th>Bucket</th> -->
                <th>Date</th>
                <th>Reviewed</th>
                <th>Details</th>
                <th>Tags</th>
                <th>View</th>
            </tr>
        </thead>
        <tbody>
            {#each $transactions as transaction}
                <tr>
                    <td>{transaction.data.name}</td>
                    <td
                        class:text-success={Number(transaction.data.amount) > 0}
                        class:text-danger={Number(transaction.data.amount) < 0}
                    >{cost(Number(transaction.data.amount) / 100)}</td>
                    <td>{dateTime(new Date(String(transaction.data.date)))}</td>
                    <td>
                        {#if transaction.data.reviewed}
                            <button type="button" class="btn" onclick={() => setReview(transaction, false)}>
                                <i class="material-icons text-success">check_circle</i>
                            </button>
                        {:else}
                            <button type="button" class="btn" onclick={() => setReview(transaction, true)}>
                                <i class="material-icons text-danger">cancel</i>
                            </button>
                        {/if}
                    </td>
                    <td>{transaction.data.description}</td>
                    <td>
                        {#each $tags.filter(t => transactionTags[String(transaction.data.id)].map(tag => tag.data.tagId).includes(String(t.data.id))) as tag}
                            <Tag 
                                name={tag.data.name || 'Tag'}
                                color={tag.data.color || '#000000'}
                            />
                        {/each}
                    </td>
                    <td>
                        <button class="btn" onclick={() => showDetails(transaction)}>
                            <i class="material-icons">
                                info
                            </i>
                        </button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>