<script>
    import AddedFaves from "../assets/AddedFaves.svelte";
    import NotFaves from "../assets/NotFaves.svelte";
    import { showToast } from "../lib/toast.js";
    // Corrected import name
    import { markMealAsSeen, getSeenMeals, saveFavorite, removeFavorite } from "../lib/storage.js"; // Ensure getSeenMeals is correct
    import { createEventDispatcher } from "svelte";
    import { tagStyles } from "../lib/tags.js";
    import { checkAndUnlockAchievements } from "../lib/achievementStore.js";
    // --- Capacitor Imports ---
    import { Capacitor } from '@capacitor/core';
    import { getDisplayImageSrc } from "../lib/imageUtils";

    // --- Props ---
    export let meal; // The meal object { name, image, type, message, emoji?, recipe?, id?, isUserDefined? }
    export let triggerBounce = false; // For animation on generation
    export let favoriteNames = []; // Array of names of favorited meals

    // --- Internal State ---
    const dispatch = createEventDispatcher();
    let hasBeenSeen = true; // Default to true to avoid flashing 'new' indicator briefly
    let glowClass = "";
    let triggerGlow = false;
    let bounceClass = "";
    let sparkles = [];
    let wiggle = false;
    let longPressTimer = null;
    let lastTapUpTime = 0;
    const doubleTapUpDelay = 300; // ms
    let tapTimeout = null;
    let imageSrc = null; // Holds the final displayable image source URL

    // --- Reactive Computations ---

    // Get tag data based on meal type
    $: tagData = meal && meal.type ? tagStyles[meal.type] : null;

    // Determine if this card is currently favorited
    $: favorite = meal?.name ? favoriteNames.includes(meal.name) : false;

    $: imageSrc = getDisplayImageSrc(meal?.image);

    // Trigger bounce animation
    $: if (triggerBounce) {
        bounceClass = "bounce";
        setTimeout(() => bounceClass = "", 400);
    }

    // Trigger glow animation
    $: if (favorite && triggerGlow) {
        glowClass = "glow";
        setTimeout(() => glowClass = "", 800);
    }

    // --- Functions ---

    // Sparkle effect for favoriting
    function triggerSparkle() {
        const id = crypto.randomUUID?.() || Math.random().toString(36);
        const newSparkle = { id, x: Math.random() * 20 -10, y: Math.random() * 20 -10 };
        sparkles = [...sparkles, newSparkle];
        setTimeout(() => {
            sparkles = sparkles.filter(s => s.id !== id);
        }, 600);
    }

    // Toggle favorite status
    function toggleFavorite() {
        if (!meal || !meal.name) return; // Need a meal to toggle
        if (favorite) {
            removeFavorite(meal.name);
            showToast("Removed from faves!", "info")
        } else {
            saveFavorite(meal); // Save the whole meal object (as currently implemented)
            checkAndUnlockAchievements();
            showToast("Added to faves!", "faves")
            triggerSparkle();
            // Trigger glow animation reactively
            triggerGlow = false; // Reset flag
            requestAnimationFrame(() => { triggerGlow = true; }); // Set flag in next frame
        }
        // Notify parent that favorites might have changed
        dispatch("faveChange");
    }

    // --- Pointer Events for Double Tap & Long Press ---
    function handlePointerDown(event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        clearTimeout(tapTimeout);
        tapTimeout = null;
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => {
            longPressTimer = null;
            wiggle = true;
            setTimeout(() => wiggle = false, 500);
        }, 600);
    }

    function handlePointerUp() { // Combined handler for up/leave/cancel
        const now = Date.now();
        const timeSinceLastTap = now - lastTapUpTime;

        if (longPressTimer) { // Didn't long press long enough
            clearTimeout(longPressTimer);
            longPressTimer = null;
            if (timeSinceLastTap < doubleTapUpDelay) { // Double tap
                console.log("Manual Double Tap Detected!");
                lastTapUpTime = 0;
                clearTimeout(tapTimeout);
                tapTimeout = null;
                toggleFavorite(); // Perform action
            } else { // Potential single tap
                tapTimeout = setTimeout(() => { tapTimeout = null; }, doubleTapUpDelay + 50); // Wait slightly longer
            }
        }
        // Only update lastTapUpTime if it wasn't a long press and not wiggling
        if(!longPressTimer && !wiggle) {
             lastTapUpTime = now;
        }
        // Reset wiggle if pointer comes up early? Usually handled by animation end.
    }

    // Dispatch event to view recipe
    function dispatchViewRecipe() {
        if (meal) dispatch("viewRecipe", meal);
    }

</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="baon-card {bounceClass} {glowClass} {wiggle ? 'wiggle' : ''}"
    on:pointerdown={handlePointerDown}
    on:pointerup={handlePointerUp}
    on:pointerleave={handlePointerUp}
    on:pointercancel={handlePointerUp}
    on:touchend={handlePointerUp}
    role="article"
    aria-labelledby="meal-name-{meal?.id || meal?.name}"
>
    {#if !hasBeenSeen && meal}
        <div class="seen-indicator" title="New Meal"></div>
    {/if}

    <div class="image-column">
        {#if imageSrc}
            <img src={imageSrc} alt="{meal?.name || 'Baon'}" class="meal-image" loading="lazy"/>
        {:else if meal?.emoji}
            <span class="emoji" aria-hidden="true">{meal.emoji}</span>
        {:else}
            <span class="emoji" aria-hidden="true">🍽️</span> <!-- Default placeholder -->
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
        justify-content: center;
        align-items: center;
        overflow: hidden;
        flex-shrink: 0; /* Prevent shrinking */
        width: 100px; /* Fixed width for image column */
        height: 100px;
    }
    
    .meal-image {
        border-radius: 10px; /* Softer radius */
        width: 100%; /* Fill the column width */
        height: 100%; /* Fill the column height */
        object-fit: cover; /* Show whole image */
    }
    .emoji {
        font-size: 3.5rem; /* Larger emoji */
        line-height: 1;
    }

    /* Meal Content/Information */
    .baon-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        justify-content: center;
        align-items: center;
        flex-grow: 1;
        min-width: 0; /* <<< CRUCIAL FOR WRAPPING IN FLEX */
        gap: 0.3rem;
        overflow: hidden;
    }
    .meal-type {
        font-size: 0.9rem;
        padding: 8px 16px;
        text-transform: capitalize;
        border-radius: 14px;
        width: fit-content;
        transition: background-color 0.3s ease, color 0.3s ease;
    }
    .meal-name {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #231F47;
        line-height: 1.3;
        width: 100%; /* Use available width */
        /* Text wrapping properties */
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-all;
        transition: font-size 0.3s ease-out;
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
        font-style: italic; margin: 0.2rem 0 0.5rem 0;
        color: #4d467c; font-size: 0.9rem; line-height: 1.4;
        width: 100%;
        /* Text wrapping properties */
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        transition: font-size 0.3s ease-out;
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