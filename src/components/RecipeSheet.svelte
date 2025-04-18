<script> 
  import { fly } from 'svelte/transition'; 
  export let visible = false; 
  /** @type {{ name: string, image: string, type: string, message: string, recipe?: { ingredients: string[], steps: string[], talaTip?: string } } | null } */ 
  export let meal = null; 
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
 
  let startY = 0; 
  let currentY = 0; 
  let sheet; 
  let isDragging = false; 
  let contentHeight = 0;
  let sheetContent;
 
  const threshold = 100; // pixels to trigger close 
 
  function handleTouchStart(event) { 
    // Only start dragging from the handle bar area
    const touchY = event.touches[0].clientY;
    const rect = sheet.getBoundingClientRect();
    const handleBarArea = rect.top + 40; // Height of handle + some padding
    
    if (touchY <= handleBarArea) {
      isDragging = true; 
      startY = touchY;
      currentY = touchY; // Initialize currentY to prevent NaN issues
    }
  } 
 
  function handleTouchMove(event) { 
    if (!isDragging) return; 
    currentY = event.touches[0].clientY; 
    const deltaY = currentY - startY; 
    if (deltaY > 0) { 
      sheet.style.transform = `translateY(${deltaY}px)`; 
    } 
  } 
 
  function handleTouchEnd() { 
    if (!isDragging) return;
    
    const deltaY = currentY - startY; 
    if (deltaY > threshold) { 
      close(); 
    } else { 
      sheet.style.transition = 'transform 0.3s ease'; 
      sheet.style.transform = 'translateY(0)'; 
      setTimeout(() => { 
        if (sheet) sheet.style.transition = ''; 
      }, 300); 
    } 
    isDragging = false; 
  } 
 
  function close() { 
    // Reset transform when closing
    if (sheet) {
      sheet.style.transform = '';
    }
    
    // Emit close event to parent
    dispatch('close');
    
    // Set visible to false (this might be redundant if parent handles it)
    visible = false;
  } 
  
  $: if (visible && sheet) {
    // Reset position when opening
    sheet.style.transform = '';
  }
</script> 
 
{#if visible} 
  <!-- svelte-ignore a11y_click_events_have_key_events --> 
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="sheet-backdrop" on:click={close}></div> 
 
  <div 
    bind:this={sheet} 
    class="bottom-sheet" 
    transition:fly={{ y: 300, duration: 300 }} 
    on:touchstart={handleTouchStart} 
    on:touchmove={handleTouchMove} 
    on:touchend={handleTouchEnd} 
  > 
    <div class="handle-bar"></div>
    <div class="sheet-content" bind:this={sheetContent}>
      <div class="sheet-header"> 
        <h2 class = "sheet-title">{meal?.name}</h2> 
        <button on:click={close}>Close</button> 
      </div> 
   
      {#if meal?.recipe} 
        <h3 class = "sheet-title">Ingredients</h3> 
        <ul> 
          {#each meal.recipe.ingredients as item} 
            <li>{item}</li> 
          {/each} 
        </ul> 
   
        <h3 class = "sheet-title">Steps</h3> 
        <ol> 
          {#each meal.recipe.steps as step} 
            <li>{step}</li> 
          {/each} 
        </ol> 
   
        {#if meal.recipe.talaTip} 
          <p class="tip"><strong>Tala's Tip:</strong> {meal.recipe.talaTip}</p> 
        {/if} 
      {/if}
    </div> 
  </div> 
{/if} 
 
<style>
  .sheet-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000;
  }

  .sheet-title {
    font-family: "Flagflies", sans-serif;
  }

  .bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 80vh;
    background: #fff5e1;
    color: #191337;
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    padding: 1.5rem 0 0;
    z-index: 1001;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
    display: flex;
    flex-direction: column;
  }

  .handle-bar {
    width: 40px;
    height: 6px;
    background: #bbb;
    border-radius: 999px;
    margin: 0 auto 1rem;
    cursor: grab;
  }

  .sheet-content {
    padding: 0 1.5rem 1.5rem;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    flex: 1;
  }

  .sheet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 1.6rem;
    font-weight: bold;
  }

  h3 {
    font-size: 1.2rem;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    font-weight: 700;
    background: linear-gradient(to right, #281e6e, #673397);
    /* -webkit-background-clip: text; */
    -webkit-text-fill-color: transparent;
  }

  ul, ol {
    padding-left: 1.2rem;
    list-style-position: inside;
    text-align: left;
  }

  li {
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
  }

  .tip {
    margin-top: 1.2rem;
    background: linear-gradient(to right, #e0b3ff, #f9d8ff);
    padding: 1rem;
    border-radius: 12px;
    font-weight: 600;
    background: linear-gradient(135deg, #281e6e, #332A79, #673397);
    color: #fff5e1;
    text-align: center;
    box-shadow: 0 0 20px rgba(189, 96, 255, 0.897);
  }

  button {
    background: #c40c0c;
    color: #fff5e1;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  button:hover {
    background: #e03131;
  }
</style>
