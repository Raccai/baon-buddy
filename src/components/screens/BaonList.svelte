<script>
  import { meals } from "../../lib/meals.js";
  import BaonCard from '../BaonCard.svelte';
  import { getFavorites } from "../../lib/storage";
  import RecipeSheet from "../RecipeSheet.svelte";
  import { tagStyles } from "../../lib/tags.js";
  import { fade } from 'svelte/transition';

  let selectedFilters = [];
  let filteredMeals = meals; // Initial state
  let selectedMeal = null;
  let showRecipe = false;
  let favoriteNames = getFavorites().map(meal => meal.name);

  const allTags = Object.keys(tagStyles);

  $: filteredMeals = meals.filter(meal => {
    const matchFilter = selectedFilters.length === 0 || selectedFilters.includes(meal.type);
    return matchFilter;
  });

  function toggleFilter(tag) {
    if (selectedFilters.includes(tag)) {
      selectedFilters = selectedFilters.filter(f => f !== tag);
    } else {
      selectedFilters = [...selectedFilters, tag];
    }
  }

  function openRecipe(meal) {
    selectedMeal = meal;
    showRecipe = true;
  }

  function closeRecipe() {
    showRecipe = false;
  }

  function refreshFavorites() {
      favoriteNames = getFavorites().map(meal => meal.name);
  }

</script>

<!-- ADDED baonlist-page wrapper back -->
<div class="baonlist-page">
  <!-- Sticky Filter Controls -->
  <div class="fixed-controls">
    <div class="filters-scroll">
      <div class="filters-inner">
        <button class:selected={selectedFilters.length === 0} class="filter-all-btn" on:click={() => selectedFilters = []}>All</button>
        {#each allTags as tag}
          {#if tagStyles[tag]}
            <button
              class="filter-tag-btn"
              class:selected={selectedFilters.includes(tag)}
              on:click={() => toggleFilter(tag)}
              style="--tag-bg-color: {tagStyles[tag].color}; --tag-text-color: {tagStyles[tag].textColor || '#fff'}"
            >
              {tagStyles[tag].label || tag}
            </button>
          {/if}
        {/each}
      </div>
    </div>
  </div>

  <!-- Main Content Area - Scrollable -->
  <div class="baonlist-container">
    {#if filteredMeals.length > 0}
      <div class="meals-grid">
        {#each filteredMeals as meal (meal.name)}
          <BaonCard
            on:viewRecipe={(e) => openRecipe(e.detail)}
            {meal}
            {favoriteNames}
            on:faveChange={refreshFavorites}
          />
        {/each}
      </div>
    {:else}
      <div class="no-results" transition:fade>
          <p>No Baon matches your filters!</p>
          <span>Try selecting different tags.</span>
      </div>
    {/if}
  </div>
</div> <!-- End baonlist-page -->

<RecipeSheet
  visible={showRecipe}
  meal={selectedMeal}
  on:close={closeRecipe}
/>

<style>
  /* Style the root wrapper to fill space from App.svelte */
  .baonlist-page {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Important: Prevents double scrollbars */
    background-color: #1a163f; /* Set background here if needed */
  }

  .fixed-controls {
    /* Position: sticky is now relative to baonlist-page */
    position: sticky;
    top: 0;
    z-index: 10;
    background: linear-gradient(to bottom, #231d52, #231d52f0);
    padding: 0.75rem 0;
    box-shadow: 0 2px 10px rgba(0,0,0,0.4);
    flex-shrink: 0;
  }

  .filters-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .filters-scroll::-webkit-scrollbar { display: none; }

  .filters-inner {
    display: flex;
    gap: 0.6rem;
    padding: 0.2rem 1rem;
    width: max-content;
  }

  .filters-inner button {
    padding: 0.5rem 1rem;
    border-radius: 999px;
    border: 1px solid transparent;
    font-weight: 600;
    white-space: nowrap;
    font-size: 0.9rem;
    flex-shrink: 0;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.8;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  .filter-tag-btn {
    background-color: var(--tag-bg-color);
    color: var(--tag-text-color);
    border-color: color-mix(in srgb, var(--tag-bg-color) 80%, black);
  }

  .filter-all-btn {
       background-color: #4a4090;
       color: #fff5e1;
       border-color: #6a5acd;
   }

  .filters-inner button:hover {
      opacity: 1;
      transform: translateY(-1px);
      filter: brightness(1.1);
  }

  .filters-inner button.selected {
    opacity: 1;
    outline: none;
    border: 2px solid #fff5e1;
    box-shadow: 0 0 8px rgba(255, 245, 225, 0.3);
    transform: scale(1.03);
  }

  .baonlist-container {
    /* This IS the scrollable area now */
    flex-grow: 1; /* Take remaining space */
    overflow-y: auto; /* Enable scrolling */
    padding: 1.5rem 1rem 2rem 1rem; /* Padding around grid */
    display: flex; /* Use flex to allow margin:auto on no-results */
    flex-direction: column;
    align-items: center; /* Center grid horizontally */
    -webkit-overflow-scrolling: touch;
  }

  .meals-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    width: 100%;
    max-width: 500px;
  }

  .no-results {
      text-align: center;
      padding: 3rem 1rem;
      color: #fff5e1a8;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: auto; /* Vertical centering within flex container */
  }
   .no-results p {
       font-size: 1.2em;
       font-weight: 600;
       margin-bottom: 0.5rem;
   }
   .no-results span {
       font-size: 0.9em;
   }
</style>