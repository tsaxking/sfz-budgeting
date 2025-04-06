<script lang="ts">
    import { Transactions } from '$lib/model/transactions';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
    import T from '$lib/components/transactions/Transactions.svelte';

    interface Props {
        bucket: Transactions.BucketData;
        transactionTags: {
            [key: string]: Transactions.TransactionTagData[];
        },
        transactions: Transactions.TransactionArr;
    }

    const { bucket, transactionTags, transactions }: Props = $props();

</script>

<T {transactions} {transactionTags} />