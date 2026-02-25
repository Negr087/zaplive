<script>
    import { get } from 'svelte/store'
    import { fade } from 'svelte/transition';
    import { zaps, nostrPool, nostrNotes, selectedDuration } from '$lib/store';
    import TimeframesSelector from '$lib/components/TimeframesSelector.svelte';
    import { subscribeMainFilter } from '$lib/nostr/utils';
    import { formatSatoshis } from '$lib/utils';
    import TimeAgo from 'javascript-time-ago'
	import { onMount } from 'svelte';
    const timeAgo = new TimeAgo('en-US')

    let totalSats;
    let durationInHours;
    let durationInHoursFormatted;
    let showTimeframes = false;
    let since;
    let hasSeenEvents;
    let showAllTimeWarning = false;

    $: {
        totalSats = $zaps.reduce((acc, zap) => {
            if (!since || zap.created_at >= since) {
                return acc + zap.amount
            } else {
                return acc;
            }
        }, 0);
    }

    onMount(() => {
        durationInHours = get(selectedDuration);
        setDuration();
        subscribeMainFilter($nostrPool, durationInHours);
    })

    function toggleTimeframes() {
        showTimeframes = !showTimeframes;
    }

    async function onTimeframeChange() {
        if (durationInHours === 'all') {
            showAllTimeWarning = true;
            setTimeout(() => {
                showAllTimeWarning = false;
            }, 5000);
        }

        $selectedDuration = durationInHours;

        $nostrPool.unsubscribeAll();
        await $nostrPool.reset();

        setDuration();
        toggleTimeframes();

        setTimeout(() => {
            subscribeMainFilter($nostrPool, durationInHours);
        }, 100);
    }

    function setDuration() {
        if (durationInHours !== 'all') {
            since = Math.floor(Date.now() / 1000) - durationInHours * 60 * 60;
            durationInHoursFormatted = timeAgo.format(new Date(since * 1000));
            durationInHoursFormatted = durationInHoursFormatted.replace(/ ago/, '')
        } else {
            since = null;
        }
    }

    hasSeenEvents = !!$nostrNotes[0];
</script>

{#if durationInHours}
    <div class="flex flex-col items-stretch w-full justify-center hero py-2 px-2">
        <span class="
            text-2xl
            text-white
            font-black
            text-center
            uppercase
        ">zapped on <span class="text-purple-600">nostr</span>
        </span>
        <span class="
            text-5xl
            hero
            text-white
            font-black
            text-center
        " style="text-shadow: -3px 3px rgb(147 51 234 / var(--tw-text-opacity));">
            <span class="hidden lg:inline-block">⚡️</span>
            {formatSatoshis(parseInt(totalSats))}
        </span>


        <div class="text-center flex flex-col items-center text-xl text-white font-bold uppercase">
            {#if durationInHours !== 'all'}
                <span class="">
                    Last
                    <a href='#' class="
                    " on:click|preventDefault={toggleTimeframes}>
                        {durationInHoursFormatted}
                    </a> - ZAPLIVE
                </span>
            {:else}
                <a href='#' class="
                    border-b-2
                    border-dashed
                    cursor-pointer
                    text-white
                    border-b-white
                    " on:click|preventDefault={toggleTimeframes}
                >
                    ALL TIME
                </a>
                {#if showAllTimeWarning}
                    <div class="flex flex-row gap-2 items-center">
                        <img src="https://nostr.build/i/nostr.build_6b1887818fff90848ba4a8ffd21094b5e169044aea2091f5d59491c4af024971.png" alt="" class="h-12 rounded-md">
                        <span in:fade out:fade class="text-red-600 text-sm font-mono opacity-70">
                            (gathering events live;<br/>it'll take a while)
                        </span>
                    </div>
                {/if}
            {/if}
        </div>
    </div>
{:else}
    <div class="flex flex-col items-stretch justify-center my-10" style="min-height: 35vh;">
        <span class="
            text-7xl
            text-purple-700
            font-black
            text-center
            my-10
        ">
            👋 HOWDY!
        </span>
        <span class="
            text-3xl
            text-gray-300
            font-black
            text-center
            mb-3
        ">connecting you to relays, one sec</span>
    </div>
{/if}

{#if showTimeframes}
    <div class="mb-32 text-lg" style="">
        <div class="flex flex-col lg:flex-row">
            <TimeframesSelector
                hour={durationInHours}
                bind:hours={durationInHours}
                click={onTimeframeChange}
            />
        </div>
    </div>
{/if}

<style>
    .hero {
        font-family: Inter;
font-size: 40px;
font-style: italic;
font-weight: 900;
line-height: 48px;
letter-spacing: 0em;
text-align: center;
    }
</style>