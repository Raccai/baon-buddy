<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  // --- Props ---
  export let targetSelector = '';
  export let text = '';
  export let position = 'bottom';
  export let totalHints = 1;
  export let currentHintIndex = 0;
  export let spotlightPadding = 10; // Keep if needed for radius calc, though unused now

  const dispatch = createEventDispatcher();

  // --- State ---
  let popoverStyle = '';     // Holds calculated position styles
  let popoverElement;        // Reference to the popover div using bind:this
  let isVisible = false;     // Controls rendering of the popover
  let foundTargetRect = null; // Store the target's BoundingClientRect when found
  let retryTimeout = null;   // For retrying find element
  let findAttempts = 0;      // Limit retry attempts
  const MAX_ATTEMPTS = 6;
  const RETRY_DELAY_MS = 120;

  // --- Logic ---

  // Step 1: Find the target element
  async function findTargetAndPrepare(isRetry = false) {
      if (!isRetry) {
          findAttempts = 0;
          isVisible = false;     // Ensure popover is hidden initially or during retry
          foundTargetRect = null;// Reset stored rect
          await tick();
      }
      if (typeof window === 'undefined') return;

      console.log(`Attempt ${findAttempts + 1}: Searching for target ${targetSelector}`);
      const targetEl = document.querySelector(targetSelector);

      if (targetEl) {
          // --- Target Found ---
          console.log(`Target ${targetSelector} found! Storing rect and showing popover.`);
          foundTargetRect = targetEl.getBoundingClientRect(); // Store the target's position
          isVisible = true; // Trigger the rendering of the popover element
          // DO NOT calculate final position here yet

      } else if (findAttempts < MAX_ATTEMPTS) {
          // --- Target Not Found - Retry ---
          findAttempts++;
          console.warn(`HintPopover: Target "${targetSelector}" not found. Retrying (${findAttempts})...`);
          clearTimeout(retryTimeout);
          retryTimeout = setTimeout(() => findTargetAndPrepare(true), RETRY_DELAY_MS);
      } else {
          // --- Target Not Found - Max Retries Reached ---
          console.error(`HintPopover: Target "${targetSelector}" not found after ${MAX_ATTEMPTS} attempts.`);
          dispatch('skip'); // Skip this hint/sequence
      }
  }

  // Step 2: Position the popover *after* it's rendered and bound
  function positionPopover() {
      if (!popoverElement || !foundTargetRect) return; // Safety check

      console.log("Positioning popover relative to target.");
      const targetRect = foundTargetRect; // Use stored rect
      const popoverRect = popoverElement.getBoundingClientRect();
      const margin = 12;

      let top = 0, left = 0, transform = '';

      switch (position) {
           case 'top':
              top = targetRect.top - popoverRect.height - margin;
              left = targetRect.left + targetRect.width / 2;
              transform = 'translateX(-50%)';
              break;
          // ... (add other cases: left, right if needed) ...
          default: // bottom
              top = targetRect.bottom + margin;
              left = targetRect.left + targetRect.width / 2;
              transform = 'translateX(-50%)';
              break;
      }

      // Boundary adjustments
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (left < margin) left = margin;
      if (left + popoverRect.width > vw - margin) left = vw - popoverRect.width - margin;
      if (top < margin) top = margin;
      if (top + popoverRect.height > vh - margin) top = vh - popoverRect.height - margin;

      // Recalculate transform if clamped (simplified)
      if (position === 'top' || position === 'bottom') {
          transform = (left > margin && left < vw - popoverRect.width - margin) ? 'translateX(-50%)' : 'translateX(0)';
      } else {
           transform = (top > margin && top < vh - popoverRect.height - margin) ? 'translateY(-50%)' : 'translateY(0)';
      }

      popoverStyle = `top: ${top}px; left: ${left}px; transform: ${transform};`;
       // Opacity transition is handled by CSS .popover[style*="top:"]
  }


  // --- Event Handlers ---
  function handleNext() { dispatch('next'); }
  function handleDone() { isVisible = false; setTimeout(() => dispatch('done'), 200); }
  function handleSkip() { isVisible = false; setTimeout(() => dispatch('skip'), 200); }

  // --- Lifecycle & Reactivity ---
  onMount(() => {
      // Start the process of finding the target
      setTimeout(findTargetAndPrepare, 100);
  });

  onDestroy(() => {
      clearTimeout(retryTimeout);
  });

  // Recalculate target when selector changes
  $: if (targetSelector && typeof window !== 'undefined') {
      console.log(`Target selector changed to: ${targetSelector}. Finding new target...`);
      clearTimeout(retryTimeout); // Stop retries for old target
      findTargetAndPrepare(); // Start search for new target
  }

  // *** IMPORTANT: Position the popover reactively ***
  // This runs whenever isVisible becomes true AND popoverElement gets bound
  // AND foundTargetRect has been set.
  $: if (isVisible && popoverElement && foundTargetRect) {
      positionPopover();
  }

  $: isLastHint = currentHintIndex >= totalHints - 1;

</script>

<!-- Popover only renders when isVisible is true -->
{#if isVisible}
<div
    class="popover"
    bind:this={popoverElement}
    style={popoverStyle}
    role="tooltip"
    out:fade={{ duration: 200 }} 
>
    <div class="arrow {position}"></div>
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
        border-radius: 8px;
        padding: 0.8rem 1rem;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        width: 85%;
        max-width: 280px;
        z-index: 10001;
        line-height: 1.5;
        font-size: 0.95rem;
        /* Don't start with opacity: 0 if using Svelte transitions */
        /* opacity: 0; */
        top: -9999px; /* Start offscreen */
        transition: top 0.4s ease-out,
                    left 0.4s ease-out,
                    transform 0.4s ease-out,
                    opacity 0.4s ease-out; /* Include opacity for fade out */
    }
  /* Fade in when positioned */
  .popover[style*="top:"] { /* Check if top style applied */
      opacity: 1;
  }

  .arrow {
      position: absolute; width: 0; height: 0; border-style: solid;
  }
  .arrow.bottom { /* Pointing up */
      top: -8px; left: 50%; transform: translateX(-50%);
      border-width: 0 8px 8px 8px; border-color: transparent transparent #4a4090 transparent;
  }
   .arrow.bottom::after { /* Inner part */
       content: ''; position: absolute; top: 1px; left: -8px;
       border-width: 0 8px 8px 8px; border-style: solid;
       border-color: transparent transparent #2c2663 transparent;
   }
  .arrow.top { /* Pointing down */
     bottom: -8px; left: 50%; transform: translateX(-50%);
     border-width: 8px 8px 0 8px; border-color: #4a4090 transparent transparent transparent;
  }
  .arrow.top::after {
       content: ''; position: absolute; bottom: 1px; left: -8px;
       border-width: 8px 8px 0 8px; border-style: solid;
       border-color: #2c2663 transparent transparent transparent;
   }
  /* Add .left and .right arrow styles if needed */
   .arrow.left { /* Pointing right */
       right: -8px; top: 50%; transform: translateY(-50%);
       border-width: 8px 0 8px 8px; border-color: transparent transparent transparent #4a4090;
   }
   .arrow.left::after {
       content: ''; position: absolute; right: 1px; top: -8px;
       border-width: 8px 0 8px 8px; border-style: solid;
       border-color: transparent transparent transparent #2c2663;
   }
    .arrow.right { /* Pointing left */
       left: -8px; top: 50%; transform: translateY(-50%);
       border-width: 8px 8px 8px 0; border-color: transparent #4a4090 transparent transparent;
   }
   .arrow.right::after {
       content: ''; position: absolute; left: 1px; top: -8px;
       border-width: 8px 8px 8px 0; border-style: solid;
       border-color: transparent #2c2663 transparent transparent;
   }


  .text-content { margin-bottom: 0.8rem; }

  .buttons {
      display: flex; justify-content: flex-end; gap: 0.5rem;
      border-top: 1px solid #4a4090; padding-top: 0.6rem; margin-top: 0.6rem;
  }
  .buttons button {
      background-color: #4a4090; color: #fff5e1; border: 1px solid #6a5acd;
      padding: 0.3rem 0.8rem; border-radius: 6px; cursor: pointer;
      font-weight: 500; transition: background-color 0.2s ease; font-size: 0.85rem;
  }
  .buttons button:hover { background-color: #6a5acd; }
</style>