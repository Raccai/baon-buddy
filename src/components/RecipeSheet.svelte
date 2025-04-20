<script>
  import { fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte'; // Added onMount/onDestroy

  export let visible = false;
  /** @type {{ name: string, image: string, type: string, message: string, recipe?: { ingredients: string[], steps: string[], talaTip?: string } } | null } */
  export let meal = null;

  const dispatch = createEventDispatcher();

  let startY = 0;
  let currentY = 0;
  let sheetElement; // Renamed from 'sheet'
  let isDragging = false;
  let sheetContent;
  let startScrollTop = 0; // Track scroll position at drag start

  const threshold = 100; // pixels down to trigger close

  function handleTouchStart(event) {
    // Check if the touch is on the handle bar or the header area
    const touchY = event.touches[0].clientY;
    const rect = sheetElement.getBoundingClientRect();
    const handleBarHeight = 40; // Approx height of handle + padding
    const headerArea = rect.top + handleBarHeight;

    // Allow dragging only if touching handle/header OR if content is scrolled to top
    if (touchY <= headerArea || sheetContent.scrollTop === 0) {
        isDragging = true;
        startY = touchY;
        currentY = touchY;
        sheetElement.style.transition = 'none'; // Remove transition during drag
        startScrollTop = sheetContent.scrollTop; // Store initial scroll position
    } else {
        isDragging = false; // Don't drag if touch starts mid-content and content is scrollable
    }
  }

  function handleTouchMove(event) {
    if (!isDragging) return;
    currentY = event.touches[0].clientY;
    const deltaY = currentY - startY;

    // Only transform downwards OR if pulling down from the top
    if (deltaY > 0 || sheetContent.scrollTop === 0) {
        // Prevent default scroll behavior ONLY when dragging the sheet down
        if (deltaY > 0 && sheetContent.scrollTop <= startScrollTop) {
            event.preventDefault();
        }
        // Apply downward transform, but don't let it go upwards past 0
        sheetElement.style.transform = `translateY(${Math.max(0, deltaY)}px)`;
    } else {
        // If pulling upwards when not at the top, let the native scroll handle it
        // Reset dragging state if user starts scrolling content upwards
        isDragging = false;
        sheetElement.style.transform = 'translateY(0)';
    }
  }

  function handleTouchEnd() {
    if (!isDragging) return;
    isDragging = false; // End dragging state immediately

    const deltaY = currentY - startY;

    sheetElement.style.transition = 'transform 0.3s ease-out'; // Add transition back

    if (deltaY > threshold) {
      closeSheet(); // Call the close function
    } else {
      // Snap back to original position
      sheetElement.style.transform = 'translateY(0)';
    }

    // Clean up transition style after animation
    setTimeout(() => {
      if (sheetElement) sheetElement.style.transition = '';
    }, 300);
  }

  function closeSheet() {
    // Reset transform before dispatching close
    if (sheetElement) {
        sheetElement.style.transform = ''; // Or specific transform for exit animation
    }
    dispatch('close');
  }

  // Prevent body scroll when sheet is open
  onMount(() => {
      if (visible) document.body.style.overflow = 'hidden';
  });

  onDestroy(() => {
      document.body.style.overflow = ''; // Restore body scroll on destroy
  });

  // Watch visibility prop to toggle body scroll
  $: if (typeof document !== 'undefined') {
      document.body.style.overflow = visible ? 'hidden' : '';
  }

   // Reset transform when visibility changes externally
  $: if (sheetElement && !visible) {
     sheetElement.style.transform = '';
     sheetElement.style.transition = ''; // Ensure transition is removed if closed abruptly
  }

</script>

{#if visible}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="sheet-backdrop" on:click={closeSheet} transition:fade={{duration: 200}}></div>

  <!-- Main Sheet Container -->
  <div
    bind:this={sheetElement}
    class="bottom-sheet"
    role="dialog"
    aria-modal="true"
    aria-labelledby="sheet-title"
    transition:fly={{ y: '100%', duration: 350, easing: quintOut }} 
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
  >
    <!-- Handle Bar -->
    <div class="handle-bar-container" aria-hidden="true">
        <div class="handle-bar"></div>
    </div>

    <!-- Scrollable Content -->
    <div class="sheet-content" bind:this={sheetContent}>
      <div class="sheet-header">
        <h2 id="sheet-title">{meal?.name || 'Recipe'}</h2>
        <!-- Themed Close Button -->
        <button class="close-sheet-btn" on:click={closeSheet} aria-label="Close Recipe Sheet">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        </button>
      </div>

      {#if meal?.recipe}
        <div class="recipe-section">
            <h3>Ingredients</h3>
            <ul class="ingredient-list">
              {#each meal.recipe.ingredients as item}
                <li>{item}</li>
              {/each}
            </ul>
        </div>

        <div class="recipe-section">
            <h3>Steps</h3>
            <ol class="step-list">
              {#each meal.recipe.steps as step, i}
                <li>
                    <span class="step-number">{i + 1}.</span>
                    <span class="step-text">{step}</span>
                </li>
              {/each}
            </ol>
        </div>

        {#if meal.recipe.talaTip}
          <div class="tip-section">
              <h4><span class="tip-icon">✨</span> Tala's Tip</h4>
              <p class="tip-text">{meal.recipe.talaTip}</p>
          </div>
        {/if}

      {:else if meal}
         <div class="no-recipe">
             <p>Looks like Tala hasn't shared the recipe for {meal.name} yet!</p>
             <!-- Optional: Add meal image here -->
             {#if meal.image}
                <img src={meal.image} alt="" class="no-recipe-img"/>
             {/if}
         </div>
      {:else}
        <div class="no-recipe"><p>No meal selected.</p></div>
      {/if}
    </div> <!-- End sheet-content -->
  </div> <!-- End bottom-sheet -->
{/if}

<style>
  .sheet-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(10, 8, 30, 0.7); /* Dark themed backdrop */
    backdrop-filter: blur(4px);
    z-index: 1000;
  }

  .bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 85vh; /* Slightly more height */
    height: auto; /* Let content define height up to max */
    background: #231d52; /* Dark theme background */
    color: #fff5e1; /* Creamy text */
    border-top-left-radius: 20px; /* Slightly smaller radius */
    border-top-right-radius: 20px;
    border-top: 1px solid #4a4090; /* Subtle top border */
    z-index: 1001;
    box-shadow: 0 -5px 30px rgba(0,0,0,0.35);
    display: flex;
    flex-direction: column;
    /* Prevent interaction while animating out */
    pointer-events: auto;
    touch-action: none; /* Prevent browser default touch actions like pull-to-refresh on the sheet itself */
  }

  .handle-bar-container {
    padding: 0.75rem 0; /* Padding around handle */
    width: 100%;
    flex-shrink: 0; /* Prevent shrinking */
    cursor: grab; /* Indicate draggability */
  }
  .handle-bar {
    width: 50px; /* Wider handle */
    height: 5px;
    background: #4a4090; /* Themed handle color */
    border-radius: 999px;
    margin: 0 auto;
  }
  .handle-bar-container:active {
      cursor: grabbing;
  }

  .sheet-content {
    padding: 0 1.5rem 1.5rem; /* Padding inside content area */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
    flex: 1; /* Allow content to grow */
    min-height: 0; /* Prevent flexbox overflow issues */
    touch-action: pan-y; /* Allow vertical panning/scrolling within content */
    overscroll-behavior: contain; /* Prevent scroll chaining */
  }

  .sheet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem; /* More space below header */
    padding-top: 0.5rem; /* Space above title */
    flex-shrink: 0;
  }

  #sheet-title { /* Target h2 by id */
    font-size: 1.5rem; /* Adjusted size */
    font-weight: 700;
    color: #fff; /* Brighter white for title */
    margin: 0;
    flex-grow: 1; /* Allow title to take space */
    padding-right: 1rem; /* Space before button */
  }

  .close-sheet-btn {
    background: transparent;
    border: none;
    color: #fff5e1a8; /* Semi-transparent icon */
    cursor: pointer;
    padding: 0.5rem; /* Padding for touch target */
    margin: -0.5rem; /* Negative margin to offset padding */
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease, background-color 0.2s ease;
    flex-shrink: 0;
  }
  .close-sheet-btn:hover, .close-sheet-btn:focus-visible {
    color: #fff;
    background-color: #4a409060; /* Subtle background on hover */
    outline: none;
  }

  .recipe-section, .tip-section, .no-recipe {
     margin-bottom: 2rem; /* Space between sections */
     text-align: left; /* Ensure left alignment */
  }

  h3 {
    font-size: 1.3rem; /* Slightly larger section titles */
    margin-bottom: 0.8rem;
    font-weight: 600;
    color: #b388eb; /* Accent color for section titles */
    padding-bottom: 0.3rem;
    border-bottom: 1px solid #4a4090; /* Separator line */
    display: inline-block; /* Make border only as wide as text */
  }

  ul, ol {
    padding-left: 0; /* Remove default padding */
    list-style: none; /* Remove default bullets/numbers */
  }

  li {
    margin-bottom: 0.6rem; /* Space between items */
    font-size: 1rem; /* Slightly larger list text */
    line-height: 1.5;
    color: #fff5e1e0; /* Slightly transparent main text */
  }

  .ingredient-list li::before {
      content: '✧'; /* Sparkle bullet */
      color: #b388eb; /* Accent color */
      margin-right: 0.7rem;
      font-size: 0.9em;
      display: inline-block;
  }

  .step-list li {
      display: flex;
      align-items: flex-start; /* Align number and text nicely */
      gap: 0.6rem;
  }
  .step-number {
      color: #b388eb;
      font-weight: 600;
      flex-shrink: 0;
      min-width: 1.5em; /* Ensure space for numbers */
      text-align: right;
  }
  .step-text {
      flex-grow: 1;
  }

  .tip-section {
     background-color: #2c2663; /* Slightly different background */
     border: 1px solid #4a4090;
     padding: 1.2rem;
     border-radius: 12px;
     margin-top: 1.5rem;
     box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
  }
  .tip-section h4 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
    margin: 0 0 0.7rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
   .tip-icon {
       font-size: 1.2em;
       line-height: 1;
   }
  .tip-text {
    font-size: 0.95rem;
    line-height: 1.6;
    color: #fff5e1e0;
    margin: 0;
  }

  .no-recipe {
    text-align: center;
    padding: 2rem 1rem;
    color: #fff5e1b3;
  }
  .no-recipe p {
    margin-bottom: 1rem;
    font-size: 1.1em;
  }
  .no-recipe-img {
    max-width: 150px;
    height: auto;
    border-radius: 10px;
    opacity: 0.8;
    margin-top: 1rem;
  }

  /* Problem Screen 1: Tall Tablets (e.g., iPad Portrait) */
  @media (min-width: 700px) and (min-height: 1000px) {
    #sheet-title { 
      font-size: 2rem; 
    }
    
    h3 {
      font-size: 1.6rem; 
    }

    li {
      font-size: 1.4rem;
    }

    .ingredient-list li::before {
        font-size: 1em;
    } 

    .tip-section h4 {
      font-size: 1.6rem;
    }
    .tip-icon {
        font-size: 1.4em;
    }
    .tip-text {
      font-size: 1.4rem;
    }

    .no-recipe p {
      font-size: 1.6em;
    }
    .no-recipe-img {
      max-width: 300px;
    }

    .close-sheet-btn {
      transform: scale(1.4);
    }
  }

  /* Problem Screen 2: Very Large/Tall Tablets */
  @media (min-width: 900px) and (min-height: 1300px) {
    #sheet-title { 
      font-size: 3.4rem; 
    }
    
    h3 {
      font-size: 3rem; 
    }

    li {
      font-size: 2rem;
    }

    .ingredient-list li::before {
      font-size: 1.2em;
    } 

    .tip-section h4 {
      font-size: 2.6rem;
    }
    .tip-icon {
        font-size: 1.4em;
    }
    .tip-text {
      font-size: 2rem;
    }

    .no-recipe p {
      font-size: 2em;
    }
    .no-recipe-img {
      max-width: 500px;
    }

    .close-sheet-btn {
      transform: scale(2);
    }
  }
</style>