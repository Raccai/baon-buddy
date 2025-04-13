<script>
    import AddedFaves from "../assets/AddedFaves.svelte"
    import NotFaves from "../assets/NotFaves.svelte"
    import { showToast } from "../lib/toast";
    import { markMealAsSeen, getSeenMEals } from "../lib/storage";
    import { createEventDispatcher } from "svelte";
    import { isFavorite, saveFavorite, removeFavorite } from "../lib/storage";
    
    export let triggerBounce = false;
    export let meal;
    export let favoriteNames = [];
    
    const dispatch = createEventDispatcher();
    let hasBeenSeen = false;
    let glowClass = "";
    let triggerGlow = false;
    let bounceClass = "";
    let sparkles = [];
    let wiggle = false;
    let longPressTimer;

    // Handles user long press
    function handlePointerDown() {
        longPressTimer = setTimeout(() => {
            wiggle = true;
            setTimeout(() => wiggle = false, 500); // resets animation
        }, 600); // Long press duration
    }
    function handlePointerUp() {
        clearTimeout(longPressTimer);
    }

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

    // Determines badge type/class
    function getBadgeClass(type) {
        switch (type.toLowerCase()) {
            case 'classic':
                return 'badge-classic';
            case 'budget':
                return 'badge-budget';
            case 'quick':
                return 'badge-quick';
            case 'healthy':
                return 'badge-healthy';
            case 'instant':
                return 'badge-instant';
            default:
                return 'badge-default';
        }
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    class="baon-card {bounceClass} {glowClass} {wiggle ? "wiggle" : ""}" 
    on:dblclick = {toggleFavorite}
    on:pointerdown = {handlePointerDown}
    on:pointerup = {handlePointerUp}
    on:pointercancel = {handlePointerUp}
    on:touchend = {handlePointerUp}
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
        <span class="meal-type {getBadgeClass(meal.type)}">{meal.type}</span>
        <p class="meal-message">{meal.message}</p>
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
    </div>
</div>

<style>
    .baon-card {
        display: flex;
        flex-direction: row;
        background: #fff5e1;
        border-radius: 1rem;
        padding: 1.5rem;
        margin: 1rem 0;
        box-shadow: 0 2px 20px #151032;
        position: relative;
        width: 320px;
        z-index: 5;
    }

    .top-row {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .meal-image {
        width: 120px;
        height: 120px;
        object-fit: contain;
        border-radius: 12px;
    }

    /* Heart Button */
    .heart-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        padding-bottom: 1px;
    }

    .heart-btn span {
        display: inline-block;
        transition: transform 0.2s ease-in-out;
    }

    .heart-btn span.active {
        animation: pop 0.3s ease;
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

    /* Base styles for each type */
    .badge-classic {
        background-color: #231F47;
        color: white;
    }

    .badge-budget {
        background-color: #ff4d4f;
        color: white;
    }

    .badge-quick {
        background-color: #ffafcc;
        color: #231F47;
    }

    .badge-healthy {
        background-color: #ffe066;
        color: #231F47;
    }

    .badge-instant {
        background-color: #845ec2;
        color: white;
    }

    .badge-default {
        background-color: #999;
        color: white;
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
    .sparkle-wrapper {
        position: absolute;
        top: 74%;
        right: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 10;
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
    @media (max-width: 410px) {
        .baon-card {
            width: 80vw;
            padding: 1.2rem;
        }

        .meal-name {
            font-size: 1.2rem;
            text-align: center;
        }

        .meal-message {
            font-size: 0.9rem;
            text-align: center;
        }

        .meal-type {
            font-size: 0.85rem;
            padding: 6px 12px;
        }

        .meal-image {
            width: 90px;
            height: 90px;
        }

        .emoji {
            font-size: 2.2rem;
        }
    }

    /* For short but wide screens */
    @media (max-height: 600px) and (min-width: 700px) {
        .baon-card {
            width: 360px; /* Slightly larger for wide screens */
            padding: 1.2rem;
        }
        
        .meal-image {
            width: 100px;
            height: 100px;
        }
    }

    /* For very short screens */
    @media (max-height: 500px) {
        .baon-card {
            padding: 1rem;
        }
        
        .meal-name {
            font-size: 1.1rem;
            margin: 0.3rem 0 0.2rem;
        }
        
        .meal-message {
            font-size: 0.85rem;
            margin-top: 0.3rem;
        }
        
        .meal-type {
            font-size: 0.8rem;
            padding: 5px 10px;
        }
        
        .meal-image {
            width: 80px;
            height: 80px;
        }
        
        .emoji {
            font-size: 2rem;
        }
    }

    /* For extremely small screens */
    @media (max-height: 400px) and (max-width: 320px) {
        .baon-card {
            width: 85vw;
            padding: 0.8rem;
        }
        
        .meal-image {
            width: 60px;
            height: 60px;
        }
        
        .meal-name {
            font-size: 1rem;
        }
        
        .meal-message {
            font-size: 0.8rem;
        }
        
        .emoji {
            font-size: 1.8rem;
        }
    }

    /* For wide but short screens - addresses the specific issue mentioned */
    @media (max-height: 1400px) and (min-width: 800px) {
        .baon-card {
            width: 85vw;
            display: flex;
            justify-content: center;
            gap: 1.2rem;
        }

        .meal-image {
            width: 160px;
            height: 160px;
        }
        
        .meal-name {
            font-size: 3rem;
        }
        
        .meal-message {
            font-size: 2rem;
        }
        
        .emoji {
            font-size: 3rem;
        }

        .meal-type {
            font-size: 1.4rem;
        }
    }

    @media (max-height: 800px) and (min-width: 1280px) {
        .baon-card {
            width: 85vw;
            display: flex;
            justify-content: center;
            gap: 1.2rem;
        }

        .meal-image {
            width: 160px;
            height: 160px;
        }
        
        .meal-name {
            font-size: 1.8rem;
        }
        
        .meal-message {
            font-size: 1.2rem;
        }
        
        .emoji {
            font-size: 2rem;
        }

        .meal-type {
            font-size: 1rem;
        }
    }
</style>