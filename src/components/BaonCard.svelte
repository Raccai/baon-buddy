<script>
    import AddedFaves from "../assets/AddedFaves.svelte"
    import NotFaves from "../assets/NotFaves.svelte"
    import { showToast } from "../lib/toast";

    export let meal;
    export let favoriteNames = [];
    
    import { createEventDispatcher } from "svelte";
    import { isFavorite, saveFavorite, removeFavorite } from "../lib/storage";

    const dispatch = createEventDispatcher();

    // Check if already favorited when component loads
    $: favorite = favoriteNames.includes(meal.name);
    
    // For bounce animation upon every generation
    export let triggerBounce = false;
    let bounceClass = "";
    $: if (triggerBounce) {
        bounceClass = "bounce";
        setTimeout(() => bounceClass = "", 400); // reset after animation
    }

    // For Heart-Button Toggle Sparkle Animations
    let sparkles = [];
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
<div class="baon-card {bounceClass}" on:dblclick={toggleFavorite}>
    <div class="top-row">
        <span class="emoji">{meal.emoji}</span>
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
        background: #fff5e1;
        border-radius: 1rem;
        padding: 1.5rem;
        margin: 1rem 0;
        margin-top: 18rem;
        box-shadow: 0 2px 20px #151032;
        position: relative;
        width: 320px;
        z-index: 5;
    }

    .top-row {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .emoji {
        font-size: 2.5rem;
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

    @media (max-width: 420px) {
        .baon-card {
            width: 70vw;
            padding: 1rem;
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
            font-size: 0.8rem;
            padding: 6px 12px;
        }

        .emoji {
            font-size: 2rem;
        }
    }
</style>