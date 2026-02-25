<script>
    import { nostrPool, relayEvents } from "$lib/store";
    import TimeAgo from 'javascript-time-ago'
    import en from 'javascript-time-ago/locale/en';
    import { onMount } from "svelte";

    TimeAgo.addDefaultLocale(en)

    // ⚠️ YA NO agregamos relays manualmente
    onMount(() => {
        console.log("Nostr pool initialized");
    });

    import "../../app.css";

    let displayRelayInfo = false;

    let relayUrls;
    $: relayUrls = Object.keys($relayEvents).filter(url => url.match(/\/\//));

    // ⚠️ Si querés permitir agregar relays dinámicamente,
    // necesitamos agregar un método nuevo en la clase.
    // Por ahora lo desactivamos para que no rompa.

    function addNewRelay(e) {
        console.warn("Dynamic relay adding disabled with SimplePool version");
        e.preventDefault();
        e.target.reset();
    }
</script>

<svelte:head>
    <title>ZAPLIVE</title>
</svelte:head>

<NavBar />

{#if !pubkey}
    <div class="text-5xl text-white text-center">
        Enter your npub
    </div>
{:else}
    <div class="flex flex-col gap-4 mt-5 max-w-screen w-full">
        {#each eventIds as id}
            <div class="w-full">
                {#if events[id]}
                    {#if events[id].kind === 1}
                        <Note note={events[id]} />
                    {:else if events[id].kind === 9735}
                        <Zap zap={events[id].zap} opened={openedZap === events[id].zap.id} on:open={(e) => { openedZap = e.detail } } />
                    {:else if events[id].kind === 7}
                        <div class="flex flex-row gap-4 h-fit py-4 w-full overflow-auto">
                            <Avatar pubkey={events[id].pubkey} klass="h-12 w-12" />
                            <span class="text-xl text-black dark:text-white font-black">
                                {$profiles[events[id].pubkey]?.display_name || $profiles[events[id].pubkey]?.name || $profiles[events[id].pubkey]?.displayName || `[${events[id].pubkey.slice(0, 6)}]`}
                            </span>
                            <span class="text-3xl">
                                {events[id].content}
                            </span>
                            {$nostrNotes[events[id].taggedEvent]?.content}
                        </div>
                    {:else}
                        <div>{events[id].kind}</div>
                    {/if}
                {/if}
            </div>
        {/each}
    </div>
{/if}