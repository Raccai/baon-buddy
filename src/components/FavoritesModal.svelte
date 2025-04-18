<script>
    import { getFavorites, saveFavorite, removeFavorite } from "../lib/storage";
    import { createEventDispatcher } from "svelte";
    import { fly, fade } from "svelte/transition";
    import BaonBuddyFavorites from "/titles/BaonBuddyFavorites.png";

    const dispatch = createEventDispatcher();

    export let visible = false;
    let favorites = [];

    // To get selected meal
    function selectMeal(meal) {
        dispatch("selectMeal", meal);
        close();
    }

    // Public method for parent to call to open modal
    export function open() {
        favorites = getFavorites();
        visible = true;
    }

    // Public method for parent to call to close modal
    export function close() {
        visible = false;
        dispatch("close");
    }

    // Public method for parent to call to refresh modal
    export function refresh() {
        favorites = getFavorites();
    }

    function remove(event, mealName) {
        // Stop event propagation to prevent opening recipe
        event.stopPropagation();
        
        removeFavorite(mealName);
        favorites = getFavorites();
        dispatch("faveChange"); // This tells App.svelte to refresh the global favoriteNames
    }
    
    // Function to view recipe for a meal
    function viewRecipe(meal) {
        dispatch("viewRecipe", meal);
    }

    $: if (visible) {
        favorites = getFavorites();
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
        <img src={BaonBuddyFavorites} alt="Favorites" class="favorites-title">
        {#if favorites.length === 0}
            <p>No saved baon yet 😢</p>
        {:else}
            <ul>
                {#each favorites as meal}
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <li on:click={() => selectMeal(meal)}>
                        <div class="meal-cont">
                            <img src={meal.image} alt={meal.name} class="meal-image">
                            <span>{meal.name}</span>
                        </div>
                        <button on:click|stopPropagation={(e) => remove(e, meal.name)} aria-label="Remove Button">
                            <svg 
                                width="24"
                                height="24"viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                <g id="SVGRepo_iconCarrier"> 
                                    <path d="M2.75 6.16667C2.75 5.70644 3.09538 5.33335 3.52143 5.33335L6.18567 5.3329C6.71502 5.31841 7.18202 4.95482 7.36214 4.41691C7.36688 4.40277 7.37232 4.38532 7.39185 4.32203L7.50665 3.94993C7.5769 3.72179 7.6381 3.52303 7.72375 3.34536C8.06209 2.64349 8.68808 2.1561 9.41147 2.03132C9.59457 1.99973 9.78848 1.99987 10.0111 2.00002H13.4891C13.7117 1.99987 13.9056 1.99973 14.0887 2.03132C14.8121 2.1561 15.4381 2.64349 15.7764 3.34536C15.8621 3.52303 15.9233 3.72179 15.9935 3.94993L16.1083 4.32203C16.1279 4.38532 16.1333 4.40277 16.138 4.41691C16.3182 4.95482 16.8778 5.31886 17.4071 5.33335H19.9786C20.4046 5.33335 20.75 5.70644 20.75 6.16667C20.75 6.62691 20.4046 7 19.9786 7H3.52143C3.09538 7 2.75 6.62691 2.75 6.16667Z" fill="#ffffff"></path> 
                                    <path d="M11.6068 21.9998H12.3937C15.1012 21.9998 16.4549 21.9998 17.3351 21.1366C18.2153 20.2734 18.3054 18.8575 18.4855 16.0256L18.745 11.945C18.8427 10.4085 18.8916 9.6402 18.45 9.15335C18.0084 8.6665 17.2628 8.6665 15.7714 8.6665H8.22905C6.73771 8.6665 5.99204 8.6665 5.55047 9.15335C5.10891 9.6402 5.15777 10.4085 5.25549 11.945L5.515 16.0256C5.6951 18.8575 5.78515 20.2734 6.66534 21.1366C7.54553 21.9998 8.89927 21.9998 11.6068 21.9998Z" fill="#ffffff"></path> 
                                </g>
                            </svg>
                        </button>
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
        z-index: 991;
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
        z-index: 992;
        overflow-y: auto;
    }

    .favorites-title {
        width: 100%;
        max-width: 220px;
        margin: 0 auto 1rem;
        display: block;
    }

    ul {
        list-style: none;
        padding: 0;
    }

    li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        cursor: pointer;
        border-radius: 8px;
        transition: background-color 0.2s ease;
    }
    
    li:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .meal-cont {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 12px;
        padding: 8px;
        flex: 1;
    }

    .meal-image {
        width: 32px;
        height: 32px;
        object-fit: contain;
        border-radius: 12px;
    }

    button {
        background: none;
        border: none;
        color: #FFF5E1;
        background-color: rgb(196, 12, 12);
        cursor: pointer;
        transition: all 300ms ease;
        border-radius: 4px;
        margin-right: 8px;
        padding: 4px;
    }

    button:hover {
        background-color: rgb(240, 45, 45);
    }
</style>