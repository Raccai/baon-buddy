<!-- src/components/HintPopover.svelte -->
<script>
    import { onMount, onDestroy, tick } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    export let targetSelector = '';
    export let text = '';
    export let position = 'bottom';
    export let totalHints = 1;
    export let currentHintIndex = 0;
    export const spotlightPadding = 10; // Keep for radius calculation

    const dispatch = createEventDispatcher();

    let popoverStyle = '';
    let popoverElement;
    let isVisible = false;
    let foundTargetRect = null;
    let retryTimeout = null;
    let findAttempts = 0;
    const MAX_ATTEMPTS = 6;
    const RETRY_DELAY_MS = 120;
    let arrowStyle = ''; // For dynamic arrow positioning

    async function findTargetAndPrepare(isRetry = false) {
        if (!isRetry) {
            findAttempts = 0;
            isVisible = false;
            foundTargetRect = null;
            await tick();
        }
        if (typeof window === 'undefined') return;

        // console.log(`Attempt ${findAttempts + 1}: Searching for target ${targetSelector}`);
        const targetEl = document.querySelector(targetSelector);

        if (targetEl) {
            // console.log(`Target ${targetSelector} found!`);
            foundTargetRect = targetEl.getBoundingClientRect();
            if (!isVisible) {
                isVisible = true;
                await tick(); // Wait for element binding after setting visible
            }
            // Trigger reactive positioning if popoverElement is now bound
            if (popoverElement) positionPopover();

        } else if (findAttempts < MAX_ATTEMPTS) {
            findAttempts++;
            // console.warn(`HintPopover: Target "${targetSelector}" not found. Retrying (${findAttempts})...`);
            clearTimeout(retryTimeout);
            retryTimeout = setTimeout(() => findTargetAndPrepare(true), RETRY_DELAY_MS);
        } else {
            console.error(`HintPopover: Target "${targetSelector}" not found after ${MAX_ATTEMPTS} attempts.`);
            dispatch('skip');
        }
    }

    function positionPopover() {
        if (!popoverElement || !foundTargetRect) return;

        const targetRect = foundTargetRect;
        const popoverRect = popoverElement.getBoundingClientRect();
        const margin = 15; // Margin between popover and target element
        let pTop = 0, pLeft = 0;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Calculate Popover Position (pTop, pLeft) - This part is fine
        switch (position) {
            case 'top':
                pTop = targetRect.top - popoverRect.height - margin;
                pLeft = targetRect.left + targetRect.width / 2 - popoverRect.width / 2;
                break;
            case 'left':
                pLeft = targetRect.left - popoverRect.width - margin;
                pTop = targetRect.top + targetRect.height / 2 - popoverRect.height / 2;
                break;
            case 'right':
                pLeft = targetRect.right + margin;
                pTop = targetRect.top + targetRect.height / 2 - popoverRect.height / 2;
                break;
            default: // bottom
                pTop = targetRect.bottom + margin;
                pLeft = targetRect.left + targetRect.width / 2 - popoverRect.width / 2;
                break;
        }

        pLeft = Math.max(margin, Math.min(pLeft, vw - popoverRect.width - margin));
        pTop = Math.max(margin, Math.min(pTop, vh - popoverRect.height - margin));
        popoverStyle = `top: ${pTop}px; left: ${pLeft}px;`; // Removed transform:none, not strictly needed here

        // --- Calculate Arrow Style (for its one dynamic coordinate) ---
        const arrowSize = 10; // Size of the triangle base/height
        let dynamicCoordValue = '50%'; // Default
        
        if (position === 'top' || position === 'bottom') {
            // Horizontal position of the arrow's tip/center
            const targetCenterXRelToPopover = targetRect.left + targetRect.width / 2 - pLeft;
            // Clamp so arrow doesn't go too close to popover edges
            const minPos = arrowSize; // Give some padding from edge
            const maxPos = popoverRect.width - arrowSize;
            dynamicCoordValue = `${Math.max(minPos, Math.min(targetCenterXRelToPopover, maxPos))}px`;
            // For top/bottom, JS will set the 'left' of the arrow
            arrowStyle = `left: ${dynamicCoordValue}; transform: translateX(-50%);`; 
        } else if (position === 'left' || position === 'right') {
            // Vertical position of the arrow's tip/center
            const targetCenterYRelToPopover = targetRect.top + targetRect.height / 2 - pTop;
            const minPos = arrowSize;
            const maxPos = popoverRect.height - arrowSize;
            dynamicCoordValue = `${Math.max(minPos, Math.min(targetCenterYRelToPopover, maxPos))}px`;
            // For left/right, JS will set the 'top' of the arrow
            arrowStyle = `top: ${dynamicCoordValue}; transform: translateY(-50%);`;
        }
    }

    function handleNext() { dispatch('next'); }
    function handleDone() { isVisible = false; setTimeout(() => dispatch('done'), 300); } // Allow fade out
    function handleSkip() { isVisible = false; setTimeout(() => dispatch('skip'), 300); } // Allow fade out

    onMount(() => {
        setTimeout(findTargetAndPrepare, 100);
    });

    onDestroy(() => {
        clearTimeout(retryTimeout);
    });

    // Re-find target when selector changes
    $: if (targetSelector && typeof window !== 'undefined') {
        clearTimeout(retryTimeout);
        findTargetAndPrepare(); // This will hide briefly then show again
    }

    // Position popover reactively when ready
    $: if (isVisible && popoverElement && foundTargetRect) {
        requestAnimationFrame(positionPopover);
    }

    $: isLastHint = currentHintIndex >= totalHints - 1;

</script>

{#if isVisible}
<div
    class="popover {position}"
    bind:this={popoverElement}
    style={popoverStyle}
    role="tooltip"
    in:fly={{ y: position === 'top' ? -15 : 15, duration: 300, delay: 50, easing: quintOut }}
    out:fade={{ duration: 200 }}
>
    <div class="arrow" style={arrowStyle}></div>
    <div class="text-content">{text}</div>
    <div class="buttons">
        <button on:click|stopPropagation={handleSkip}>Skip</button>
        {#if !isLastHint}
           <button on:click|stopPropagation={handleNext}>Next</button>
        {:else}
           <button on:click|stopPropagation={handleDone}>Got it!</button>
        {/if}
    </div>
</div>
{/if}

<style>
    .popover {
        position: fixed;
        background-color: #2c2663; /* Popover background */
        color: #fff5e1;
        border: 1px solid #4a4090;
        border-radius: 8px;
        padding: 0.8rem 1rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        width: auto;
        max-height: max-content;
        min-width: 150px;
        max-width: 250px;
        z-index: 9991;
        line-height: 1.4;
        font-size: 0.9rem;
        top: -9999px; left: -9999px;
        transition: top 0.35s ease-out, left 0.35s ease-out, opacity 0.25s ease-out;
        opacity: 0;
    }
    .popover[style*="top:"] { /* Or use the isVisible class if you prefer */
        opacity: 1;
    }

    .arrow {
        position: absolute;
        width: 0;
        height: 0;
        border-style: solid;
        /* Dynamic left/top positioning and transform for centering set by JS via style={arrowStyle} */
    }

    /* Popover is BELOW target, arrow (triangle) points UP from popover's TOP edge */
    .popover.bottom .arrow {
        bottom: 100%; /* Position pseudo-element relative to this for actual triangle */
        /* JS sets: left: 50%; transform: translateX(-50%); (or a calculated value) */
        /* Triangle pointing up */
        border-width: 0 7px 10px 7px; /* Left/Right base, Bottom height */
        border-color: transparent transparent #b388eb transparent; /* Highlight color for arrow */
        /* Adjust border-color to match popover background if you want it to look like a cutout:
        border-color: transparent transparent #2c2663 transparent;
        And then add a border to the popover that the arrow "cuts into",
        but a highlighted triangle is simpler. */
    }

    /* Popover is ABOVE target, arrow (triangle) points DOWN from popover's BOTTOM edge */
    .popover.top .arrow {
        top: 100%;
        /* JS sets: left: 50%; transform: translateX(-50%); */
        /* Triangle pointing down */
        border-width: 10px 7px 0 7px;
        border-color: #b388eb transparent transparent transparent; /* Highlight color */
    }

    /* Popover is to the LEFT of target, arrow (triangle) points RIGHT from popover's RIGHT edge */
    .popover.left .arrow {
        left: 100%;
        /* JS sets: top: 50%; transform: translateY(-50%); */
        /* Triangle pointing right */
        border-width: 7px 0 7px 10px;
        border-color: transparent transparent transparent #b388eb; /* Highlight color */
    }

    /* Popover is to the RIGHT of target, arrow (triangle) points LEFT from popover's LEFT edge */
    .popover.right .arrow {
        right: 100%;
        /* JS sets: top: 50%; transform: translateY(-50%); */
        /* Triangle pointing left */
        border-width: 7px 10px 7px 0;
        border-color: transparent #b388eb transparent transparent; /* Highlight color */
    }

    .text-content { margin-bottom: 0.8rem; }

    .buttons {
        display: flex; justify-content: flex-end; gap: 0.5rem;
        border-top: 1px solid #4a4090; padding-top: 0.6rem; margin-top: 0.6rem;
    }
    .buttons button {
        background-color: #4a4090; color: #fff5e1; border: 1px solid #6a5acd;
        padding: 0.4rem 0.9rem; border-radius: 6px; cursor: pointer;
        font-weight: 500; transition: background-color 0.2s ease; font-size: 0.9rem;
    }
    .buttons button:hover { background-color: #6a5acd; }
</style>