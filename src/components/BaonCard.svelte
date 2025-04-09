<script>
    import AddedFaves from "../assets/AddedFaves.svelte"
    import NotFaves from "../assets/NotFaves.svelte"
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
    </div>

    <div class="baon-info">
        <h2 class="meal-name">{meal.name}</h2>
        <span class="meal-type">{meal.type}</span>
        <p class="meal-message">{meal.message}</p>
        <button class="heart-btn" on:click={toggleFavorite} aria-label="Toggle Favorite">
            <span class:active={favorite}>
                {#if favorite}
                    <AddedFaves />
                {:else}
                    <NotFaves />
                {/if}
            </span>
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
        background-color: #231F47;
        color: #fff;
        padding: 8px 16px;
        text-transform: capitalize;
        border-radius: 14px;
        width: fit-content;
    }

    .meal-message {
        font-style: italic;
        margin-top: 0.5rem;
        color: #231F47;
    }
</style>