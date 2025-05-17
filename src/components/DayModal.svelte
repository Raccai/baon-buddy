<script>
  import { format } from 'date-fns';
  import { createEventDispatcher, onMount } from 'svelte'; // Added onMount if needed
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import BaonCardSelector from './BaonCardSelector.svelte';
  import { get as getStoreValue } from 'svelte/store';
  import { allMeals as allMealsStore } from '../lib/mealStore.js'; // For looking up meals
  import { playSound } from '../lib/soundManager';

  export let date;
  export let mealIdsForDay = []; // Prop from Calendar.svelte: Now an array of meal IDs
  export const mode = 'view';      // 'view', 'copySource', 'copyTarget'
  export let copiedMealIds = []; // Prop from Calendar.svelte: Array of meal IDs

  const dispatch = createEventDispatcher();

  let mealsForSelector = []; // This will be an array of FULL MEAL OBJECTS for BaonCardSelector

  // Reactive statement to derive full meal objects for BaonCardSelector
  // whenever mealIdsForDay (from Calendar.svelte via prop) or $allMealsStore changes
  $: {
    const currentAllMeals = getStoreValue(allMealsStore);
    if (Array.isArray(mealIdsForDay) && currentAllMeals && currentAllMeals.length > 0) {
      mealsForSelector = mealIdsForDay
        .map(id => currentAllMeals.find(m => m.id === id))
        .filter(Boolean); // Filter out any undefined if an ID wasn't found
    } else {
      mealsForSelector = [];
    }
    // console.log('[DayModal] mealsForSelector updated:', mealsForSelector.map(m=>m.name));
  }


  // Called when BaonCardSelector dispatches 'select' (payload is array of full meal objects)
  function handleSelectionChangeFromSelector(event) {
    const selectedFullMeals = event.detail; // Array of full meal objects from BaonCardSelector
    const selectedMealIds = selectedFullMeals.map(meal => meal.id).filter(Boolean); // Get IDs

    // Dispatch 'add' event with an array of meal IDs to Calendar.svelte
    dispatch('add', selectedMealIds);
  }

  function handleViewRecipe(event) {
    dispatch('viewRecipe', event.detail); // Forward full meal object
  }

  function handleCopy() {
    // mealsForSelector contains the currently displayed (and thus selected for this day) full meal objects
    if (mealsForSelector.length > 0) {
      const idsToCopy = mealsForSelector.map(meal => meal.id).filter(Boolean);
      playSound('click');
      dispatch('copy', idsToCopy); // Dispatch array of IDs
    }
  }

  function handlePaste() {
    // copiedMealIds prop is an array of IDs from Calendar.svelte
    if (copiedMealIds && copiedMealIds.length > 0) {
      // Calendar.svelte's on:paste handler will use its `copiedMeals` (which are IDs)
      playSound('click');
      dispatch('paste'); // No detail needed, Calendar.svelte has the IDs
    }
  }

  function handleClearAll() {
    if (mealsForSelector.length > 0) {
      playSound('click');
      dispatch('add', []); // Dispatch 'add' with empty array of IDs to clear
    }
  }

  function handleClose() {
    playSound('click');
    dispatch('close');
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="modal-backdrop" on:click|self={handleClose} transition:fade={{ duration: 200 }}>
  <div class="modal" transition:scale={{ duration: 300, opacity: 0.5, start: 0.95, easing: quintOut }}
    role="dialog" aria-labelledby="modal-title" aria-modal="true">
    <div class="modal-header">
      <h2 id="modal-title">Select Baon for {format(date, 'MMMM d, yyyy')}</h2>
      <button class="close-button" on:click={handleClose} aria-label="Close modal">×</button>
    </div>
    <div class="baon-selector-wrapper">
      <BaonCardSelector
        currentSelection={mealsForSelector} 
        on:select={handleSelectionChangeFromSelector}
        on:viewRecipe={handleViewRecipe} 
        on:limitReached={() => console.log("Limit reached event received in DayModal")}
      />
    </div>
    <div class="actions">
      <button class="action-btn copy-btn" on:click={handleCopy} disabled={!mealsForSelector || mealsForSelector.length === 0}>
        <span class="icon" aria-hidden="true">📋</span> Copy
      </button>
      <button class="action-btn paste-btn" on:click={handlePaste} disabled={copiedMealIds.length === 0}>
          <span class="icon" aria-hidden="true">📌</span> Paste
      </button>
      <button class="action-btn clear-btn" on:click={handleClearAll} disabled={!mealsForSelector || mealsForSelector.length === 0}>
        <span class="icon" aria-hidden="true">🗑️</span> Clear All
      </button>
    </div>
  </div>
</div>

<style>
  /* --- Base Modal Styles (Themed) --- */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(10, 8, 30, 0.7); /* Themed backdrop color */
    backdrop-filter: blur(5px); /* Themed blur */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background-color: #231d52; /* Dark blue/purple */
    color: #fff5e1; /* Creamy white text */
    border: 1px solid #4a4090; /* Purple border */
    border-radius: 1rem;
    box-shadow: 0 5px 25px rgba(0,0,0,0.4);
    padding: 1.5rem;
    width: 90%;
    max-width: 500px; /* Allow slightly wider for selector */
    box-sizing: border-box;
    overflow-y: auto; /* Changed from hidden to auto */
    max-height: 90vh;
    display: flex; /* Use flex column */
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem; /* Reduced margin */
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #4a4090; /* Purple separator */
    flex-shrink: 0; /* Prevent header shrinking */
  }

  h2 {
    color: #fff; /* White heading */
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.8rem;
    line-height: 1;
    color: #fff5e1a8; /* Semi-transparent cream */
    cursor: pointer;
    padding: 0;
    margin: 0;
    transition: color 0.2s ease;
  }

  .close-button:hover, .close-button:focus {
    color: #fff; /* White on hover */
    outline: none;
  }

  .baon-selector-wrapper {
    flex-grow: 1; /* Allow selector to take available space */
    overflow: hidden; /* Prevent internal scrollbars from affecting layout */
    margin-top: 0.5rem;
    margin-bottom: 1rem; /* Space below selector */
    position: relative; /* For potential absolute elements inside */
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem; /* Adjusted margin */
    flex-wrap: wrap;
    justify-content: center;
    padding-top: 1rem;
    border-top: 1px solid #4a4090; /* Purple separator */
    flex-shrink: 0; /* Prevent actions shrinking */
  }

  .action-btn {
    background-color: #3a3375; /* Slightly lighter purple base */
    color: #fff5e1;
    border: 1px solid #5a50bf; /* Lighter border */
    padding: 0.7rem 1.1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .action-btn:hover:not(:disabled) {
    background-color: #4f46a8; /* Hover color */
    border-color: #7b6fce;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Adjusted shadow */
  }
  .action-btn:focus:not(:disabled) {
    outline: 2px solid #7b6fce; /* Focus color */
    outline-offset: 2px;
  }

  .action-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0,0,0,0.15);
  }

  .action-btn:disabled {
    background-color: #4a409080; /* Themed disabled */
    border-color: transparent;
    color: #fff5e199;
    cursor: not-allowed;
    opacity: 0.6;
    box-shadow: none;
  }

  .icon {
    font-size: 1.1rem;
    line-height: 1;
  }

  /* Specific button colors (override base theme) */
  .clear-btn { background-color: #e74c3c; border-color: #c0392b;}
  .clear-btn:hover:not(:disabled) { background-color: #c0392b; }

  .copy-btn { background-color: #3498db; border-color: #2980b9;}
  .copy-btn:hover:not(:disabled) { background-color: #2980b9; }

  .paste-btn { background-color: #2ecc71; border-color: #27ae60;}
  .paste-btn:hover:not(:disabled) { background-color: #27ae60; }


  /* --- Styles for BaonCardSelector INSIDE this modal --- */
  /* Target classes defined within BaonCardSelector.svelte */

  :global(.baon-selector-wrapper .selector) {
    /* Override selector styles for dark theme */
    max-height: 40vh; /* Adjust max height relative to viewport */
    scrollbar-color: #6a5acd #3a3375; /* Purple scrollbar on darker track */
    padding-right: 0.6rem; /* Add padding for scrollbar */
  }
  :global(.baon-selector-wrapper .selector::-webkit-scrollbar) {
    width: 8px;
  }
  :global(.baon-selector-wrapper .selector::-webkit-scrollbar-track) {
    background: #3a3375; /* Darker track */
  }
  :global(.baon-selector-wrapper .selector::-webkit-scrollbar-thumb) {
    background-color: #6a5acd; /* Purple thumb */
    border-radius: 10px;
  }

  :global(.baon-selector-wrapper .mini-card) {
    background-color: #3a3375; /* Card background */
    box-shadow: 0 3px 10px rgba(0,0,0,0.2); /* Adjusted shadow */
    border: 1px solid #4a4090; /* Add subtle border */
  }
  :global(.baon-selector-wrapper .mini-card:hover:not(.disabled)) {
    background-color: #4f46a8; /* Lighter hover */
    border-color: #6a5acd;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  }
  :global(.baon-selector-wrapper .mini-card.selected) {
    background-color: #4f46a8; /* Selected background */
    box-shadow: 0 0 0 2px #b388eb, 0 4px 12px rgba(179, 136, 235, 0.2); /* Keep selection shadow */
    border-color: #b388eb; /* Match selection shadow color */
  }
  :global(.baon-selector-wrapper .mini-card.selected::before) {
      background: #b388eb; /* Match selection border */
  }
  :global(.baon-selector-wrapper .mini-card.disabled) {
    opacity: 0.5; /* Adjust opacity */
    filter: grayscale(80%);
    background-color: #3a3375; /* Keep background consistent */
    border-color: #4a4090;
  }

  :global(.baon-selector-wrapper .mini-name) {
    color: #fff5e1; /* Creamy white name */
  }
  :global(.baon-selector-wrapper .mini-type) {
    /* Background color is set by style prop, ensure text is visible */
    color: #ffffff; /* White text usually works on colored tags */
    text-shadow: 0 1px 1px rgba(0,0,0,0.3); /* Improve contrast */
  }
  :global(.baon-selector-wrapper .placeholder-img) {
    background-color: #4f46a8; /* Placeholder bg */
    color: #fff5e1; /* Placeholder text */
  }
  :global(.baon-selector-wrapper .recipe-btn) {
    color: #fff5e1; /* Button icon color */
  }
  :global(.baon-selector-wrapper .recipe-btn:hover) {
     background-color: rgba(255, 245, 225, 0.1); /* Subtle cream highlight */
     color: #fff;
  }
  :global(.baon-selector-wrapper .no-meals) {
      color: #fff5e1a8; /* Semi-transparent text */
  }

  /* --- RESPONSIVE STYLES FOR PROBLEM SCREENS --- */

  /* Problem Screen 1: Tall Tablets (e.g., iPad Portrait) */
  @media (min-width: 700px) and (min-height: 1000px) {
    .modal {
      max-width: 680px; /* Wider modal */
      padding: 2rem;
      border-radius: 1.25rem; /* Slightly larger radius */
      max-height: 80vh;
    }
    h2#modal-title {
      font-size: 1.8rem; /* Larger title */
    }
    .close-button {
      font-size: 2.2rem;
    }
    .baon-selector-wrapper {
      min-height: 400px; /* Much more min height */
      margin-bottom: 2rem;
    }
    .actions {
      gap: 1rem;
      padding-top: 1.5rem;
      margin-top: 1.5rem;
    }
    .action-btn {
      padding: 0.9rem 1.6rem; /* Larger buttons */
      font-size: 1.7rem;
      border-radius: 0.6rem;
      gap: 0.6rem;
    }
    .action-btn .icon {
      font-size: 1.3rem;
    }
  }

  /* Problem Screen 2: Very Large/Tall Tablets */
  @media (min-width: 900px) and (min-height: 1300px) {
    .modal {
      max-width: 780px; /* Even wider */
      padding: 2.5rem;
      border-radius: 1.5rem;
    }
    h2#modal-title { font-size: 2.1rem; }
    .close-button { font-size: 2.5rem; }
    .baon-selector-wrapper {
      min-height: 500px; 
      margin-bottom: 2.5rem;
    }
    .actions { 
      gap: 1.2rem; 
      padding-top: 1.8rem; 
      margin-top: 1.8rem; 
    }
    .action-btn {
      padding: 1.1rem 2rem;
      font-size: 2rem;
      border-radius: 0.7rem;
      gap: 0.7rem;
    }
    .action-btn .icon { font-size: 1.5rem; }
  }
</style>