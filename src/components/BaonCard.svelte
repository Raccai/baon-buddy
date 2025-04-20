<script>
    import AddedFaves from "../assets/AddedFaves.svelte"
    import NotFaves from "../assets/NotFaves.svelte"
    import { showToast } from "../lib/toast";
    import { markMealAsSeen, getSeenMEals } from "../lib/storage";
    import { createEventDispatcher } from "svelte";
    import { saveFavorite, removeFavorite } from "../lib/storage";
    import { tagStyles } from "../lib/tags";
  import { checkAndUnlockAchievements } from "../lib/achievementStore";

    export let meal;
    $: tagData = meal && meal.type ? tagStyles[meal.type] : null;

    export let triggerBounce = false;
    export let favoriteNames = [];
    
    const dispatch = createEventDispatcher();
    let hasBeenSeen = false;
    let glowClass = "";
    let triggerGlow = false;
    let bounceClass = "";
    let sparkles = [];
    let wiggle = false;
    let longPressTimer;

    // Glow around the card when it is favorited
    $: if (favorite && triggerGlow) {
        glowClass = "glow";
        setTimeout(() => glowClass = "", 800); // remove after glow animation
    }

    // Check if already favorited when component loads
    $: favorite = favoriteNames.includes(meal.name);

    // Check if baon has already been seen before by user
    $: {
        const seenList = getSeenMEals();
        hasBeenSeen = seenList.includes(meal.name);
        if (!hasBeenSeen) {
            markMealAsSeen(meal.name);
        }
    }
    
    // For bounce animation upon every generation
    $: if (triggerBounce) {
        bounceClass = "bounce";
        setTimeout(() => bounceClass = "", 400); // reset after animation
    }

    // For Heart-Button Toggle Sparkle Animations
    function triggerSparkle() {
        const id = crypto.randomUUID?.() || Math.random().toString(36);
        const newSparkle = {
            id,
            x: Math.random() * 20 -10, // random X offset
            y: Math.random() * 20 -10 // random Y offset
        };
        sparkles = [...sparkles, newSparkle];
        setTimeout(() => {
            sparkles = sparkles.filter(s => s.id !== id);
        }, 600); // removes sparkles after animation
    }

    function toggleFavorite() {
        if (favorite) {
            removeFavorite(meal.name);
            showToast("Removed from faves!", "info")
        } else {
            saveFavorite(meal);
            checkAndUnlockAchievements();
            showToast("Added to faves!", "faves")
            triggerSparkle();

            // trigger glow anim
            triggerGlow = false;
            requestAnimationFrame(() => {
                triggerGlow = true;
            })
        }
        dispatch("faveChange")
    }

    // For double tapping to add to faves/unfave
    let lastTapUpTime = 0;
    const doubleTapUpDelay = 300; // ms threshold
    let tapTimeout = null;       // Timeout to distinguish single vs double tap
    function handlePointerDown(event) {
        // Ignore if it's not the primary button (e.g., right-click)
        if (event.pointerType === 'mouse' && event.button !== 0) return;

        // Clear any pending single tap action
        clearTimeout(tapTimeout);
        tapTimeout = null;

        // Start long press timer
        clearTimeout(longPressTimer); // Clear previous just in case
        longPressTimer = setTimeout(() => {
            console.log("Long press triggered");
            longPressTimer = null; // Mark timer as finished
            wiggle = true;
            setTimeout(() => wiggle = false, 500);
        }, 600);
    }
    function handlePointerUp(event) {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapUpTime;

        // --- Key Logic ---
        // 1. If long press timer is still running, clear it (it wasn't a long press)
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;

            // 2. Check if this tap is close enough to the last one
            if (timeSinceLastTap < doubleTapUpDelay) {
                // --- DOUBLE TAP DETECTED ---
                console.log("Manual Double Tap Detected!");
                lastTapUpTime = 0; // Reset last tap time
                clearTimeout(tapTimeout); // Clear any pending single tap
                tapTimeout = null;
                toggleFavorite(); // Perform double-tap action
            } else {
                // --- SINGLE TAP (potentially) ---
                // Don't perform action immediately. Wait briefly to see if another tap follows.
                // We already cleared any previous tapTimeout in pointerdown.
                // If another pointerdown occurs quickly, it will clear this timeout.
                // If not, this timeout will fire, treating it as a single tap (currently does nothing, but could).
                tapTimeout = setTimeout(() => {
                    console.log("Single Tap Action (if any)");
                    // Add single tap action here if needed, otherwise it does nothing
                    tapTimeout = null;
                }, doubleTapUpDelay + 20); // Wait slightly longer than double tap threshold
            }
        }
        // --- End Key Logic ---

        // Only update lastTapUpTime if it wasn't a long press that finished
        if(!longPressTimer && !wiggle) { // Avoid updating if long press completed
        lastTapUpTime = now;
        }

        // Optional: Reset wiggle if pointer comes up early during wiggle animation
        // if (wiggle) setTimeout(() => wiggle = false, 100);
    }

</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    class="baon-card {bounceClass} {glowClass} {wiggle ? "wiggle" : ""}" 
    on:pointerdown = {handlePointerDown}
    on:pointerup = {handlePointerUp}
    on:pointerleave={handlePointerUp}
    on:pointercancel = {handlePointerUp}
>
    {#if !hasBeenSeen}
        <div class="seen-indicator" title="New Meal"></div>
    {/if}

    <div class="top-row">
        {#if meal.image}
            <img src={meal.image} alt={meal.name} class="meal-image" />
        {:else}
            <span class="emoji">{meal.emoji}</span>
        {/if}
    </div>

    <div class="baon-info">
        <h2 class="meal-name">{meal.name}</h2>
        <span class="meal-type" style="background-color: {tagData?.color}">
            {tagData?.label || meal.type}
        </span>
        <p class="meal-message">{meal.message}</p>
        
        <div class="button-container">
            <button 
                class="heart-btn" 
                on:click|stopPropagation={toggleFavorite} 
                aria-label="Toggle Favorite"
            >
                <span class:active={favorite}>
                    {#if favorite}
                        <AddedFaves />
                    {:else}
                        <NotFaves />
                    {/if}
                </span>
                <div class="sparkle-wrapper">
                    {#each sparkles as sparkle (sparkle.id)}
                        <div 
                            class="sparkle"
                            style="transform: translate({sparkle.x}px, {sparkle.y}px"
                        >
                            ✨
                        </div>
                    {/each}
                </div>
            </button>
            
            <button class="recipe-btn" on:click={() => dispatch("viewRecipe", meal)} aria-label="View Recipe">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="24" height="24">
                    <path d="m31.2 4.24a2.24 2.24 0 1 1 -2.2-2.24 2.24 2.24 0 0 1 2.2 2.24zm-8.2 8.32a3 3 0 1 0 -3-3 3 3 0 0 0 3 3zm19.44 31-10-15.36v-8.2a2.14 2.14 0 0 0 2.4-2.24 2 2 0 0 0 -1.84-2.16h-13.8a2 2 0 0 0 -2 2 2.09 2.09 0 0 0 0 .25 2.16 2.16 0 0 0 2.4 2.24v8.31l-10 15.2a4.26 4.26 0 0 0 -.24 4.24 3.91 3.91 0 0 0 3.52 2.16h26.12a3.9 3.9 0 0 0 3.52-2.16 4 4 0 0 0 -.16-4.24zm-18.8-14v-9.16h4.8v9.28l4.72 7.52h-14.28z" fill="#231F47" fill-rule="evenodd"/>
                </svg>
            </button>
        </div>
    </div>
</div>

<style>
    .baon-card {
        display: flex; /* Use flex row */
        justify-content: center;
        align-items: center;
        gap: 1rem; /* Space between image and info columns */
        background: #fff5e1;
        border-radius: 1rem;
        padding: 1rem; /* Adjusted padding */
        /* margin: 1rem 0; Removed vertical margin */
        box-shadow: 0 4px 15px rgba(35, 31, 71, 0.2); /* Softer shadow */
        position: relative;
        width: 100%; /* Fill the grid cell width */
        box-sizing: border-box; /* Include padding in width */
        z-index: 1; /* Base z-index */
        border: 1px solid #eee; /* Subtle border */
    }

    .image-column {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        flex-shrink: 0; /* Prevent shrinking */
        width: 90px; /* Fixed width for image column */
    }

    .meal-image {
        width: 100%; /* Fill the column width */
        height: 90px; /* Fixed height */
        object-fit: contain; /* Show whole image */
        border-radius: 10px; /* Softer radius */
    }
    .emoji {
        font-size: 3.5rem; /* Larger emoji */
        line-height: 1;
    }

    .info-column {
        display: flex;
        flex-direction: column;
        flex-grow: 1; /* Take remaining space */
        justify-content: center; /* Center content vertically */
        align-items: flex-start; /* Align text left */
        min-width: 0; /* Prevent overflow */
        gap: 0.3rem; /* Space between info elements */
    }

    .meal-name {
        margin: 0; /* Reset margin */
        font-size: 1.25rem; /* Good default size */
        font-weight: 700; /* Bolder */
        color: #231F47;
        line-height: 1.3;
    }

    .meal-type {
        font-size: 0.8rem;
        padding: 0.2rem 0.7rem;
        text-transform: capitalize;
        border-radius: 1rem; /* Pill shape */
        font-weight: 500;
        line-height: 1.2;
        display: inline-block; /* Respect padding */
        margin-bottom: 0.2rem; /* Space below tag */
    }

    .meal-message {
        font-style: italic;
        margin: 0.2rem 0 0.5rem 0; /* Adjusted margin */
        color: #4d467c; /* Slightly lighter message color */
        font-size: 0.9rem;
        line-height: 1.4;
    }

    .button-container {
        display: flex;
        justify-content: flex-start; /* Align buttons left */
        gap: 0.5rem; /* Smaller gap */
        margin-top: auto; /* Push buttons to bottom if needed */
        padding-top: 0.3rem; /* Space above buttons */
    }

    /* Heart Button & Recipe Button Base Styles */
    .heart-btn, .recipe-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 6px; /* Increase touch area */
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;
        position: relative; /* For sparkle wrapper */
    }
    .heart-btn:hover, .recipe-btn:hover {
        background-color: rgba(35, 31, 71, 0.08); /* Subtle hover */
        transform: scale(1.1);
    }
    
    /* Heart Button Specifics */
    .heart-btn span { display: inline-block; transition: transform 0.2s ease-in-out; }
    .heart-btn span.active { animation: pop 0.3s ease; }
    .heart-btn :global(svg) { /* Style SVGs inside button */
        width: 24px;
        height: 24px;
        display: block;
    }

    /* Recipe Button */
    .recipe-btn { 
        color: #231F47; 
    } 
    .recipe-btn svg { 
        width: 22px; height: 22px; display: block; 
    }

    @keyframes pop {
        0% { transform: scale(1); }
        40% { transform: scale(1.4); }
        60% { transform: scale(0.9); }
        100% { transform: scale(1); }
    }

    /* Meal Content/Information */
    .baon-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        justify-content: center;
        align-items: center;
    }

    .meal-name {
        margin: 0.5rem 0 0.25rem;
        font-size: 1.4rem;
        color: #231F47;
    }

    .meal-type {
        font-size: 0.9rem;
        padding: 8px 16px;
        text-transform: capitalize;
        border-radius: 14px;
        width: fit-content;
        transition: background-color 0.3s ease, color 0.3s ease;
    }

    .meal-message {
        font-style: italic;
        margin-top: 0.5rem;
        color: #231F47;
    }

    /* Bounce animation */
    .bounce {
        animation: bounceCard 0.4s ease;
    }

    @keyframes bounceCard {
        0%   { transform: scale(1); }
        30%  { transform: scale(1.02); }
        60%  { transform: scale(0.99); }
        100% { transform: scale(1); }
    }

    /* Heart Sparkle Animations */
    .sparkle-wrapper { /* Position relative to heart button */
        position: absolute;
        bottom: 80%; /* Position above the button */
        left: 50%;
        transform: translateX(-50%);
        pointer-events: none;
        z-index: 10;
        width: 40px; /* Give wrapper some size */
        height: 40px;
    }

    .sparkle {
        position: absolute;
        animation: sparkle-pop 0.6s ease forwards;
        opacity: 0.8;
        font-size: 1.4rem;
    }

    @keyframes sparkle-pop {
        0% { opacity: 0; transform: scale(0); }
        40% { opacity: 1; transform: scale(1.2); }
        100% { opacity: 0; transform: scale(0.5) translate(-10px); }
    }

    /*  New Meal Indicator */
    .seen-indicator {
        width: 10px;
        height: 10px;
        background: radial-gradient(circle at center, rgb(174, 133, 226), #6a0dad);
        border-radius: 50%;
        position: absolute;
        top: 8px;
        left: 8px;
        box-shadow: 0 0 6px #b388eb;
        animation: pulse 1.5s infinite ease-in-out;
    }

    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
            opacity: 0.8;
        }
        50% {
            transform: scale(1.4);
            opacity: 1;
        }
    }

    /* Glow Animation for Favorited cards */
    .glow {
        box-shadow: 0 0 20px 20px rgba(255, 215, 0, 0.4);
        animation: glowFade 0.8s ease forwards;
    }

    @keyframes glowFade {
        0%   { box-shadow: 0 0 0px 0 rgba(255, 215, 0, 0); }
        30%  { box-shadow: 0 0 12px 6px rgba(255, 215, 0, 0.6); }
        100% { box-shadow: 0 0 0px 0 rgba(255, 215, 0, 0); }
    }

    /* Wiggle Animation */
    .wiggle {
        animation: wiggleAnim 0.4s ease-in-out;
    }

    @keyframes wiggleAnim {
        0% { transform: rotate(0); }
        25% { transform: rotate(1.5deg); }
        50% { transform: rotate(-1.5deg); }
        75% { transform: rotate(1.2deg); }
        100% { transform: rotate(0); }
    }

    /* Standard responsive media queries */
    @media (max-width: 360px) { /* Adjust for very small phones */
        .baon-card {
            padding: 0.8rem;
            gap: 0.7rem;
        }
        .image-column { width: 75px; }
        .meal-image { height: 75px; }
        .emoji { font-size: 3rem; }
        .meal-name { font-size: 1.1rem; }
        .meal-message { font-size: 0.85rem; }
        .button-container { gap: 0.3rem; }
        .heart-btn :global(svg), .recipe-btn svg { width: 20px; height: 20px; }
    }

    /* Problem screens, specific styling */
    @media (min-width: 700px) and (min-height: 1000px) {
        .baon-card {
            padding: 0.8rem;
            gap: 0.7rem;
        }
        .image-column { width: 75px; }
        .meal-image { height: 100px; }
        .emoji { font-size: 3rem; }
        .meal-name { font-size: 2rem; }
        .meal-message { font-size: 1.2rem; }
        .meal-type { font-size: 1.2rem; }
        .button-container { gap: 0.3rem; }
        .heart-btn :global(svg), .recipe-btn svg { width: 40px; height: 40px; }
    }

    @media (min-width: 900px) and (min-height: 1300px) {
        .baon-card {
            width: 80vw;
            padding: 0.8rem;
            gap: 0.7rem;
        }
        .image-column { width: 75px; }
        .meal-image { height: 140px; }
        .emoji { font-size: 3rem; }
        .meal-name { font-size: 3rem; }
        .meal-message { font-size: 2rem; }
        .meal-type { font-size: 2rem; }
        .button-container { gap: 0.3rem; }
        .heart-btn :global(svg), .recipe-btn svg { width: 60px; height: 60px; }
    }
</style>