<script>
  import { meals } from "../../lib/meals.js";
  import BaonCard from '../BaonCard.svelte';
  import { getFavorites } from "../../lib/storage";
  import RecipeSheet from "../RecipeSheet.svelte";
  import { tagStyles } from "../../lib/tags.js";
  import { fade } from 'svelte/transition';
  // --- Onboarding Imports ---
  import { onMount, tick } from 'svelte';
  import { getOnboardingStatus, markScreenAsDone, isScreenDone, isOverallOnboardingComplete } from '../../lib/onboardingStore.js';
  import HintPopover from '../HintPopover.svelte';

  let selectedFilters = [];
  let filteredMeals = meals;
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

  // --- Onboarding Logic ---
  const FORCE_ONBOARDING_TESTING = true; // Set to false for normal behavior
  const screenName = 'baonlist';
  let showHints = false;
  let hintIndex = 0;
  let currentHintData = null;

  // Define hints for BaonList
  const baonListHints = [
      { targetSelector: '#baonlist-filters', text: 'Tap these tags to filter the Baon list!', position: 'bottom' },
      { targetSelector: '#first-baon-card-wrapper', text: 'Here are the Baon ideas! Tap the flast/potion icon to open a baon recipe, or tap the heart to add/remove from favorites.', position: 'bottom' },
      // Add more hints if needed
  ];
  const totalBaonListHints = baonListHints.length;
  let onboardingCheckStarted = false;

  async function startOnboardingHints() {
      if (onboardingCheckStarted) return;
      onboardingCheckStarted = true;

      console.log(`Checking onboarding status for ${screenName}...`);

      if (!FORCE_ONBOARDING_TESTING) {
        if (isOverallOnboardingComplete() || isScreenDone(screenName)) {
          console.log(`Onboarding skipped for ${screenName}.`);
          return;
        }
      }

      await tick(); // Wait for initial DOM render
      await new Promise(res => setTimeout(res, 150)); // Extra delay

      // Check if the first target exists before showing hints
      // Especially important for the card which depends on filteredMeals
       if (!document.querySelector(baonListHints[0].targetSelector)) {
            console.warn(`Initial target ${baonListHints[0].targetSelector} not found for ${screenName}. Skipping hints.`);
            // Optionally mark as done if hints can't start?
            // if (!FORCE_ONBOARDING_TESTING) markScreenAsDone(screenName);
            return;
       }

      console.log(`Attempting to show hints for ${screenName}.`);
      showHints = true;
      hintIndex = 0;
      currentHintData = baonListHints[hintIndex];
  }


  onMount(() => {
      // Delay the onboarding check
      setTimeout(startOnboardingHints, 300);
  });

  function handleNextHint() {
      hintIndex++;
      if (hintIndex < totalBaonListHints) {
          currentHintData = baonListHints[hintIndex];
      } else {
          // Should not be reached if last button is "Got it!"
          finishHintsCommon();
      }
  }

 function finishHintsCommon() {
      showHints = false;
      currentHintData = null;
      if (!FORCE_ONBOARDING_TESTING) {
           markScreenAsDone(screenName);
      }
       console.log(`Finished/Skipped hints for ${screenName} (Force: ${FORCE_ONBOARDING_TESTING})`);
  }

  function handleDoneHint() {
     finishHintsCommon();
  }

  function handleSkipHint() {
     finishHintsCommon();
  }

</script>

<div class="baonlist-page">
  <div class="fixed-controls">
    <div class="filters-scroll">
      <!-- ADD ID HERE -->
      <div class="filters-inner" id="baonlist-filters">
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

  <div class="baonlist-container">
    {#if filteredMeals.length > 0}
      <div class="meals-grid">
        {#each filteredMeals as meal, i (meal.name)}
          <!-- ADD WRAPPER WITH CONDITIONAL ID -->
          <div id={i === 0 ? 'first-baon-card-wrapper' : null}>
            <BaonCard
              on:viewRecipe={(e) => openRecipe(e.detail)}
              {meal}
              {favoriteNames}
              on:faveChange={refreshFavorites}
            />
          </div>
        {/each}
      </div>
    {:else}
      <div class="no-results" transition:fade>
          <p>No Baon matches your filters!</p>
          <span>Try selecting different tags.</span>
      </div>
    {/if}
  </div>
</div>

<!-- RecipeSheet Instance -->
<RecipeSheet
  visible={showRecipe}
  meal={selectedMeal}
  on:close={closeRecipe}
/>

<!-- Onboarding Hint Instance -->
{#if showHints && currentHintData}
  <HintPopover
    targetSelector={currentHintData.targetSelector}
    text={currentHintData.text}
    position={currentHintData.position || 'bottom'}
    totalHints={totalBaonListHints}
    currentHintIndex={hintIndex}
    on:next={handleNextHint}
    on:done={handleDoneHint}
    on:skip={handleSkipHint}
  />
{/if}

<style>
  /* Styles remain the same as previous BaonList version */
  .baonlist-page {
    height: 100%; width: 100%; display: flex; flex-direction: column;
    overflow: hidden; background-color: #1a163f;
  }
  .fixed-controls {
    position: sticky; top: 0; z-index: 10;
    background: linear-gradient(to bottom, #231d52, #231d52f0);
    padding: 0.75rem 0; box-shadow: 0 2px 10px rgba(0,0,0,0.4);
    flex-shrink: 0;
  }
  .filters-scroll {
    overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;
  }
  .filters-scroll::-webkit-scrollbar { display: none; }
  .filters-inner {
    display: flex; gap: 0.6rem; padding: 0.2rem 1rem; width: max-content;
  }
  .filters-inner button {
    padding: 0.5rem 1rem; border-radius: 999px; border: 1px solid transparent;
    font-weight: 600; white-space: nowrap; font-size: 0.9rem; flex-shrink: 0;
    cursor: pointer; transition: all 0.2s ease; opacity: 0.8;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .filter-tag-btn {
    background-color: var(--tag-bg-color); color: var(--tag-text-color);
    border-color: color-mix(in srgb, var(--tag-bg-color) 80%, black);
  }
  .filter-all-btn {
       background-color: #4a4090; color: #fff5e1; border-color: #6a5acd;
   }
  .filters-inner button:hover {
      opacity: 1; transform: translateY(-1px); filter: brightness(1.1);
  }
  .filters-inner button.selected {
    opacity: 1; outline: none; border: 2px solid #fff5e1;
    box-shadow: 0 0 8px rgba(255, 245, 225, 0.3); transform: scale(1.03);
  }
  .baonlist-container {
    flex-grow: 1; overflow-y: auto; padding: 1.5rem 1rem 6rem 1rem; /* Added more bottom padding */
    display: flex; flex-direction: column; align-items: center;
    -webkit-overflow-scrolling: touch;
  }
  .meals-grid {
    display: grid; grid-template-columns: 1fr; gap: 1rem;
    width: 100%; max-width: 500px;
  }
  .no-results {
      text-align: center; padding: 3rem 1rem; color: #fff5e1a8;
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; margin: auto;
  }
   .no-results p { font-size: 1.2em; font-weight: 600; margin-bottom: 0.5rem; }
   .no-results span { font-size: 0.9em; }

  /* Problem Screen 1: Tall Tablets (e.g., iPad Portrait) */
  @media (min-width: 700px) and (min-height: 1000px) {
    .fixed-controls {
      padding-top: 2rem;
    }

    .filters-inner button {
      font-size: 1.2rem;
    }
  }

  /* Problem Screen 2: Very Large/Tall Tablets */
  @media (min-width: 900px) and (min-height: 1300px) {
    .fixed-controls {
      padding-top: 5rem;
    }

    .filters-inner {
      gap: 1.4rem;
    }

    .filters-inner button {
      font-size: 2rem;
      padding: 0.6rem 2.4rem 0.8rem 2.4rem;
    }

    .meals-grid {
      justify-content: center;
    }
  }
</style>