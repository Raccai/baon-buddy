<script>
    import AddedFaves from "../assets/AddedFaves.svelte";
    import NotFaves from "../assets/NotFaves.svelte";
    import EditIcon from "../assets/EditIcon.svelte";
    import DeleteIcon from "../assets/DeleteIcon.svelte";
    import { showToast } from "../lib/toast.js";
    // Corrected import name
    import { markMealAsSeen, getSeenMeals, saveFavorite, removeFavorite } from "../lib/storage.js"; // Ensure getSeenMeals is correct
    import { createEventDispatcher } from "svelte";
    import { tagStyles } from "../lib/tags.js";
    import { checkAndUnlockAchievements } from "../lib/achievementStore.js";
    import { getTagStyle } from "../lib/tags.js";
    // --- Capacitor Imports ---
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

    
    $: tagData = meal && meal.type ? tagStyles[meal.type] : null; // Get tag data based on meal type
    $: favorite = meal?.id ? favoriteNames.includes(meal.name) : false; // Determine if this card is currently favorited
    $: imageSrc = getDisplayImageSrc(meal?.image);
    $: primaryTypeData = meal && meal.type ? getTagStyle(meal.type) : getTagStyle('unknown');
    $: displayTags = meal && Array.isArray(meal.tags) ? meal.tags.slice(0, 3) : []; 

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
    async function toggleFavorite() { // Make it ASYNC
        if (!meal || !meal.id) return;

        try {
            if (favorite) { // Currently favorite, so remove
                await removeFavorite(meal.id); // Assuming removeFavorite takes ID
            } else { // Not favorite, so add
                await saveFavorite(meal); // saveFavorite takes the full meal object
                // checkAndUnlockAchievements(); // This is now called in App.svelte after refresh
                triggerSparkle();
                triggerGlow = false; requestAnimationFrame(() => { triggerGlow = true; });
            }
            dispatch("faveChange"); // Signal parent (Home/BaonList -> App) to refresh global state
        } catch (error) {
            console.error("Error toggling favorite:", error);
            showToast("Could not update favorite status.", "error");
        } 
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

    function dispatchEditBaon() {
        if (meal) { 
            console.log('[BaonCard] Dispatching editBaon for:', meal.name, 'isUserDefined:', meal.isUserDefined);
            dispatch("editBaon", meal);
        }
    }

    function dispatchDeleteBaon() {
        if (meal && meal.id) {
            dispatch("deleteBaon", meal.id);
        }
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
        <span class="meal-type" style="background-color: {primaryTypeData?.color}; color: {primaryTypeData?.textColor}">
            {primaryTypeData?.label || meal.type}
        </span>
        
        {#if displayTags.length > 0}
            <div class="hashtag-tags-container">
                {#each displayTags as tag (tag)}
                <span class="hashtag-chip">{tag}</span>
                {/each}
            </div>
        {/if}

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

            <button
                class="edit-btn"
                on:click|stopPropagation={dispatchEditBaon}
                aria-label="Edit {meal.name}"
                title="Edit this Baon"
                disabled={!meal}
            >
                <EditIcon />
            </button>

            <button
                class="delete-btn"
                on:click|stopPropagation={dispatchDeleteBaon}
                aria-label="Delete {meal.name}"
                title="Delete this Baon"
                disabled={!meal}
            >
                <DeleteIcon />
            </button>
        </div>
    </div>
</div>

<style>
    .baon-card {
        display: flex;
        align-items: stretch; /* Make columns equal height */
        gap: 1rem;
        background: #fffdf7; /* Slightly creamier than pure white */
        border-radius: 16px; /* More rounded */
        padding: 1rem;
        box-shadow: 0 6px 18px rgba(35, 31, 71, 0.15); /* Softer, more spread shadow */
        position: relative;
        width: 100%; /* Fill grid cell in BaonList */
        /* max-width: 380px; /* Max width for Home screen instance */
        box-sizing: border-box;
        z-index: 1;
        border: 1px solid #f0eadd; /* Softer border */
        min-height: 170px; /* Adjust for consistent height */
        transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
        -webkit-tap-highlight-color: transparent; /* Remove tap highlight */
    }
    .baon-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 22px rgba(35, 31, 71, 0.2);
    }

    .image-column {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
        width: 100px; /* Base size */
        height: auto; /* Let content define height, or set fixed if all cards are same height */
        align-self: center; /* Center image vertically if card stretches */
        background-color: #f0eadd; /* Light placeholder bg */
        border-radius: 12px;
        overflow: hidden;
    }
    .meal-image {
        display: block;
        width: 100%;
        height: 100%;
        max-height: 130px; /* Max image height */
        object-fit: cover; /* Changed to cover for better fill */
        border-radius: 10px; /* Inherit or slightly smaller */
    }
    .emoji {
        font-size: 4rem; /* Slightly larger */
        line-height: 1;
        padding: 0.5rem; /* Add some padding for standalone emoji */
    }

    .baon-info {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        min-width: 0; /* ← Crucial for allowing inner text to wrap instead of forcing the card wider */
    }

    .text-content {
        width: 100%; /* Take full width for text elements */
    }
    .meal-name,
    .meal-message {
        white-space: normal;       
        overflow-wrap: break-word; 
        word-break: normal;
        hyphens: auto; 
    }

    .meal-name {
        margin: 0 0 0.3rem 0;
        font-size: 1.3rem; /* Base size */
        font-weight: 700;
        color: #231F47;
        line-height: 1.25; /* Tighter line height */
        width: 100%;
        white-space: normal; word-wrap: break-word; overflow-wrap: break-word;
        /* Optional: Limit to 2 lines with ellipsis */
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        overflow-wrap: break-word;
        word-wrap: break-word;
        min-height: calc(1.3rem * 1.25 * 1); /* Approx 1 line, adjust factor if 2 lines min */
    }

    .meal-type {
        font-size: 0.75rem;
        padding: 0.25rem 0.8rem; /* Slightly more padding */
        border-radius: 1rem;
        font-weight: 600; /* Bolder type */
        line-height: 1.2;
        display: inline-block;
        margin-bottom: 0.5rem; /* More space below tag */
        /* background-color and color are set by inline style */
    }

    .hashtag-tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem; /* Gap between tag chips */
        margin-bottom: 0.5rem; /* Space below the tags */
    }
    .hashtag-chip {
        background-color: #4a4090; /* Default tag color - same for all custom tags */
        color: #fff5e1;
        padding: 0.15rem 0.5rem;
        border-radius: 0.3rem;
        font-size: 0.7rem;
        font-weight: 500;
        line-height: 1.2;
    }

    .meal-message {
        font-style: normal; /* Less italic, more direct */
        margin: 0 0 0.6rem 0; /* Control spacing */
        color: #5c5588; /* Softer, darker message color */
        font-size: 0.85rem;
        line-height: 1.4;
        width: 100%;
        white-space: normal; word-wrap: break-word; overflow-wrap: break-word;
        /* Optional: Limit to 2-3 lines */
        display: -webkit-box;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        min-height: calc(0.85rem * 1.4 * 1); /* Approx 1 line, adjust factor */
    }

    .button-container {
        display: flex;
        justify-content: center; /* Align to start */
        gap: 0.6rem; /* Slightly more gap */
        width: 100%; /* Take full width of info column */
        margin-top: auto; /* Pushes to bottom if .text-content doesn't fill */
        padding-top: 0.4rem; /* Space above buttons */
    }

    .action-btn { /* Common class for all buttons in container */
        background: none; border: none; cursor: pointer;
        padding: 8px; /* Consistent padding for better touch target */
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.2s ease, background-color 0.2s ease, opacity 0.2s ease;
        color: #4a4090; /* Default dim icon color */
        line-height: 0; /* Remove extra space from icon wrapper */
    }
    .action-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        transform: none;
        background-color: transparent;
    }

    /* Button Base Styles */
    .heart-btn, .recipe-btn, .edit-btn, .delete-btn {
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
        width: 28px;
        height: 28px;
        display: block;
    }

    /* Recipe Button */
    .recipe-btn { 
        color: #231F47; 
    } 
    .recipe-btn svg { 
        width: 28px; height: 28px; display: block; 
    }

    /* Edit Button */
    .edit-btn, .delete-btn {
        transform: scale(0.4);
        margin-left: -0.8rem;
    }
    .edit-btn:hover, .delete-btn:hover {
        background-color: rgba(35, 31, 71, 0.08); /* Subtle hover */
        transform: scale(0.58);
    }

    .delete-btn {
        margin-left: -1.6rem;
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

     @media (min-width: 768px) { /* For tablets, increase sizes */
        .baon-card { padding: 1.5rem; gap: 1.5rem; min-height: 200px; border-radius: 20px; }
        .image-column { width: 120px; height: 120px; }
        .emoji { font-size: 4.5rem; }
        .meal-name { font-size: 1.6rem; -webkit-line-clamp: 2; line-clamp: 2; min-height: calc(1.6rem * 1.25 * 1); }
        .meal-type { font-size: 0.9rem; padding: 0.3rem 0.9rem; }
        .meal-message { font-size: 1rem; -webkit-line-clamp: 3; line-clamp: 3; min-height: calc(1rem * 1.4 * 1);}
        .button-container { gap: 0.8rem; }
        .action-btn { padding: 10px; }
        .heart-btn :global(svg), .recipe-btn svg { width: 30px; height: 30px; }
        .edit-btn :global(svg) { width: 26px; height: 26px; }
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