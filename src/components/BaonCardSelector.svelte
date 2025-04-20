<script>
  import { meals } from '../lib/meals.js'; // Adjust path as needed
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition'; // Removed unused slide
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { tagStyles } from '../lib/tags.js'; // Adjust path as needed

  const dispatch = createEventDispatcher();

  export let currentSelection = [];
  let selectedMealsInternal = [];
  let sortedMeals = [];

  $: {
    const validSelection = Array.isArray(currentSelection) ? currentSelection : [];
    selectedMealsInternal = [...validSelection];
    updateSortedMeals();
  }

  function updateSortedMeals() {
    const selected = [];
    const unselected = [];
    const currentMeals = [...meals];

    currentMeals.forEach(meal => {
      if (isSelected(meal)) {
        selected.push(meal);
      } else {
        unselected.push(meal);
      }
    });

    sortedMeals = [
        ...selected.sort((a, b) => a.name.localeCompare(b.name)),
        ...unselected.sort((a, b) => a.name.localeCompare(b.name))
    ];
  }

  function toggleMeal(meal) {
    const index = selectedMealsInternal.findIndex(m => m.name === meal.name);
    const limit = 3; // Max selection limit

    if (index !== -1) {
      selectedMealsInternal.splice(index, 1);
    } else if (selectedMealsInternal.length < limit) {
      selectedMealsInternal.push(meal);
    } else {
        // Optionally dispatch an event or show a toast message for limit reached
        console.log(`Maximum selection limit (${limit}) reached.`);
        dispatch('limitReached', { limit }); // Example: dispatch event
        return;
    }

    selectedMealsInternal = [...selectedMealsInternal];
    dispatch('select', [...selectedMealsInternal]);
    // Note: updateSortedMeals is called reactively due to selectedMealsInternal change
  }

  function isSelected(meal) {
    return selectedMealsInternal.some(m => m.name === meal.name);
  }

  function viewRecipe(meal, event) {
      event.stopPropagation();
      dispatch('viewRecipe', meal);
  }

</script>

<div class="selector">
  {#if sortedMeals.length > 0}
    {#each sortedMeals as meal (meal.name)}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="mini-card {isSelected(meal) ? 'selected' : ''} {selectedMealsInternal.length >= 3 && !isSelected(meal) ? 'disabled' : ''}"
        on:click={() => toggleMeal(meal)}
        animate:flip={{ duration: 350, easing: quintOut }}
        role="button"
        tabindex="0"
        aria-pressed={isSelected(meal)}
        aria-disabled={selectedMealsInternal.length >= 3 && !isSelected(meal)}
        aria-label="{meal.name} - {meal.type || 'No type'}. {isSelected(meal) ? 'Selected.' : 'Click to select.'}"
      >
        <div class="mini-img">
          {#if meal.image}
            <img src={meal.image} alt="" loading="lazy" /> <!-- Decorative alt -->
          {:else}
            <div class="placeholder-img" aria-hidden="true">{meal.name ? meal.name[0] : '?'}</div>
          {/if}
        </div>
        <div class="mini-info">
          <span class="mini-name">{meal.name}</span>
          {#if meal.type}
            <span
              class="mini-type"
              style="background-color: {tagStyles[meal.type]?.color || '#ccc'}"
            >
              {meal.type}
            </span>
          {/if}
        </div>
        <div class="mini-actions">
          <!-- Use the SVG icon -->
          <button class="recipe-btn" on:click={(e) => viewRecipe(meal, e)} title="View Recipe for {meal.name}">
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
      <p>No meals available to select!</p>
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
    text-align: center;
    padding: 2rem 1rem;
    color: #666;
    font-size: 0.9rem;
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