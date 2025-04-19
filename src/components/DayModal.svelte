<script>
  import { format } from 'date-fns';
  import { createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import BaonCardSelector from './BaonCardSelector.svelte'; // Correct import

  export let date;
  export let meals = [];
  export const mode = 'view';
  export let copiedMeals = null;

  const dispatch = createEventDispatcher();

  function handleAdd(mealsArray) {
    dispatch('add', mealsArray);
  }

  // This function is needed if BaonCardSelector needs to dispatch recipe view
  function handleViewRecipe(event) {
      dispatch('viewRecipe', event.detail); // Forward the event if needed
  }

  function handleCopy() {
    if (meals.length > 0) {
       dispatch('copy', meals);
    }
  }

  function handlePaste() {
    if (copiedMeals) {
        dispatch('paste');
    }
  }

  function handleClearAll() {
    if (meals.length > 0) {
        dispatch('add', []); // Dispatch 'add' with empty array to clear
    }
  }

  function handleClose() {
    dispatch('close');
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="modal-backdrop"
    on:click|self={handleClose}
    transition:fade={{ duration: 200 }}
>
  <div
    class="modal"
    transition:scale={{ duration: 300, opacity: 0.5, start: 0.95, easing: quintOut }}
    role="dialog"
    aria-labelledby="modal-title"
    aria-modal="true"
  >
    <div class="modal-header">
      <h2 id="modal-title">Select Baon for {format(date, 'MMMM d, yyyy')}</h2>
      <button class="close-button" on:click={handleClose} aria-label="Close modal">×</button>
    </div>

    <!-- Wrapper for BaonCardSelector to apply global styles effectively -->
    <div class="baon-selector-wrapper">
        <BaonCardSelector
            currentSelection={meals}
            on:select={e => handleAdd(e.detail)}
            on:viewRecipe={handleViewRecipe} 
        />
    </div>


    <div class="actions">
      <button class="action-btn copy-btn" on:click={handleCopy} disabled={!meals || meals.length === 0}>
        <span class="icon" aria-hidden="true">📋</span> Copy
      </button>
      <button class="action-btn paste-btn" on:click={handlePaste} disabled={!copiedMeals}>
        <span class="icon" aria-hidden="true">📌</span> Paste
      </button>
      <button class="action-btn clear-btn" on:click={handleClearAll} disabled={!meals || meals.length === 0}>
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
</style>