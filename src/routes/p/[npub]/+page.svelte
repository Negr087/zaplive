<script>
    import NavBar from '$lib/components/NavBar.svelte';

    import Hero from '$lib/components/Hero.svelte';
    import ZapFeed from '$lib/components/ZapFeed.svelte';
    import { page } from '$app/stores';
    import { nip19 } from 'nostr-tools';

    const { npub } = $page.params;
    const hexpubkey = nip19.decode(npub).data;
</script>

<svelte:head>
    <title>ZAPLIVE</title>
</svelte:head>

<NavBar />

<Hero extraFilters={{ "#p": [hexpubkey] }} />

<ZapFeed initialDisplayCount={250} cutoffTimeDuration={720} />
