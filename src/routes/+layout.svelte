<script>
    import { nostrPool, relayEvents } from "$lib/store";
    import TimeAgo from 'javascript-time-ago'
    import en from 'javascript-time-ago/locale/en';
	import { onMount } from "svelte";

    TimeAgo.addDefaultLocale(en)

    onMount(async () => {

        // try {
        //     const userRelays = await window.nostr?.getRelays()
        //     console.log('userRelays', userRelays, window.nostr);
        //     if (userRelays) {
        //     }
        // } catch (e) {
        //     console.log('error getting relays', e)
        // }
    })

    import "../app.css";

    let displayRelayInfo = false;

    let relayUrls;
    $: relayUrls = Object.keys($relayEvents).filter(url => url.match(/\/\//));

</script>

<div class="fixed flex-row items-center gap-2 bottom-0 left-0 text-4xl opacity-90 m-2 hidden md:flex cursor-pointer hover:opacity-100" on:click={()=>{displayRelayInfo=!displayRelayInfo}}>
    <div>⚙️</div>
    <div class="text-black dark:text-white text-base font-bold opacity-50 hover:opacity-100">Relays</div>
</div>
{#if displayRelayInfo}
<div class="fixed bottom-12 left-0 hidden md:block  p-5 m-2 rounded-lg shadow-lg bg-purple-900 text-white">
    <div class="font-bold text-lg mb-3">Relays</div>

    <ul class="list-none">
        {#each relayUrls as relayUrl}
            {#if $relayEvents[relayUrl] > 0}
            <li>
                <b>{relayUrl}:</b> {$relayEvents[relayUrl]} events
            </li>
            {/if}
        {/each}

        <li>
    </ul>
</div>
{/if}

<div class="flex flex-col min-h-screen items-center bottom-0 w-screen">
    <div class="flex flex-col items-center max-w-3xl w-full flex-grow">
        <slot />
    </div>
    <footer class="py-3 bg-purple-1000 font-mono text-white text-center mt-12 px-10 rounded-t-lg">
        <div class="flex justify-center flex-row">
            <div class="text-sm">
                ZAPLIVE
                from
        @negr0
        forked by @pablof7z
            </div>
        </div>
    </footer>
</div>