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

        // console.log("Positioning popover relative to target.");
        const targetRect = foundTargetRect;
        const popoverRect = popoverElement.getBoundingClientRect();
        const margin = 15; // Increased margin slightly
        let top = 0, left = 0, transform = ''; // Transform no longer used for main position
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        switch (position) {
            case 'top':
                top = targetRect.top - popoverRect.height - margin;
                left = targetRect.left + targetRect.width / 2 - popoverRect.width / 2;
                break;
            case 'left':
                 left = targetRect.left - popoverRect.width - margin;
                 top = targetRect.top + targetRect.height / 2 - popoverRect.height / 2;
                 break;
            case 'right':
                 left = targetRect.right + margin;
                 top = targetRect.top + targetRect.height / 2 - popoverRect.height / 2;
                 break;
            default: // bottom
                top = targetRect.bottom + margin;
                left = targetRect.left + targetRect.width / 2 - popoverRect.width / 2;
                break;
        }

        // Boundary adjustments (clamping)
        left = Math.max(margin, Math.min(left, vw - popoverRect.width - margin));
        top = Math.max(margin, Math.min(top, vh - popoverRect.height - margin));

        popoverStyle = `top: ${top}px; left: ${left}px; transform: none;`; // Apply final position

        // --- Calculate Arrow Position ---
        let arrowLeft = 'auto';
        let arrowTop = 'auto';
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;
        const arrowSize = 14; // Match arrow width/height in CSS
        const arrowHalfWidth = arrowSize / 2;

        if (position === 'top' || position === 'bottom') {
             let idealArrowLeft = targetCenterX - left; // Target center relative to popover left
             arrowLeft = `${Math.max(arrowHalfWidth + 2, Math.min(idealArrowLeft, popoverRect.width - arrowHalfWidth - 2))}px`; // Clamp within popover bounds + small margin
        } else if (position === 'left' || position === 'right') {
             let idealArrowTop = targetCenterY - top; // Target center relative to popover top
             arrowTop = `${Math.max(arrowHalfWidth + 2, Math.min(idealArrowTop, popoverRect.height - arrowHalfWidth - 2))}px`;
        }

        arrowStyle = `left: ${arrowLeft}; top: ${arrowTop};`;
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
        background-color: #2c2663;
        color: #fff5e1;
        border: 1px solid #4a4090;
        border-radius: 10px;
        padding: 1rem 1.2rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        width: 88%;
        max-width: 300px;
        z-index: 991;
        line-height: 1.5;
        font-size: 0.95rem;
        top: -9999px; left: -9999px;
        transition: top 0.35s ease-out,
                    left 0.35s ease-out,
                    opacity 0.25s ease-out;
        opacity: 0;
    }
    .popover[style*="top:"] {
        opacity: 1;
    }

    .arrow {
        position: absolute;
        width: 14px; height: 14px;
        background-color: #2c2663;
        border: 1px solid #4a4090;
        transform-origin: center center;
        transform: rotate(45deg);
        left: 50%; top: -9999px; /* Default position offscreen */
        margin-left: -7px; margin-top: -7px; /* Centering offset for default left: 50% */
        z-index: -1;
        transition: left 0.35s ease-out, top 0.35s ease-out; /* Animate position */
    }
    /* Position arrow based on parent class */
    .popover.bottom .arrow {
        top: -8px; border-bottom: none; border-right: none;
        /* left/transform set by inline style={arrowStyle} */
        /* Reset margin-top when top is set */
        margin-top: 0;
    }
    .popover.top .arrow {
       bottom: -8px; border-top: none; border-left: none;
        /* left/transform set by inline style={arrowStyle} */
        /* Reset margin-top when bottom is set */
        margin-top: 0;
    }
    .popover.left .arrow {
         right: -8px; border-bottom: none; border-left: none;
         /* top/transform set by inline style={arrowStyle} */
         /* Reset margin-left when right is set */
         margin-left: 0;
         /* Keep vertical centering offset */
         margin-top: -7px;
     }
    .popover.right .arrow {
         left: -8px; border-top: none; border-right: none;
         /* top/transform set by inline style={arrowStyle} */
         /* Reset margin-left when left is set */
          margin-left: 0;
          margin-top: -7px;
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


    /* --- RESPONSIVE STYLES --- */
    @media (min-width: 700px) and (min-height: 1000px) {
      .popover {
          max-width: 380px; padding: 1.2rem 1.5rem;
          font-size: 1.1rem; border-radius: 12px;
      }
      .buttons button { padding: 0.6rem 1.2rem; font-size: 1rem; }
      .arrow { width: 18px; height: 18px; margin-left: -9px; margin-top: -9px; }
      .popover.bottom .arrow { top: -10px; }
      .popover.top .arrow { bottom: -10px; }
      .popover.left .arrow { right: -10px; }
      .popover.right .arrow { left: -10px; }
    }
    @media (min-width: 900px) and (min-height: 1300px) {
      .popover{
          max-width: 450px; padding: 1.5rem 1.8rem;
          font-size: 1.25rem; border-radius: 14px;
      }
      .buttons button { padding: 0.8rem 1.5rem; font-size: 1.1rem; border-radius: 8px; }
      .arrow { width: 20px; height: 20px; margin-left: -10px; margin-top: -10px; }
      .popover.bottom .arrow { top: -11px; }
      .popover.top .arrow { bottom: -11px; }
      .popover.left .arrow { right: -11px; }
      .popover.right .arrow { left: -11px; }
    }
</style>