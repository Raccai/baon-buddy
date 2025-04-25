<script>
  import Sparkle from '../../assets/Sparkle.svelte';
  import Tala from "/characters/Tala.png";
  import BaonCard from '../BaonCard.svelte';
  import TalaQuote from '../TalaQuote.svelte';
  import { incrementCounter } from '../../lib/storage';
  import { meals } from "../../lib/meals.js";
  import { getFavorites } from '../../lib/storage';
  import { createEventDispatcher, tick, onMount } from 'svelte';
  import { getOnboardingStatus, markScreenAsDone, isScreenDone, isOverallOnboardingComplete } from '../../lib/onboardingStore';
  import HintPopover from '../HintPopover.svelte';
  import { checkAndUnlockAchievements } from '../../lib/achievementStore';
  import { allMeals } from '../../lib/mealStore';

  const dispatch = createEventDispatcher();

  let suggestButtonElement;
  let favoriteNames = getFavorites().map(meal => meal.name);
  let suggestedMeals = [];
  let bounce = false;

  function dispatchViewRecipe(meal) {
    dispatch('viewRecipe', meal); // Dispatch event up to App.svelte
  }

  const FORCE_ONBOARDING_TESTING = false; // Keep for testing
  const screenName = 'home';
  let showHints = false;
  let hintIndex = 0;
  let currentHintData = null;

  const homeHints = [
    { targetSelector: '#home-suggest-button', text: 'Tap this button anytime to get a new suggestion.', position: 'top' },
    { targetSelector: '#home-baon-card', text: "Here's your suggested Baon! Double-tap or use ❤️ to favorite it.", position: 'top' },
    { targetSelector: '#topbar-manage-baon-btn', text: 'Use these buttons to check your favorites (heart icon)...', position: 'bottom' },
    { targetSelector: '#topbar-manage-baon-btn', text: 'To add, edit, or delete your own custom Baon recipes (notepad icon)...', position: 'bottom' },
    { targetSelector: '#topbar-manage-baon-btn', text: 'Or to check the settings (gear icon)!', position: 'bottom' },
  ];
  const totalHomeHints = homeHints.length;

  // Flag to prevent multiple initial checks
  let onboardingCheckStarted = false; 

  async function startOnboardingHints() {
    if (onboardingCheckStarted) return; // Only run once
    onboardingCheckStarted = true;

    console.log(`Checking onboarding status for ${screenName}...`);

    if (!FORCE_ONBOARDING_TESTING) {
      if (isOverallOnboardingComplete() || isScreenDone(screenName)) {
        console.log(`Onboarding skipped for ${screenName}.`);
        return;
      }
    }

    // Wait a single tick - crucial for Svelte 5 reactivity changes.
    // This ensures component state updates are flushed to the DOM.
    await tick();

    // Now attempt to show hints
    console.log(`Attempting to show hints for ${screenName}.`);
    showHints = true;
    hintIndex = 0; // Reset index
    currentHintData = homeHints[hintIndex];
  }

  
  function handleNextHint() {
    hintIndex++; // Move to the next index
    if (hintIndex < totalHomeHints) {
      currentHintData = homeHints[hintIndex];
    }
    // 'done' event will be handled by handleDoneHint
  }
  
  function handleDoneHint() { // Renamed for clarity
    showHints = false;
    currentHintData = null;
    markScreenAsDone(screenName);
  }
  
  function handleSkipHint() { // Handle skip explicitly
    showHints = false;
    currentHintData = null;
    markScreenAsDone(screenName); // Mark as done even if skipped
  }
  
  function generateMeals() {
    const currentMealList = $allMeals || []; // Read reactive store value
    console.log(`generateMeals called. Meal list length: ${currentMealList.length}`); // Debug log

    if (currentMealList.length === 0) {
        console.warn("Cannot generate meal, meal list is empty.");
        suggestedMeals = [];
        return;
    }
    suggestedMeals = [...currentMealList].sort(() => 0.5 - Math.random()).slice(0, 1);
    console.log("Generated meal:", suggestedMeals[0]?.name);

    bounce = false;
    requestAnimationFrame(() => bounce = true);
    incrementCounter("baonMealGenerations");
    checkAndUnlockAchievements();
  }

  onMount(() => {
    console.log("Home.svelte onMount");
  
    // Start onboarding check after delay
    setTimeout(startOnboardingHints, 300);
  
    // Subscribe to the store to generate the *first* meal
    // Unsubscribe is handled automatically by Svelte for $: blocks
    // OR use a manual unsubscribe if preferred
    const unsubscribe = allMeals.subscribe(currentMeals => {
        console.log("Home received allMeals update, length:", (currentMeals || []).length);
        // Generate only if meals are loaded AND we haven't suggested one yet
        if (currentMeals && currentMeals.length > 0 && suggestedMeals.length === 0) {
             console.log("Store has meals and suggestion is empty. Generating initial meal.");
             generateMeals();
             // Optional: unsubscribe after first generation if needed
             // unsubscribe();
         } else if (currentMeals && currentMeals.length === 0) {
             console.log("Store updated, but meal list is empty.");
             suggestedMeals = []; // Ensure placeholder shows if list becomes empty
         }
    });
  
    // --- Cleanup (Optional but good practice) ---
    // return () => {
    //     console.log("Home unsubscribing from allMeals");
    //     unsubscribe();
    // };
  
  });
</script>

<div class="home-wrapper">
  <!-- Background Effects -->
  <div class="stars-bg">
    {#each Array(40) as _, i} <div class="circle-star" style="top: {Math.random() * 100}%; left: {Math.random() * 100}%; animation-delay: {Math.random() * 3}s;"></div> {/each}
    {#each Array(20) as _, i} <div class="sparkle-star" style="top: {Math.random() * 100}%; left: {Math.random() * 100}%; width: {14 + Math.random() * 12}px; height: {14 + Math.random() * 12}px; animation-delay: {Math.random() * 3}s;"><Sparkle /></div> {/each}
  </div>
  <div class="dust-layer">
    {#each Array(50) as _, i} <div class="dust" style="top: {Math.random() * 100}%; left: {Math.random() * 100}%; animation-delay: {Math.random() * 5}s; animation-duration: {5 + Math.random() * 10}s;"></div> {/each}
  </div>
  <div class="flow-lines-bg">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="flow-svg" style="top: -250px;"><path d="M0,40 C25,20 75,60 100,40 L100,60 C75,80 25,20 0,60 Z" class="flow-fill" /></svg>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="flow-svg" style="top: 20px;"><path d="M0,40 C40,20 70,70 100,40 L100,60 C20,80 70,50 0,60 Z" class="flow-fill" /></svg>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="flow-svg" style="top: 340px;"><path d="M0,40 C20,15 80,65 100,40 L100,60 C70,85 30,15 0,60 Z" class="flow-fill" /></svg>
  </div>
  <!-- End Background Effects -->

  <!-- Content Area -->
  <div class="home-content">
      <div class="character-space">
        <img src={Tala} alt="Tala" class="tala-floating"> <!-- Animation applied here -->
      </div>

      <div class="card-container">
        {#if suggestedMeals.length > 0}
          <div id="home-baon-card">
            {#each suggestedMeals as meal (meal.name)}
              <BaonCard
                on:viewRecipe={(e) => dispatchViewRecipe(e.detail)}
                {meal}
                {favoriteNames}
                triggerBounce={bounce}
                on:faveChange={() => {
                  favoriteNames = getFavorites().map(m => m.name);
                }}
              />
            {/each}
          </div>
        {:else}
           <div class="no-meal-placeholder">Loading Baon...</div> <!-- Placeholder -->
        {/if}

        <button
          bind:this={suggestButtonElement}
          id="home-suggest-button"
          class="randomize-btn"
          on:click={generateMeals}
        >
          Suggest Baon ✨
        </button>
      </div>

      <!-- Position TalaQuote relative to other elements, thought uncertain if will still use -->
      <TalaQuote />
  </div>
</div>

<!-- For Onboarding Hints -->
{#if showHints && currentHintData}
  <HintPopover
    targetSelector={currentHintData.targetSelector}
    text={currentHintData.text}
    position={currentHintData.position || 'bottom'}
    totalHints={totalHomeHints}
    currentHintIndex={hintIndex}
    on:next={handleNextHint}
    on:done={handleDoneHint}
    on:skip={handleSkipHint}
  />
{/if}

<style lang="css">
  .home-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    background: linear-gradient(160deg, #2c2663 0%, #4a4090 40%, #b388eb 100%);
  }

  .home-content {
      width: 100%;
      height: 100%;
      position: relative; /* Crucial for absolute positioning children */
      z-index: 1;
       display: flex; /* Use flex mainly for alignment fallback */
       flex-direction: column;
       align-items: center;
       /* We will use absolute positioning primarily */
       justify-content: flex-end; /* Align items towards bottom initially */
  }

  /* Background Effects */
  .stars-bg, .dust-layer, .flow-lines-bg {
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; overflow: hidden; z-index: 0;
  }
  .flow-fill { fill: rgba(255, 245, 225, 0.08); } /* Even subtler */
  .dust { background-color: rgba(255, 245, 225, 0.1); }
  .circle-star { background: rgba(255, 245, 225, 0.7); }
  .sparkle-star :global(svg) { fill: rgba(255, 245, 225, 0.8); }
  @keyframes twinkle {
    0%, 100% { opacity: 0.3; transform: scale(0.9); }
    50% { opacity: 1; transform: scale(1.1); }
  }
  @keyframes floatDust {
    0% { transform: translate(0, 0); opacity: 0.1; }
    50% { opacity: 0.4; }
    100% { transform: translate(-30vw, -60vh) scale(0.5); opacity: 0; }
  }


  /* Content Positioning & Sizing */
  .card-container {
    position: absolute;
    /* Base bottom position: consider navbar height + safe area + desired gap */
    /* Let's use rems and safe-area */
    bottom: calc(env(safe-area-inset-bottom, 0rem) + 5.5rem); /* Approx 70px navbar + 1rem gap */
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 380px;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 5;
    gap: 0.8rem;
  }

  .no-meal-placeholder { /* Style for when no meal is suggested yet */
      background-color: rgba(255, 245, 225, 0.8);
      color: #4a4090;
      padding: 2rem 1rem;
      border-radius: 1rem;
      text-align: center;
      font-weight: 500;
      min-height: 150px; /* Give it some size */
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
  }

  .character-space {
    position: absolute;
    /* Position Tala relative to the card container's top */
    /* This requires knowing card height or estimating, and I'm cooked */
    /* Alternative: Position relative to bottom, above card container, but will experiment */
    bottom: calc(env(safe-area-inset-bottom, 0rem) + 18rem); /* Trial and error for now */
    left: 50%;
    transform: translateX(-50%);
    /* Let height be intrinsic, control via image max-height */
    height: auto;
    width: 80%; /* Control width */
    max-width: 300px; /* Max width for Tala */
    z-index: 4; /* Below card */
    display: flex; /* Center image inside */
    justify-content: center;
    align-items: flex-end;
    pointer-events: none;
  }

  .tala-floating {
    display: block;
    width: 100%; /* Fill character-space width */
    max-width: 100%; /* Ensure it doesn't exceed container */
    height: auto; /* Maintain aspect ratio */
    max-height: 45vh; /* Limit height based on viewport */
    object-fit: contain;
    /* --- Animation is correctly applied here --- */
    animation: bob 3s ease-in-out infinite;
    filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.2));
  }
  @keyframes bob {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }

  /* Reverted Button Style */
  .randomize-btn {
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
    background-color: #231d52; /* Theme primary */
    color: #fff5e1;
    border: 1px solid #4a4090; /* Theme border */
    border-radius: 2rem; /* Pill shape */
    cursor: pointer;
    font-weight: 600; /* Bolder */
    /* Themed shadow + glow */
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2), 0 0 15px rgba(255, 245, 225, 0.15);
    transition: all 0.2s ease;
    z-index: 5; /* Ensure button is clickable */
  }
  .randomize-btn:hover, .randomize-btn:focus-visible {
    background: #3a3375; /* Lighter hover */
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 245, 225, 0.25);
    outline: none;
  }
  .randomize-btn:active {
    transform: translateY(0px) scale(0.97); /* Add active scale */
    background-color: #4f46a8; /* Darker active */
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2), 0 0 10px rgba(255, 245, 225, 0.1);
  }

  /* Position TalaQuote */
  :global(.tala-quote-container) {
      position: absolute;
      /* Position slightly above character-space */
      bottom: calc(env(safe-area-inset-bottom, 0rem) + 20rem + 30vh); /* Adjust this complex calc */
      width: 80%;
      max-width: 350px; /* Adjust max width */
      z-index: 6; /* Above character */
      left: 50%;
      transform: translateX(-50%);
      color: #fff;
      text-shadow: 0 1px 3px rgba(0,0,0,0.4);
      pointer-events: none; /* Prevent interfering with clicks */
      text-align: center;
  }


  /* --- Media Queries for Responsive Adjustments --- */
  /* Focus on adjusting vertical positions and max-heights */

  /* Medium Height Screens */
  @media (max-height: 800px) {
    .character-space { bottom: calc(env(safe-area-inset-bottom, 0rem) + 16rem); }
    .tala-floating { max-height: 40vh; }
    :global(.tala-quote-container) { bottom: calc(env(safe-area-inset-bottom, 0rem) + 18rem + 25vh); }
  }

  /* Shorter Screens */
  @media (max-height: 700px) {
    .character-space { bottom: calc(env(safe-area-inset-bottom, 0rem) + 15rem); }
    .tala-floating { max-height: 35vh; }
    :global(.tala-quote-container) { bottom: calc(env(safe-area-inset-bottom, 0rem) + 17rem + 20vh); }
    .card-container { bottom: calc(env(safe-area-inset-bottom, 0rem) + 4.5rem); }
  }

  /* Very Short Screens */
  @media (max-height: 600px) {
    .character-space { bottom: calc(env(safe-area-inset-bottom, 0rem) + 14rem); }
    .tala-floating { max-height: 30vh; }
    :global(.tala-quote-container) { display: none; } /* Hide quote if too cramped */
    .card-container { bottom: calc(env(safe-area-inset-bottom, 0rem) + 4rem); }
    .randomize-btn { padding: 0.7rem 1.3rem; font-size: 0.95rem;}
  }

  /* Problem screens, specific styling */
  @media (min-width: 700px) and (min-height: 1000px) {
    .character-space { 
      bottom: calc(env(safe-area-inset-bottom, 0rem) + 20rem); 
      width: 100%;
      max-width: 500px;
    }
    .tala-floating { height: 120vh; }
    .card-container { bottom: calc(env(safe-area-inset-bottom, 0rem) + 6rem); }
    .randomize-btn { padding: 1rem 3rem; font-size: 1.4rem;}
    #home-baon-card {
      width: 90vw;
      display: flex;
      justify-content: center;
    }
  }

  @media (min-width: 900px) and (min-height: 1300px) {
    .character-space { 
      bottom: calc(env(safe-area-inset-bottom, 0rem) + 28rem); 
      width: 100%;
      max-width: 500px;
    }
    .tala-floating { height: 120vh; }
    .card-container { gap:2rem; bottom: calc(env(safe-area-inset-bottom, 0rem) + 6rem); }
    .randomize-btn { padding: 2rem 3rem; font-size: 2rem;}
  }
</style>