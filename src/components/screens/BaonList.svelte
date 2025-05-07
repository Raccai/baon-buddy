<script>
  // Default meal import no longer needed directly here
  // import { meals } from "../../lib/meals.js";
  import BaonCard from '../BaonCard.svelte';
  import { getFavorites } from "../../lib/storage"; // Keep for initial favorite check? Or pass down from App?
  import RecipeSheet from "../RecipeSheet.svelte";
  import { tagStyles } from "../../lib/tags.js";
  import { fade } from 'svelte/transition';
  // --- Use the reactive store ---
  import { allMeals } from "../../lib/mealStore.js"; 
  // --- Onboarding Imports ---
  import { onMount, tick } from 'svelte';
  import { getOnboardingStatus, markScreenAsDone, isScreenDone, isOverallOnboardingComplete } from '../../lib/onboardingStore.js';
  import HintPopover from '../HintPopover.svelte';

  let selectedFilters = [];
  let filteredMeals = []; // Initialize empty, will be populated by reactive block
  let selectedMeal = null;
  let showRecipe = false;
  // Initialize favoriteNames directly or receive as prop if App manages it centrally
  let favoriteNames = getFavorites().map(meal => meal.name);

  // Assume tagStyles has all valid tags as keys
  const allTags = Object.keys(tagStyles);

  // --- Reactive block to filter meals ---
  // Runs whenever $allMeals store changes OR selectedFilters changes
  $: filteredMeals = ($allMeals || []).filter(meal => { // Use store value, default to empty array
    // Safety check for meal structure
    if (!meal || typeof meal !== 'object') return false;
    // Filter logic
    const matchFilter = selectedFilters.length === 0 || selectedFilters.includes(meal.type);
    return matchFilter;
  }).sort((a,b) => a.name.localeCompare(b.name)); // Optional: Keep sorted alphabetically

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
    selectedMeal = null; // Clear selected meal
  }

  // Refresh local favoriteNames state when a BaonCard event occurs
  // This is needed if BaonCard directly uses this prop for its heart icon state
  function refreshFavorites() {
    console.log("BaonList refreshing favorites state");
    favoriteNames = getFavorites().map(meal => meal.name);
  }

  // --- Onboarding Logic ---
  const FORCE_ONBOARDING_TESTING = false; // Set to false for normal behavior
  const screenName = 'baonlist';
  let showHints = false;
  let hintIndex = 0;
  let currentHintData = null;
  const baonListHints = [
    { targetSelector: '#baonlist-filters', text: '1. Tap these tags to filter the Baon list!', position: 'bottom' },
    { targetSelector: '#first-baon-card-wrapper', text: '2. Here are the Baon ideas! Tap the icon on the right to see a recipe, or tap the heart to add/remove from favorites.', position: 'bottom' },
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

    await tick();
    await new Promise(res => setTimeout(res, 150));

    // Check if hints can start
      if (!document.querySelector(baonListHints[0].targetSelector)) {
        console.warn(`Initial target ${baonListHints[0].targetSelector} not found for ${screenName}. Skipping hints.`);
        if (!FORCE_ONBOARDING_TESTING) markScreenAsDone(screenName);
        return;
      }
      // Also check if there's at least one card to target for the second hint
      // We need to wait until filteredMeals is populated
      if (filteredMeals.length === 0) {
        console.warn(`No meals available yet for ${screenName} hint 2. Will try again shortly.`);
        // Optionally retry later if meals might load async, otherwise skip
        setTimeout(startOnboardingHints, 500); // Retry after 500ms
        onboardingCheckStarted = false; // Allow retry
        return;
      }


    console.log(`Attempting to show hints for ${screenName}.`);
    showHints = true;
    hintIndex = 0;
    currentHintData = baonListHints[hintIndex];
  }

  onMount(() => {
    
    setTimeout(startOnboardingHints, 300); // Initial delay
  });

  function handleNextHint() {
    hintIndex++;
    if (hintIndex < totalBaonListHints) {
      // Check if the next target exists before showing
      const nextTargetSelector = baonListHints[hintIndex].targetSelector;
      if (document.querySelector(nextTargetSelector)) {
        currentHintData = baonListHints[hintIndex];
      } else {
        console.warn(`Target ${nextTargetSelector} not found for next hint. Skipping remaining hints.`);
        finishHintsCommon(); // Skip rest if target not ready
      }
    } else {
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
    <!-- Use reactive filteredMeals -->
    {#if filteredMeals.length > 0}
      <div class="meals-grid">
         <!-- Key by unique ID -->
        {#each filteredMeals as meal, i (meal.id || meal.name)}
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
    height: 100%; 
    width: 100%; 
    display: flex; 
    flex-direction: column;
    overflow: hidden; 
    background-color: #1a163f;
    padding-top: env(safe-area-inset-top, 0rem);
    padding-bottom: env(safe-area-inset-bottom, 0rem);
  }
  .fixed-controls {
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
  .filters-scroll::-webkit-scrollbar { 
    display: none; 
  }
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
    flex-grow: 1; 
    overflow-y: auto; 
    padding: 1.5rem 1rem 6rem 1rem; /* Added more bottom padding */
    display: flex; 
    flex-direction: column; 
    align-items: center;
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
    margin: auto;
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