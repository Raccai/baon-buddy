<script>
    import { getFavorites, saveFavorite, removeFavorite } from "../lib/storage";
    import { createEventDispatcher } from "svelte";
    import { fly, fade } from "svelte/transition";

    const dispatch = createEventDispatcher();

    export let visible = false;
    let favorites = [];

    // Public method for parent to call
    export function open() {
        favorites = getFavorites();
        visible = true;
    }

    export function close() {
        visible = false;
        dispatch("close");
    }

    function remove(mealName) {
        removeFavorite(mealName);
        favorites = getFavorites();
        dispatch("faveChange"); // This tells App.svelte to refresh the global favoriteNames
    }
</script>

{#if visible}
    <div 
        class="modal-backdrop" 
        in:fade = {{ duration: 200 }}
        out:fade = {{ duration: 200 }}
        role = "button"
        tabindex="0"
        on:click={close}
        on:keydown={(e) => (e.key === "Enter" || e.key === " ") && close()}
    ></div>
    <div class="modal-panel" 
        in:fly={{ x: 400, duration: 300 }}
        out:fly={{ x: 400, duration: 300}}
    >
        <h2>⭐ Favorites</h2>
        {#if favorites.length === 0}
            <p>No saved baon yet 😢</p>
        {:else}
            <ul>
                {#each favorites as meal}
                    <li>
                        <span>{meal.emoji} {meal.name}</span>
                        <button on:click={() => remove(meal.name)}>Remove</button>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 10;
    }

    .modal-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 80%;
        max-width: 350px;
        height: 100vh;
        background: #191337;
        padding: 1.5rem;
        box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
        z-index: 11;
    }

    h2 {
        margin-top: 0;
    }

    ul {
        list-style: none;
        padding: 0;
    }

    li {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
    }

    button {
        background: none;
        border: none;
        color: #FFF5E1;
        background-color: rgb(196, 12, 12);
        cursor: pointer;
        transition: all 300ms ease;
    }

    button:hover {
        background-color: rgb(240, 45, 45);
    }
</style>