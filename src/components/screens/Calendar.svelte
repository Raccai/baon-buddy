<script>
  // Core Svelte and date-fns imports
  import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
  import { fade, fly } from 'svelte/transition';

  // App-specific imports
  import { calendarData, addBaon, removeBaon, copyBaon, pasteBaon } from '../../lib/calendar.js';
  import { tagStyles } from '../../lib/tags.js';
  import RecipeSheet from '../RecipeSheet.svelte';
  import DayModal from '../DayModal.svelte';
  import Sparkle from '../../assets/Sparkle.svelte';

  // --- Onboarding Imports ---
  import { onMount, tick } from 'svelte';
  import { getOnboardingStatus, markScreenAsDone, isScreenDone, isOverallOnboardingComplete } from '../../lib/onboardingStore.js';
  import HintPopover from '../HintPopover.svelte';

  // Component state
  let showRecipeSheet = false;
  let selectedRecipeMeal = null;
  let currentMonth = new Date();
  let selectedDate = null;
  let modalMode = 'view';
  let copiedMeals = null;
  let transitionDirection = 1;

  // --- Onboarding State ---
  const FORCE_ONBOARDING_TESTING = false; // Set to false for normal behavior
  const screenName = 'calendar';
  let showHints = false;
  let hintIndex = 0;
  let currentHintData = null;
  let onboardingCheckStarted = false;

  // Define hints for Calendar
  // Note: Targeting the first day requires waiting for the grid to render
  const calendarHints = [
    { targetSelector: '#calendar-prev-month-btn', text: '1. Use these arrows to navigate between months.', position: 'right' },
    { targetSelector: '#calendar-today-btn', text: '2. Tap here to jump quickly back to the current month.', position: 'bottom' },
    { targetSelector: '#calendar-first-day-cell', text: '3. Tap any day to view or add Baon for that date.', position: 'bottom' },
  ];
  const totalCalendarHints = calendarHints.length;
  // --- Onboarding Functions ---
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
    await new Promise(res => setTimeout(res, 200)); // Slightly longer delay for calendar grid

      // Check if the first target exists
      if (!document.querySelector(calendarHints[0].targetSelector)) {
        console.warn(`Initial target ${calendarHints[0].targetSelector} not found for ${screenName}. Skipping hints.`);
        if (!FORCE_ONBOARDING_TESTING) markScreenAsDone(screenName); // Mark done if cannot start
        return;
      }

    console.log(`Attempting to show hints for ${screenName}.`);
    showHints = true;
    hintIndex = 0;
    currentHintData = calendarHints[hintIndex];
  }

  function handleNextHint() {
    hintIndex++;
    if (hintIndex < totalCalendarHints) {
      // Important: Add a tick before setting next hint data if target might change/appear
      tick().then(() => {
      currentHintData = calendarHints[hintIndex];
      });
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

  function handleDoneHint() { finishHintsCommon(); }
  function handleSkipHint() { finishHintsCommon(); }

  // --- Functions ---
  function openModal(day) {
    selectedDate = day;
    modalMode = copiedMeals ? 'copyTarget' : 'view';
  }

  function closeModal() {
    selectedDate = null;
    // Reset copy mode when modal closes *if* it was in a copy state
    if (modalMode === 'copySource' || modalMode === 'copyTarget') {
      modalMode = 'view';
      // Keep copiedMeals to allow pasting later unless explicitly cleared
      // copiedMeals = null; // Uncomment this line if closing should always clear copied data
    }
  }

  function handleCopy({ detail }) {
    copiedMeals = detail; // detail should be the meals array from DayModal
    modalMode = 'copySource';
    // Keep modal open
  }

  function handlePaste() {
    if (!copiedMeals || !selectedDate) return;
    pasteBaon(format(selectedDate, 'yyyy-MM-dd'), copiedMeals);
    modalMode = 'copyTarget'; // Remain in paste mode
    // Keep modal open
  }

  function goToToday() {
    const today = new Date();
    if (!isSameMonth(currentMonth, today)) {
      transitionDirection = today > currentMonth ? 1 : -1;
      currentMonth = today;
    }
  }

  function changeMonth(direction) {
    transitionDirection = direction;
    if (direction === 1) {
      currentMonth = addMonths(currentMonth, 1);
    } else {
      currentMonth = subMonths(currentMonth, 1);
    }
  }

  function openRecipeSheet(meal) {
    selectedRecipeMeal = meal;
    showRecipeSheet = true;
  }

  function closeRecipeSheet(meal) {
    showRecipeSheet = false;
    selectedRecipeMeal = null; 
  }

  onMount(() => {
    // Delay the onboarding check
    setTimeout(startOnboardingHints, 300);
  });

  // --- Reactive Calculations ---
  $: start = startOfMonth(currentMonth);
  $: end = endOfMonth(currentMonth);
  $: days = eachDayOfInterval({ start, end });
  $: leadingBlanks = Array(getDay(start)).fill(null);
  $: xOffset = 75 * transitionDirection;

</script>

<!-- Main container with background -->
<div class="calendar-main">
  <!-- Background Effects -->
  <div class="stars-bg">
    {#each Array(40) as _, i}
      <div class="circle-star" style="top: {Math.random() * 100}%; left: {Math.random() * 100}%; animation-delay: {Math.random() * 3}s;"></div>
    {/each}
    {#each Array(20) as _, i}
      <div class="sparkle-star" style="top: {Math.random() * 100}%; left: {Math.random() * 100}%; width: {14 + Math.random() * 12}px; height: {14 + Math.random() * 12}px; animation-delay: {Math.random() * 3}s;">
        <Sparkle />
      </div>
    {/each}
  </div>
  <div class="dust-layer">
    {#each Array(50) as _, i}
      <div class="dust" style="top: {Math.random() * 100}%; left: {Math.random() * 100}%; animation-delay: {Math.random() * 5}s; animation-duration: {5 + Math.random() * 10}s;"></div>
    {/each}
  </div>
  <div class="flow-lines-bg">
     <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="flow-svg" style="top: -250px;">
      <path d="M0,40 C25,20 75,60 100,40 L100,60 C75,80 25,20 0,60 Z" class="flow-fill" />
    </svg>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="flow-svg" style="top: 20px;">
      <path d="M0,40 C40,20 70,70 100,40 L100,60 C20,80 70,50 0,60 Z" class="flow-fill" />
    </svg>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="flow-svg" style="top: 340px;">
      <path d="M0,40 C20,15 80,65 100,40 L100,60 C70,85 30,15 0,60 Z" class="flow-fill" />
    </svg>
  </div>
  <!-- End Background Effects -->

  <!-- Calendar Content container -->
  <div class="calendar-cont">
    <!-- Month and Year Header -->
    <div class="calendar-header">
      <!-- ADD ID -->
      <button id="calendar-prev-month-btn" class="month-nav" on:click={() => changeMonth(-1)} aria-label="Previous Month">
        <span class="arrow">◀</span>
      </button>
      <div class="current-month-container">
        {#key currentMonth}
          <h2 in:fade={{ duration: 200, delay: 200 }} out:fade={{ duration: 200 }}>
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        {/key}
      </div>
       <!-- ADD ID -->
      <button id="calendar-next-month-btn" class="month-nav" on:click={() => changeMonth(1)} aria-label="Next Month">
        <span class="arrow">▶</span>
      </button>
    </div>

    <!-- Action Buttons -->
    <div class="calendar-actions">
       <!-- ADD ID -->
      <button id="calendar-today-btn" class="today-btn" on:click={goToToday}>
        <span class="icon" aria-hidden="true">📅</span> Today
      </button>
    </div>

    <!-- Day Labels -->
    <div class="day-labels">
      <div>Sun</div>
      <div>Mon</div>
      <div>Tue</div>
      <div>Wed</div>
      <div>Thurs</div>
      <div>Fri</div>
      <div>Sat</div>
    </div>

    <!-- Calendar Grid Container -->
    <div class="calendar-container">
      {#key currentMonth}
        <div
          class="calendar"
          in:fly={{ x: xOffset, duration: 300, delay: 100 }}
          out:fly={{ x: -xOffset, duration: 300 }}
        >
          {#each leadingBlanks as _}
            <div class="day blank"></div>
          {/each}

          {#each days as day, i (format(day, 'yyyy-MM-dd'))}
            {@const dayKey = format(day, 'yyyy-MM-dd')}
            <!-- ADD Conditional ID to the first actual day -->
            <div
              id={i === 0 ? 'calendar-first-day-cell' : null}
              class="day {isToday(day) ? 'today' : ''}"
              on:click={() => openModal(day)}
              role="button"
              tabindex="0"
              aria-label="View baon for {format(day, 'MMMM d, yyyy')}"
              on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') openModal(day); }}
            >
              <span class="day-number">{format(day, 'd')}</span>
              {#if $calendarData[dayKey]?.length}
                <div class="day-content">
                  {#each $calendarData[dayKey] as meal (meal.id || meal.name) }
                    <div class="meal-indicator" style="background-color: {tagStyles[meal.type]?.color || '#ccc'}" title="{meal.name} ({meal.type})"></div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/key}
    </div> <!-- End calendar-container -->
  </div> <!-- End calendar-cont -->
</div> <!-- End calendar-main -->

{#if selectedDate}
  <DayModal
    date={selectedDate}
    meals={$calendarData[format(selectedDate, 'yyyy-MM-dd')] || []}
    mode={modalMode}
    copiedMeals={copiedMeals}
    on:add={(e) => addBaon(format(selectedDate, 'yyyy-MM-dd'), e.detail)}
    on:remove={(e) => removeBaon(format(selectedDate, 'yyyy-MM-dd'), e.detail)}
    on:copy={handleCopy}
    on:paste={handlePaste}
    on:close={closeModal}
    on:viewRecipe={(e) => openRecipeSheet(e.detail)}
  />
{/if}

<!-- Recipe Sheet Added -->
<RecipeSheet 
  visible={showRecipeSheet}
  meal={selectedRecipeMeal}
  on:close={closeRecipeSheet}
/>

<!-- Onboarding Hint Instance -->
{#if showHints && currentHintData}
  <HintPopover
    targetSelector={currentHintData.targetSelector}
    text={currentHintData.text}
    position={currentHintData.position || 'bottom'}
    totalHints={totalCalendarHints}
    currentHintIndex={hintIndex}
    on:next={handleNextHint}
    on:done={handleDoneHint}
    on:skip={handleSkipHint}
  />
{/if}

<style>
  /* --- Copied Background Styles from Home.svelte --- */
  .stars-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
    z-index: 0; /* Ensure background is behind */
  }

  .circle-star {
    position: absolute;
    width: 4px;
    height: 4px;
    background: white;
    border-radius: 50%;
    opacity: 0.6;
    animation: twinkle 2s infinite ease-in-out alternate; /* Use alternate for smoother twinkle */
  }

  .sparkle-star {
    position: absolute;
    /* width/height set inline */
    opacity: 0.7;
    animation: twinkle 3s infinite ease-in-out alternate; /* Use alternate */
    display: flex; /* Needed for SVG sizing */
    align-items: center;
    justify-content: center;
  }

  .sparkle-star :global(svg) { /* Target SVG inside Sparkle component */
    width: 100%;
    height: 100%;
    fill: #fff5e1; /* Creamy white sparkle color */
    filter: drop-shadow(0 0 3px #fff5e1); /* Add a glow */
  }


  @keyframes twinkle {
    from { opacity: 0.3; transform: scale(0.9); }
    to   { opacity: 1; transform: scale(1.1); }
  }

  .flow-lines-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    opacity: 0.25; /* Slightly reduced opacity */
    overflow: hidden;
  }

  .flow-svg {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
  }

  .flow-fill {
    fill: #231d52a9; /* Dark blue fill */
  }

  .dust-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .dust {
    position: absolute;
    width: 5px; /* Slightly smaller */
    height: 5px;
    border-radius: 50%;
    background-color: rgba(255, 245, 225, 0.12); /* Creamy white dust */
    animation: floatDust linear infinite;
    /* Removed transform-origin as it's not needed for simple translate */
  }

  @keyframes floatDust {
    0% { transform: translate(0, 0); opacity: 0; }
    10%, 90% { opacity: 0.4; } /* Fade in/out */
    100% { transform: translate(-20vw, -50vh) scale(0.5); opacity: 0; } /* Adjust travel distance/direction */
  }
  /* --- End Copied Background Styles --- */


  /* --- Calendar Specific Styles --- */
  .calendar-main {
    width: 100%;
    height: 100vh; /* Full viewport height */
    box-sizing: border-box;
    overflow: hidden; /* Prevent main scrollbar, content scrolls inside */
    background-color: #1a163f; /* Dark base background */
    position: relative; /* For positioning background elements */
    color: #fff5e1; /* Default text color (creamy white) */
  }

  .calendar-cont {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    box-sizing: border-box; /* Include padding in height/width */
    position: relative; /* Above background */
    z-index: 1;
    overflow-y: auto; /* Allow content scrolling if needed */
    -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  }

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0; /* Reduced vertical padding */
    width: 100%;
    max-width: 500px; /* Max width for header content */
    margin-bottom: 1rem;
    position: relative; /* For h2 transition positioning */
    z-index: 2; /* Above grid */
    flex-shrink: 0; /* Prevent header from shrinking */
  }

  .current-month-container {
    position: relative;
    overflow: hidden;
    height: 2.2em; /* Ensure enough height for text */
    display: flex;
    justify-content: center;
    align-items: center;
    flex-grow: 1; /* Allow container to take available space */
    text-align: center;
    margin: 0 0.5rem; /* Space around month name */
  }

  .calendar-header h2 {
    position: absolute; /* For fade transition */
    width: 100%;
    margin: 0;
    font-size: 1.5rem; /* Slightly larger */
    color: #fff5e1;
    font-weight: 700;
    text-shadow: 0 1px 4px rgba(0,0,0,0.3); /* Enhanced shadow */
  }

  .month-nav {
    background: #231d52;
    color: #fff5e1;
    border: 1px solid #4a4090;
    width: 40px; /* Consistent size */
    height: 40px;
    border-radius: 50%;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2), 0 0 8px rgba(255, 245, 225, 0.1);
    z-index: 2;
    flex-shrink: 0; /* Prevent buttons shrinking */
  }

  .month-nav:hover, .month-nav:focus-visible {
    background: #3a3375;
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), 0 0 12px rgba(255, 245, 225, 0.2);
    outline: none;
  }
  .month-nav:active {
    transform: scale(0.98);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 6px rgba(255, 245, 225, 0.1);
  }

  .arrow {
    display: block;
    line-height: 1;
  }

  .calendar-actions {
    margin-bottom: 1rem;
    width: 100%;
    max-width: 500px;
    display: flex;
    justify-content: center;
    z-index: 2;
    flex-shrink: 0;
  }

  .today-btn {
    background: #231d52;
    color: #fff5e1;
    border: 1px solid #4a4090;
    padding: 0.7rem 1.4rem; /* Slightly more padding */
    border-radius: 2rem;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2), 0 0 15px rgba(255, 245, 225, 0.15);
  }

  .today-btn:hover, .today-btn:focus-visible {
    background: #3a3375;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 245, 225, 0.25);
    outline: none;
  }

  .today-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25), 0 0 12px rgba(255, 245, 225, 0.1);
  }

  .icon {
    font-size: 1.1rem;
  }

  .day-labels {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-weight: 600;
    color: #fff5e1a8; /* Semi-transparent cream */
    padding: 0; /* Remove padding to align days */
    margin-bottom: 0.5rem;
    width: 100%;
    max-width: 500px;
    z-index: 2;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .day-labels div {
    padding: 0.5rem 0;
    font-size: 0.8rem; /* Slightly smaller labels */
    text-transform: uppercase; /* Optional: Uppercase labels */
  }

  .calendar-container {
    width: 100%;
    max-width: 500px; /* Consistent max width */
    position: relative; /* Crucial for absolute positioned grid */
    overflow: hidden; /* Crucial for transitions */
    /* Let height be determined by content or set aspect-ratio/min-height */
    min-height: 26rem; /* Ensure enough space for 6 weeks */
    z-index: 1;
    flex-grow: 1; /* Allow container to fill remaining space */
    display: flex; /* To help center absolute grid? Not strictly needed */
    margin-bottom: 1rem; /* Space at the bottom */
  }

  .calendar {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem; /* Slightly reduced gap */
    padding: 0.5rem; /* Padding around the grid */
    width: 100%;
    box-sizing: border-box;
    position: absolute; /* For transitions */
    top: 0;
    left: 0;
  }

  .day {
    background: #2c2663e0; /* Dark purple, slightly transparent */
    color: #fff5e1;
    border-radius: 0.7rem; /* Slightly softer radius */
    position: relative;
    cursor: pointer;
    /* Subtle inner/outer shadow for depth */
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.25);
    transition: all 0.2s ease-out;
    aspect-ratio: 1/1; /* Maintain square shape */
    padding: 0.4rem;
    display: flex;
    flex-direction: column;
    min-width: 0; /* Prevent flex overflow */
    outline: none;
    border: 1px solid transparent; /* Placeholder for focus/today */
  }

  .day:hover, .day:focus-visible {
    transform: translateY(-3px) scale(1.02); /* Lift and slight scale */
    background: #3a3375f0; /* Lighter purple on hover */
    box-shadow: inset 0 1px 1px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.3), 0 0 12px #fff5e140; /* Enhance shadow + glow */
    border-color: #7b6fce80; /* Subtle border on hover/focus */
    z-index: 3; /* Bring hovered day slightly forward */
  }

  .day.today {
    background: #4f46a8e8; /* Distinct background for today */
    border: 1px solid #fff5e1a0; /* Highlight border */
    box-shadow: inset 0 0 5px rgba(255, 245, 225, 0.15), 0 3px 8px rgba(0,0,0,0.3); /* Inner glow + shadow */
  }
  .day.today:hover, .day.today:focus-visible {
    box-shadow: inset 0 0 8px rgba(255, 245, 225, 0.2), 0 5px 15px rgba(0,0,0,0.35), 0 0 15px #fff5e160; /* Enhanced hover for today */
    border-color: #fff5e1; /* Stronger border on hover */
    background: #5a50bfe8;
  }

  .blank {
    background: transparent;
    box-shadow: none;
    cursor: default;
    border-color: transparent;
  }
  .blank:hover, .blank:focus-visible { /* Prevent hover/focus effects on blank days */
    transform: none;
    box-shadow: none;
    background: transparent;
    border-color: transparent;
    z-index: auto;
  }

  .day-number {
    font-weight: 600;
    display: block;
    font-size: 0.9rem;
    margin-bottom: 0.2rem;
    text-align: center;
    color: #ffffff; /* Bright white number */
    flex-shrink: 0; /* Prevent shrinking */
  }

  .day-content {
    display: flex;
    flex-direction: column; /* Stack indicators vertically */
    gap: 3px;
    align-items: center; /* Center indicators horizontally */
    margin-top: auto; /* Push to bottom */
    padding-bottom: 2px;
    overflow: hidden; /* Hide overflowing indicators */
    flex-grow: 1; /* Allow content to fill space */
    justify-content: flex-end; /* Align items at the bottom */
  }

  .meal-indicator {
    width: 80%; /* Make indicators wider */
    max-width: 30px; /* Max width */
    height: 5px;
    border-radius: 2.5px;
    transition: all 0.2s ease;
    box-shadow: 0 1px 1px rgba(0,0,0,0.3);
    flex-shrink: 0; /* Prevent indicators from shrinking */
  }

  /* Media Queries for Responsiveness */
  @media (max-width: 600px) {
    .calendar-cont { padding: 0.5rem; }
    .calendar-header { margin-bottom: 0.5rem; }
    .calendar-header h2 { font-size: 1.3rem; }
    .month-nav { width: 36px; height: 36px; }
    .today-btn { padding: 0.6rem 1.2rem; font-size: 0.9rem; }
    .day-labels div { font-size: 0.7rem; }
    .calendar-container { min-height: 22rem; }
    .calendar { gap: 0.3rem; padding: 0.3rem; }
    .day { border-radius: 0.6rem; padding: 0.3rem; }
    .day-number { font-size: 0.8rem; }
    .meal-indicator { height: 4px; border-radius: 2px; width: 75%; }
  }

  @media (max-width: 400px) {
    .calendar-header h2 { font-size: 1.2rem; }
    .month-nav { width: 32px; height: 32px; font-size: 0.8rem;}
    .today-btn { padding: 0.5rem 1rem; }
    .day-labels div { padding: 0.3rem 0;}
    .calendar { gap: 0.2rem; padding: 0.2rem; }
    .day { border-radius: 0.4rem; }
    .day-number { font-size: 0.75rem; }
  }

  /* Problem screens, specific styling */
  /* Problem Screen 1: Tall Tablets (e.g., iPad Portrait) */
  @media (min-width: 700px) and (min-height: 1000px) {
    .calendar-cont {
      padding: 2rem; /* More padding around content */
      margin-top: 1rem; /* Can likely reduce margin-top if using padding */
    }
    .calendar-header h2 {
      font-size: 2.2rem; /* Increased font size */
    }
    .month-nav {
      width: 52px; /* Increased size */
      height: 52px;
      border-width: 2px; /* Thicker border */
    }
    .arrow {
      font-size: 1.3rem; /* Larger arrow */
    }
    .today-btn {
      padding: 0.9rem 1.8rem; /* Adjusted padding */
      font-size: 1.1rem; /* Increased font size */
      gap: 0.6rem;
    }
    .today-btn .icon { /* Target icon specifically */
        font-size: 1.3rem; /* Larger icon */
    }
    .day-labels div {
      padding: 0.6rem 0; /* More vertical space */
      font-size: 0.9rem; /* Increased label size */
    }
    .calendar-container {
        min-height: 40rem; /* Ensure enough vertical space */
        max-width: 650px; /* Increase max width slightly */
    }
    .calendar {
      gap: 0.8rem; /* Increase gap between days */
      padding: 0.8rem; /* Increase padding around grid */
    }
    .day {
      border-radius: 1rem; /* Larger radius */
      padding: 0.6rem; /* More padding inside day */
       border-width: 2px; /* Thicker borders for today */
    }
    .day.today {
      border-width: 2px; /* Ensure today border is visible */
      box-shadow: inset 0 0 6px rgba(255, 245, 225, 0.15), 0 4px 10px rgba(0,0,0,0.3); /* Enhance shadow */
    }
    .day-number {
      font-size: 1.2rem; /* Larger day number */
      margin-bottom: 0.4rem;
    }
    .meal-indicator {
      height: 6px; /* Thicker indicators */
      border-radius: 3px;
      width: 75%; /* Adjust width */
    }
  }

  /* Problem Screen 2: Very Large/Tall Tablets */
  @media (min-width: 900px) and (min-height: 1300px) {
    .calendar-cont {
      padding: 3rem; /* Even more padding */
      margin-top: 3rem; /* Adjust margin */
      align-items: center; /* Ensure content centers */
    }
    .calendar-header, .calendar-actions, .day-labels, .calendar-container {
      max-width: 800px; /* Increase overall max-width further */
    }
    .calendar-header h2 {
      font-size: 2rem; /* Larger title */
    }
    .month-nav {
      width: 64px; /* Larger nav buttons */
      height: 64px;
      border-width: 2px;
    }
    .arrow {
      font-size: 1.6rem;
    }
    .today-btn {
      padding: 1rem 2.2rem; /* More padding */
      font-size: 1.4rem; /* Larger text */
      border-radius: 2.5rem;
      gap: 0.8rem;
    }
    .today-btn .icon {
      font-size: 1.6rem; /* Larger icon */
    }
    .day-labels div {
      padding: 0.8rem 0; /* More space */
      font-size: 1.4rem; /* Larger labels */
    }
    .calendar-container {
      min-height: 55rem; /* More height needed for larger days */
      /* Removed fixed width/overflow adjustments for calendar, let grid handle it */
    }
    .calendar {
      gap: 1rem; /* Larger gap */
      padding: 1rem; /* More padding */
       /* Remove fixed width, let container constrain */
       /* width: 900px; */
       /* overflow: visible; */
    }
    .day {
      border-radius: 1.2rem; /* Larger radius */
      padding: 0.8rem; /* More padding */
      /* Removed fixed width/height, rely on aspect-ratio and grid */
      /* width: 5rem; height: 5rem; */
    }
    .day.today {
      border-width: 3px; /* Thicker today border */
      box-shadow: inset 0 0 8px rgba(255, 245, 225, 0.2), 0 5px 15px rgba(0,0,0,0.35);
    }
    .day-number {
      font-size: 1.6rem; /* Larger numbers */
      margin-bottom: 0.6rem;
    }
    .meal-indicator {
      height: 7px;
      border-radius: 3.5px;
      width: 70%;
    }
  }
</style>