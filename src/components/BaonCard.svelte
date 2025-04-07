<script>
    export let meal;

    import { isFavorite, saveFavorite, removeFavorite } from "../lib/storage";

    let favorite = false;

    // Check if already favorited when component loads
    $: favorite = isFavorite(meal.name);

    function toggleFavorite() {
        if (favorite) {
            removeFavorite(meal.name);
        } else {
            saveFavorite(meal.name);
        }
        favorite != favorite;
    }
</script>

<div class="baon-card">
    <div class="top-row">
        <span class="emoji">{meal.emoji}</span>
        <button class="heart-btn" on:click={toggleFavorite}>
            {#if favorite}
                ❤️
            {:else}
                🤍
            {/if}
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

    .heart-btn {
        background: none;
        border: none;
        font-size: 1.8rem;
        cursor: pointer;
    }

    .meal-name {
        margin: 0.5rem 0 0.25rem;
        font-size: 1.4rem;
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