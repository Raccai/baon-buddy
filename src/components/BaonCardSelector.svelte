<script>
  import { allMeals } from '../lib/mealStore.js'; 
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { tagStyles } from '../lib/tags.js';
  import { getDisplayImageSrc } from '../lib/imageUtils.js';
  import { showToast } from '../lib/toast.js'; // Assuming you have this for limit toast
  import { sfxClick } from '../lib/sfxClick.js';
  import { playSound } from '../lib/soundManager.js';

  const dispatch = createEventDispatcher();

  export let currentSelection = []; // Parent provides array of FULL MEAL OBJECTS for initial state
  
  let selectedMealsInternal = [];   // Internal state: Array of FULL MEAL OBJECTS
  let sortedAndFilteredMeals = [];  // Displayed list: Array of FULL MEAL OBJECTS
  
  let searchTerm = "";
  let debouncedSearchTerm = "";
  let searchTimeoutId = null;

  // Debounce searchTerm changes
  $: {
    if (searchTimeoutId) clearTimeout(searchTimeoutId);
    searchTimeoutId = setTimeout(() => {
      debouncedSearchTerm = searchTerm;
    }, 250);
  }

  // Sync internal selection with the `currentSelection` prop from parent (DayModal)
  $: {
    const propSelectionArray = Array.isArray(currentSelection) ? currentSelection : [];
    if (JSON.stringify(selectedMealsInternal.map(m=>m.id).sort()) !== JSON.stringify(propSelectionArray.map(m=>m.id).sort())) {
        // console.log('[BaonCardSelector] Prop `currentSelection` changed. Updating internal state.');
        // console.log('[BaonCardSelector] Old selectedMealsInternal IDs:', JSON.stringify(selectedMealsInternal.map(m=>m.id)));
        // console.log('[BaonCardSelector] New prop currentSelection IDs:', JSON.stringify(propSelectionArray.map(m=>m.id)));
        selectedMealsInternal = [...propSelectionArray]; // Make a new array copy from prop
    }
  }

  // Main reactive update for the displayed list
  $: if ($allMeals || selectedMealsInternal || debouncedSearchTerm !== undefined) {
    applySortAndFilter($allMeals, selectedMealsInternal, debouncedSearchTerm);
  }

  function applySortAndFilter(sourceMealList, currentInternalFullMealSelection, currentSearch) {
    const selectedOutput = [];
    const unselectedOutput = [];
    const mealsToProcess = sourceMealList || [];
    const searchLower = typeof currentSearch === 'string' ? currentSearch.toLowerCase().trim() : "";

    mealsToProcess.forEach(meal => {
      if (!meal || !meal.id) { // Check for meal and meal.id
          // console.warn("[BaonCardSelector] Meal missing or no ID in applySortAndFilter:", meal);
          return;
      }
      if (searchLower) {
        const nameMatch = meal.name && meal.name.toLowerCase().includes(searchLower);
        const typeMatch = meal.type && meal.type.toLowerCase().includes(searchLower);
        if (!nameMatch && !typeMatch) return; 
      }
      const mealKey = meal.id; // Use ID consistently
      if (currentInternalFullMealSelection.some(selMeal => selMeal.id === mealKey)) {
        selectedOutput.push(meal);
      } else {
        unselectedOutput.push(meal);
      }
    });
    sortedAndFilteredMeals = [
      ...selectedOutput.sort((a, b) => a.name.localeCompare(b.name)),
      ...unselectedOutput.sort((a, b) => a.name.localeCompare(b.name))
    ];
  }

  function toggleMeal(mealToToggle) {
    if (!mealToToggle || !mealToToggle.id) {
        console.error("[BaonCardSelector] toggleMeal called with invalid meal object", mealToToggle);
        return;
    }
    
    const mealIdToToggle = mealToToggle.id;
    const limit = 3;
    let newInternalSelectionArray = [...selectedMealsInternal]; 
    const index = newInternalSelectionArray.findIndex(m => m.id === mealIdToToggle);

    if (index !== -1) {
      newInternalSelectionArray.splice(index, 1);
    } else if (newInternalSelectionArray.length < limit) {
      newInternalSelectionArray.push(mealToToggle);
    } else {
      dispatch('limitReached', { limit });
      showToast(`You can select up to ${limit} Baon.`, "warning");
      return; 
    }
    selectedMealsInternal = newInternalSelectionArray;
    dispatch('select', [...selectedMealsInternal]); // Dispatch array of FULL MEAL OBJECTS
  }

  function isSelected(mealIdToCheck, currentFullMealSelection) { // Renamed parameter for clarity
    playSound('click');
    return currentFullMealSelection.some(m => m.id === mealIdToCheck);
  }
  
  function clearSearch() { 
    playSound('click');
    searchTerm = ""; 
  }
  function viewRecipe(meal, event) { 
    event.stopPropagation(); 
    playSound('sheetOpenClose');
    if (meal) dispatch('viewRecipe', meal); 
  }
  onDestroy(() => { if (searchTimeoutId) clearTimeout(searchTimeoutId); });
</script>

<div class="selector-controls">
  <input
    type="search"
    class="search-input"
    placeholder="Search Baon..."
    bind:value={searchTerm}
    aria-label="Search available Baon"
  />
  {#if searchTerm} 
    <button 
      class="clear-search-btn" 
      on:click={clearSearch} 
      aria-label="Clear search"
    >×</button>
  {/if}
</div>

<div class="selector">
  {#if sortedAndFilteredMeals.length > 0}
    {#each sortedAndFilteredMeals as meal (meal.id || meal.name)}
      {@const mealKey = meal.id || meal.name}
      {@const isCurrentlySelected = isSelected(mealKey, selectedMealsInternal)}
      {@const isDisabled = selectedMealsInternal.length >= 3 && !isCurrentlySelected}
      {@const displaySrc = getDisplayImageSrc(meal.image)}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="mini-card"
        class:selected={isCurrentlySelected}
        class:disabled={isDisabled}
        on:click={() => toggleMeal(meal)}
        animate:flip={{ duration: 350, easing: quintOut }}
        role="button"
        tabindex="0"
        aria-pressed={isCurrentlySelected}
        aria-disabled={isDisabled}
        aria-label="{meal.name} - {meal.type || 'No type'}. {isCurrentlySelected ? 'Selected.' : 'Click to select.'}"
      >
        <div class="mini-img">
          {#if displaySrc}
            <img src={displaySrc} alt="" loading="lazy" />
          {:else}
            <div class="placeholder-img" aria-hidden="true">{meal.name ? meal.name[0] : '?'}</div>
          {/if}
        </div>
        <div class="mini-info">
          <span class="mini-name">{meal.name}</span>
          {#if meal.type && tagStyles[meal.type]}
            {@const tagData = tagStyles[meal.type]}
            <span
              class="mini-type"
              style="background-color: {tagData.color}; color: {tagData.textColor || '#fff'}"
            >
              {tagData.label || meal.type}
            </span>
          {/if}
        </div>
        <div class="mini-actions">
          <button class="recipe-btn" use:sfxClick on:click={(e) => viewRecipe(meal, e)} title="View Recipe for {meal.name}">
            <!-- ... recipe svg ... -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" aria-hidden="true">
              <path d="m31.2 4.24a2.24 2.24 0 1 1 -2.2-2.24 2.24 2.24 0 0 1 2.2 2.24zm-8.2 8.32a3 3 0 1 0 -3-3 3 3 0 0 0 3 3zm19.44 31-10-15.36v-8.2a2.14 2.14 0 0 0 2.4-2.24 2 2 0 0 0 -1.84-2.16h-13.8a2 2 0 0 0 -2 2 2.09 2.09 0 0 0 0 .25 2.16 2.16 0 0 0 2.4 2.24v8.31l-10 15.2a4.26 4.26 0 0 0 -.24 4.24 3.91 3.91 0 0 0 3.52 2.16h26.12a3.9 3.9 0 0 0 3.52-2.16 4 4 0 0 0 -.16-4.24zm-18.8-14v-9.16h4.8v9.28l4.72 7.52h-14.28z" fill="currentColor"/>
            </svg>
            <span class="visually-hidden">View Recipe for {meal.name}</span>
          </button>
        </div>
      </div>
    {/each}
  {:else}
    <div class="no-meals" transition:fade>
      {#if debouncedSearchTerm} <!-- Show message based on debounced term -->
        <p>No Baon found matching "{debouncedSearchTerm}"!</p>
      {:else}
        <p>No Baon available!</p>
        <span>(Perhaps add some in "Manage Baon"?)</span>
      {/if}
    </div>
  {/if}
</div>


<style>
  /* Visually hidden class for accessibility */
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .selector {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    overflow-y: auto;
    padding: 0.5rem 0.2rem;
    scrollbar-width: thin;
    scrollbar-color: #ccc #eee; /* Base colors */
    height: 100%;
    box-sizing: border-box;
  }

  .selector::-webkit-scrollbar { width: 6px; }
  .selector::-webkit-scrollbar-track { background: #eee; border-radius: 10px; }
  .selector::-webkit-scrollbar-thumb { background-color: #ccc; border-radius: 10px; }

  .selector-controls {
    padding: 0.5rem 0.7rem 0.8rem 0.7rem; /* Adjusted padding */
    border-bottom: 1px solid #b388eb; /* Separator */
    flex-shrink: 0; /* Prevent controls from shrinking */
    position: relative; /* For clear button positioning */
  }

  .search-input {
    width: 100%;
    padding: 0.7rem 1rem;
    padding-right: 2.5rem; /* Space for clear button */
    border-radius: 1.5rem; /* Pill shape */
    border: 1px solid #4a4090;
    background-color: #2c2663; /* Lighter input bg */
    color: #fff5e1;
    font-size: 1rem;
    box-sizing: border-box;
  }

  .search-input:focus {
    outline: none; border-color: #b388eb;
    box-shadow: 0 0 0 2px rgba(179, 136, 235, 0.3);
  }

  /* Hide default clear button for search inputs */
  .search-input::-webkit-search-decoration,
  .search-input::-webkit-search-cancel-button,
  .search-input::-webkit-search-results-button,
  .search-input::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }

  .clear-search-btn {
    position: absolute;
    right: 1.5rem;
    top: 40%;
    transform: translateY(-50%);
    background: none; border: none; color: #fff5e1a8;
    font-size: 1.5rem; line-height: 1; padding: 0.2rem; cursor: pointer;
  }
  .clear-search-btn:hover {
    color: #333;
  }

  .mini-card {
    display: flex;
    align-items: center; /* Vertically align items */
    background-color: #fff;
    border-radius: 0.6rem;
    padding: 0.7rem 0.9rem; /* Adjusted padding */
    box-shadow: 0 2px 5px rgba(0,0,0,0.07);
    transition: all 0.2s ease-out, border-color 0.2s ease-out, background-color 0.2s ease-out;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    border: 1px solid transparent;
    min-height: 60px; /* Ensure minimum height */
  }

  .mini-card:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  }

  .mini-card:focus-visible:not(.disabled) {
    outline: 2px solid blue; /* Base focus */
    outline-offset: 2px;
  }

  .mini-card.disabled {
    opacity: 0.5;
    filter: grayscale(70%);
    cursor: not-allowed;
  }

  .mini-card.selected {
    box-shadow: 0 0 0 2px blue, 0 3px 8px rgba(0, 0, 255, 0.2); /* Base selected */
    border-color: blue;
  }

  .mini-card.selected::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 5px;
    background: blue; /* Base selected indicator */
    border-radius: 3px 0 0 3px;
  }

  .mini-img {
    width: 45px;  /* Slightly larger */
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden; /* Prevent image overflow */
    border-radius: 8px; /* Apply radius here */
  }

  .mini-img img {
    width: 100%;
    height: 100%;
    object-fit: contain; /* Use cover for better fit, but current images look better with contain */
    display: block;
    border-radius: inherit; /* Inherit radius from parent */
  }

  .placeholder-img {
    width: 100%;
    height: 100%;
    background-color: #ccc;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.4rem; /* Larger initial */
    text-transform: uppercase;
    flex-shrink: 0;
    border-radius: inherit; /* Inherit radius */
  }

  .mini-info {
    flex-grow: 1;
    padding-left: 1rem; /* Increased padding */
    display: flex;
    flex-direction: column;
    align-items: center; /* Center content vertically */
    min-width: 0; /* Prevent flex overflow */
    gap: 0.2rem; /* Add gap between name and type */
  }

  .mini-name {
    font-weight: 600;
    color: #333;
    font-size: 1rem; /* Larger name */
    line-height: 1.2; /* Adjust line height */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  .mini-type {
    font-size: 0.75rem;
    color: #fff;
    padding: 0.15rem 0.6rem;
    border-radius: 1rem;
    line-height: 1.2;
    display: inline-block;
    width: fit-content;
    /* margin-top is removed, using gap in parent */
  }

  .mini-actions {
    display: flex;
    align-items: center;
    margin-left: 0.5rem;
    flex-shrink: 0;
  }

  .recipe-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #555; /* Base icon color */
    padding: 8px; /* Adjust padding around SVG */
    transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    width: 36px; /* Explicit size */
    height: 36px;
  }

  .recipe-btn svg {
    width: 20px; /* Control SVG size */
    height: 20px;
    display: block; /* Remove extra space */
  }

  .recipe-btn:hover, .recipe-btn:focus-visible {
    transform: scale(1.1);
    background-color: rgba(0, 0, 0, 0.05);
    color: #000;
    outline: none;
  }

  .no-meals {
    margin-top: 1rem; /* Give some space if it's the only thing */
  }
  .no-meals span {
    font-size: 0.8rem;
    color: #888;
    margin-top: 0.3rem;
    display: block;
  }

  /* --- RESPONSIVE STYLES (Matching DayModal's :global) --- */

  /* Problem Screen 1: Tall Tablets */
  @media (min-width: 700px) and (min-height: 1000px) {
    .mini-card {
      padding: 4.4rem 4rem;
    }

    .mini-info {
      gap: 1rem;
    }

    .mini-name {
      font-size: 2rem;
    }

    .mini-type {
      font-size: 1.6rem;
      padding: 0.6rem 2rem;
    }

    .recipe-btn svg {
      transform: scale(3);
    }

    .mini-img {
      transform: scale(2);
    }
  }

  /* Problem Screen 2: Very Large/Tall Tablets */
  @media (min-width: 900px) and (min-height: 1300px) {
    .mini-card {
      padding: 4.4rem 4rem;
    }

    .mini-info {
      gap: 1rem;
    }

    .mini-name {
      font-size: 2rem;
    }

    .mini-type {
      font-size: 1.6rem;
      padding: 0.6rem 2rem;
    }

    .recipe-btn svg {
      transform: scale(3);
    }

    .mini-img {
      transform: scale(2);
    }
  }
</style>