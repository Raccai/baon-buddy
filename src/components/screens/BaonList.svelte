<script>
  import { meals } from "../../lib/meals.js";
  import BaonCard from '../BaonCard.svelte';
  import { getFavorites } from "../../lib/storage";
  import RecipeSheet from "../RecipeSheet.svelte";
  import { onMount, onDestroy } from 'svelte';
  import { scale, fade } from "svelte/transition";

  let search = '';
  let selectedFilters = [];
  let filteredMeals = meals;
  let selectedMeal = null;
  let showRecipe = false;
  let favoriteNames = getFavorites().map(meal => meal.name);
  let showSearch = false;

  const allTags = ['budget', 'classic', 'quick', 'healthy', 'instant'];

  // Update filteredMeals whenever search/filter changes
  $: filteredMeals = meals.filter(meal => {
    const matchSearch = meal.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = selectedFilters.length === 0 || selectedFilters.includes(meal.type);
    return matchSearch && matchFilter;
  });

  function toggleFilter(tag) {
    if (selectedFilters.includes(tag)) {
      selectedFilters = selectedFilters.filter(f => f !== tag);
    } else {
      selectedFilters = [...selectedFilters, tag];
    }
  }

  function handleWindowClick(e) {
    const isInsideControls = e.target.closest('.fixed-controls');
    if (!isInsideControls) showSearch = false;
  }

  onMount(() => {
    window.addEventListener('click', handleWindowClick);
  });

  onDestroy(() => {
    window.removeEventListener('click', handleWindowClick);
  });

  function openRecipe(meal) {
    selectedMeal = meal;
    showRecipe = true;
  }

  function closeRecipe() {
    showRecipe = false;
  }

  const tagLabels = {
    budget: "Budget",
    classic: "Classic",
    quick: "Quick",
    healthy: "Healthy",
    instant: "Instant"
  };

  function getColor(tag) {
    const map = {
      budget: "#FFBB33",
      classic: "#FF6666",
      quick: "#CC4444",
      healthy: "#55CC99",
      instant: "#3399FF"
    };
    return map[tag] || "#666";
  }
</script>

<div class="baonlist-wrapper">
  <!-- Filters -->
  <div class="fixed-controls">
    <div class="filters-scroll">
      <div class="filters-inner">
        {#each allTags as tag}
          <button
            class:selected={selectedFilters.includes(tag)}
            on:click={() => toggleFilter(tag)}
            style="background-color: {getColor(tag)}"
          >
            {tagLabels[tag]}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div class="baonlist-container">
    <!-- Meal Cards -->
    <div class="meals-grid">
      {#each filteredMeals as meal (meal.name)}
        <BaonCard 
          {meal} 
          on:viewRecipe={(e) => openRecipe(e.detail)} 
          {favoriteNames}
        />
      {/each}
    </div>
  </div>
</div>

<RecipeSheet 
  visible={showRecipe} 
  meal={selectedMeal} 
  on:close={closeRecipe}
/>

<style>
  .fixed-controls {
    position: sticky;
    top: 0;
    z-index: 9;
    background: #191337;
    padding: 1.25rem 0 0.75rem 0;
    box-sizing: border-box;
  }

  .filters-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .filters-inner {
    display: flex;
    gap: 0.5rem;
    padding: 0 1rem; /* LEFT and RIGHT GAPS */
    width: max-content;
  }

  .filters-scroll::-webkit-scrollbar {
    display: none;
  }

  .filters-inner button {
    padding: 0.4rem 0.9rem;
    border-radius: 999px;
    border: none;
    font-weight: bold;
    white-space: nowrap;
    color: #fff;
    opacity: 0.9;
    font-size: 0.85rem;
    flex-shrink: 0;
  }

  .filters-inner button.selected {
    outline: 2px solid white;
  }

  .baonlist-wrapper {
    position: absolute;
    top: 68px;
    bottom: 70px;
    left: 0;
    right: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .baonlist-container {
    padding: 1rem 1.25rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .meals-grid {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>