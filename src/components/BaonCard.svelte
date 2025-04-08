<script>
    export let meal;
    export let favoriteNames = [];

    import { createEventDispatcher } from "svelte";
    import { isFavorite, saveFavorite, removeFavorite } from "../lib/storage";

    const dispatch = createEventDispatcher();

    // Check if already favorited when component loads
    $: favorite = favoriteNames.includes(meal.name);

    function toggleFavorite() {
        if (favorite) {
            removeFavorite(meal.name);
        } else {
            saveFavorite(meal);
        }
        dispatch("faveChange")
    }
</script>

<div class="baon-card">
    <div class="top-row">
        <span class="emoji">{meal.emoji}</span>
        <button class="heart-btn" on:click={toggleFavorite} aria-label="Toggle Favorite">
            <span class:active={favorite}>
                {#if favorite}
                    ❤️
                {:else}
                    🤍
                {/if}
            </span>
        </button>
    </div>

    <h2 class="meal-name">{meal.name}</h2>
    <span class="meal-type">{meal.type}</span>
    <p class="meal-message">{meal.message}</p>
</div>

<style>
    .baon-card {
        background: #fff;
        border-radius: 1rem;
        padding: 1.5rem;
        margin: 1rem 0;
        margin-top: 12rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        position: relative;
    }

    .top-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .emoji {
        font-size: 2.5rem;
    }

    /* Heart Button */
    .heart-btn {
        background: none;
        border: none;
        font-size: 1.8rem;
        cursor: pointer;
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
    .meal-name {
        margin: 0.5rem 0 0.25rem;
        font-size: 1.4rem;
        color: #000;
    }

    .meal-type {
        font-size: 0.9rem;
        color: #777;
        text-transform: capitalize;
    }

    .meal-message {
        font-style: italic;
        margin-top: 0.5rem;
        color: #444;
    }
</style>