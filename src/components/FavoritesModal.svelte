<script>
    import { getFavorites } from "../lib/storage.js"; // removeFavorite is async
    // @ts-ignore
    import { createEventDispatcher, onDestroy as svelteOnDestroy } from "svelte"; // onMount for initial load if visible by default
    import { fly, fade } from "svelte/transition";
    import { quintOut } from 'svelte/easing';
    import BaonBuddyFavorites from "/titles/BaonBuddyFavorites.png";
    import { getDisplayImageSrc } from "../lib/imageUtils.js";
    import { allMeals as allMealsStore } from "../lib/mealStore.js"; // Import the Svelte store
    import { get as getStoreValue } from "svelte/store"; // To read the store value
    import { showToast } from "../lib/toast.js"; // Assuming you have this

    const dispatch = createEventDispatcher();

    export let visible = false;
    let favoriteMealObjects = []; // Renamed to be clear it holds full objects
    let isLoading = false;

    // --- Swipe Gesture State ---
    let panelElement;        // Bound to the <aside> element
    let isDragging = false;
    let dragStartX = 0;        // X position where drag started (was startY)
    let currentAppliedTranslateX = 0; // The actual translateX value last applied (was currentY related)
    let panelWidth = 0;
    // @ts-ignore
    let scrollableContentElement; // To bind to the scrollable .favorites-list

    const SWIPE_CLOSE_THRESHOLD_PIXELS = 80; // Pixels to the right to trigger close

    // Inline styles for smooth drag
    // @ts-ignore
    let panelInlineStyle = '';
    // @ts-ignore
    let backdropInlineStyle = '';

    async function loadFavorites() {
        if (!visible) { 
            // Nada for now
        }
        
        isLoading = true;
        console.log("[FavoritesModal] Loading favorites...");
        try {
            const favoriteIds = await getFavorites();
            const allCurrentMeals = getStoreValue(allMealsStore);

            if (favoriteIds && Array.isArray(favoriteIds) && allCurrentMeals && Array.isArray(allCurrentMeals)) {
                favoriteMealObjects = favoriteIds
                    .map(id => allCurrentMeals.find(m => m.id === id))
                    .filter(Boolean)
                    .sort((a,b) => a.name.localeCompare(b.name));
            } else {
                favoriteMealObjects = [];
            }
        } catch (error) {
            console.error("[FavoritesModal] Error loading favorites:", error);
            favoriteMealObjects = [];
            showToast("Could not load favorites.", "error");
        } finally {
            isLoading = false;
        }
    }

   // @ts-ignore
    // @ts-ignore
      $: if (visible && $allMealsStore) { 
        loadFavorites();
    }

    function closeModal() {
        dispatch("close");
    }

    function requestRemoveFavoriteConfirmation(event, mealId, mealName) {
        event.stopPropagation();
        dispatch("requestRemoveFavorite", { id: mealId, name: mealName });
    }

    export async function refresh() {
        if (visible) {
            await loadFavorites();
        }
    }

    function viewRecipe(meal) {
        dispatch("viewRecipe", meal);
    }

    // --- Swipe Gesture Handlers ---
    // @ts-ignore
    function handleTouchStart(event) {
        if (!panelElement || !visible) return;

        const touchX = event.touches[0].clientX;
        // @ts-ignore
        const rect = panelElement.getBoundingClientRect();
        // Define an "edge" area for drag initiation if needed, or allow anywhere
        // For a side panel, often dragging from anywhere is fine, unless there's internal horizontal scroll.
        // Assuming .favorites-list only scrolls vertically.

        // Check if touch is on an interactive element like a button inside the panel
        let target = event.target;
        while (target && target !== panelElement) {
            if (target.tagName === 'BUTTON' || target.hasAttribute('on:click')) {
                isDragging = false; // Don't start panel drag if clicking a button
                return;
            }
            target = target.parentNode;
        }
        
        isDragging = true;
        dragStartX = touchX;
        currentAppliedTranslateX = 0; // Assuming it starts at translateX(0) when open
        // @ts-ignore
        panelWidth = panelElement.offsetWidth;
        // @ts-ignore
        panelElement.style.transition = 'none';
        
        // @ts-ignore
        const backdrop = panelElement.previousElementSibling; // Assumes backdrop is sibling before
        if (backdrop) backdrop.style.transition = 'none';
    }

    // @ts-ignore
    function handleTouchMove(event) {
        if (!isDragging || !panelElement) return;

        let currentTouchX = event.touches[0].clientX;
        let deltaX = currentTouchX - dragStartX;

        // Panel is on the right, swiping RIGHT to close it (positive deltaX)
        if (deltaX > 0) { // Only act if dragging in the close direction
            event.preventDefault(); // Prevent browser default horizontal actions
            // Apply rightward transform, don't let it go "more open" (left of 0)
            const newTranslateX = Math.max(0, deltaX);
            panelInlineStyle = `transform: translateX(${newTranslateX}px);`;
            currentAppliedTranslateX = newTranslateX; // Store for touchend

            // @ts-ignore
            const backdrop = panelElement.previousElementSibling;
            if (backdrop && panelWidth > 0) {
                const opacity = Math.max(0, 1 - (newTranslateX / panelWidth) * 1.5);
                backdropInlineStyle = `opacity: ${opacity.toFixed(2)};`;
            }
        } else {
            // If dragging left (trying to open more, or accidental),
            // reset to initial or do nothing to allow internal scroll
            // For now, simply don't update transform if deltaX is not positive.
            // This also means if user scrolls vertically within .favorites-list, this won't interfere.
        }
    }

    // @ts-ignore
    function handleTouchEnd() {
        if (!isDragging || !panelElement) return;
        isDragging = false;

        // @ts-ignore
        panelElement.style.transition = 'transform 0.3s ease-out';
        // @ts-ignore
        const backdrop = panelElement.previousElementSibling;
        if (backdrop) backdrop.style.transition = 'opacity 0.3s ease-out';

        if (currentAppliedTranslateX > SWIPE_CLOSE_THRESHOLD_PIXELS) {
            panelInlineStyle = ''; // Clear for Svelte's out:fly
            backdropInlineStyle = '';
            dispatch('close');
        } else {
            panelInlineStyle = 'transform: translateX(0px);'; // Snap back
            backdropInlineStyle = ''; // Reset opacity, CSS will handle fade if any
            setTimeout(() => {
                if (!isDragging) panelInlineStyle = ''; // Clear after snap
            }, 300);
        }
    }
</script>

{#if visible}
    <div
        class="modal-backdrop favorites-modal-backdrop"
        style={backdropInlineStyle}
        on:click={closeModal}
        in:fade={{ duration: 200 }}
        out:fade={{ duration: 200 }}
        role="button" tabindex="-1" aria-label="Close favorites panel"
        on:keydown={(e) => (e.key === 'Escape') && closeModal()} 
    ></div>
    <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
    <aside 
        class="modal-panel"
        bind:this={panelElement}
        on:touchstart|passive={handleTouchStart} 
        on:touchmove={handleTouchMove}         
        on:touchend={handleTouchEnd}
        on:touchcancel={handleTouchEnd}         
        style="{panelInlineStyle} touch-action: none;" 
        in:fly={{ x: '100%', duration: 350, easing: quintOut }} 
        out:fly={{ x: '100%', duration: 300, easing: quintOut }}
        role="dialog" aria-modal="true" aria-labelledby="favorites-title-img"
    >
        <header class="panel-header">
            <img src={BaonBuddyFavorites} alt="Favorites" id="favorites-title-img" class="favorites-title">
            <!-- ADDED Close Button -->
            <button class="panel-close-btn" on:click={closeModal} aria-label="Close Favorites">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        </header>

        {#if isLoading}
            <div class="loading-favorites">Loading favorites...</div>
        {:else if favoriteMealObjects.length === 0}
            <div class="no-favorites">
                <span class="no-fav-icon">😢</span>
                <p>You haven't saved any favorite Baon yet!</p>
                <span>Tap the heart icon on a meal card to save it here.</span>
            </div>
        {:else}
            <ul class="favorites-list">
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                {#each favoriteMealObjects as meal (meal.id)} <!-- Key by meal.id -->
                    {@const displaySrc = getDisplayImageSrc(meal.image)}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <li on:click={() => viewRecipe(meal)} title="View recipe for {meal.name}">
                        <div class="meal-info">
                            {#if displaySrc}
                                <img src={displaySrc} alt="" class="meal-image"/>
                            {:else}
                                <div class="meal-image placeholder">{meal.name ? meal.name[0] : '🍲'}</div>
                            {/if}
                            <span class="meal-name">{meal.name}</span>
                        </div>
                        <!-- Pass meal.id to removeFavAndUpdateList -->
                        <button 
                            class="remove-fav-btn" 
                            on:click={(e) =>  requestRemoveFavoriteConfirmation(e, meal.id, meal.name)} 
                            aria-label="Remove {meal.name} from Favorites"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <g id="SVGRepo_iconCarrier">
                                    <path d="M2.75 6.16667C2.75 5.70644 3.09538 5.33335 3.52143 5.33335L6.18567 5.3329C6.71502 5.31841 7.18202 4.95482 7.36214 4.41691C7.36688 4.40277 7.37232 4.38532 7.39185 4.32203L7.50665 3.94993C7.5769 3.72179 7.6381 3.52303 7.72375 3.34536C8.06209 2.64349 8.68808 2.1561 9.41147 2.03132C9.59457 1.99973 9.78848 1.99987 10.0111 2.00002H13.4891C13.7117 1.99987 13.9056 1.99973 14.0887 2.03132C14.8121 2.1561 15.4381 2.64349 15.7764 3.34536C15.8621 3.52303 15.9233 3.72179 15.9935 3.94993L16.1083 4.32203C16.1279 4.38532 16.1333 4.40277 16.138 4.41691C16.3182 4.95482 16.8778 5.31886 17.4071 5.33335H19.9786C20.4046 5.33335 20.75 5.70644 20.75 6.16667C20.75 6.62691 20.4046 7 19.9786 7H3.52143C3.09538 7 2.75 6.62691 2.75 6.16667Z" fill="currentColor"></path>
                                    <path d="M11.6068 21.9998H12.3937C15.1012 21.9998 16.4549 21.9998 17.3351 21.1366C18.2153 20.2734 18.3054 18.8575 18.4855 16.0256L18.745 11.945C18.8427 10.4085 18.8916 9.6402 18.45 9.15335C18.0084 8.6665 17.2628 8.6665 15.7714 8.6665H8.22905C6.73771 8.6665 5.99204 8.6665 5.55047 9.15335C5.10891 9.6402 5.15777 10.4085 5.25549 11.945L5.515 16.0256C5.6951 18.8575 5.78515 20.2734 6.66534 21.1366C7.54553 21.9998 8.89927 21.9998 11.6068 21.9998Z" fill="currentColor"></path>
                                </g>
                            </svg>
                        </button>
                    </li>
                {/each}
            </ul>
        {/if}
    </aside>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(10, 8, 30, 0.7); /* Themed backdrop */
        backdrop-filter: blur(4px);
        z-index: 1000; /* Below panel */
    }

    .modal-panel {
        position: fixed;
        top: 0;
        right: 0; /* Position on the right */
        width: 85%; /* Adjust width */
        max-width: 320px; /* Max width */
        height: 100%; /* Full height */
        background: #1a163f; /* Darker background */
        color: #fff5e1; /* Creamy text */
        padding: 1rem;
        padding-top: calc(var(--custom-safe-area-top));
        padding-bottom: calc(var(--custom-safe-area-bottom, env(safe-area-inset-bottom, 0px)));
        box-shadow: -4px 0 20px rgba(0,0,0,0.3); /* Shadow on the left */
        z-index: 1001;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        border-left: 1px solid #4a4090; /* Left border */
        display: flex;
        flex-direction: column;
        user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
    }

    .panel-header {
        display: flex;
        justify-content: space-between; /* Space title and button */
        align-items: center;
        margin-bottom: 1.5rem; /* Space below header */
        padding-bottom: 0.5rem; /* Padding below title */
        padding-top: 1rem;
        border-bottom: 1px solid #4a4090; /* Separator */
        flex-shrink: 0;
    }

    .favorites-title {
        /* width: 100%; Remove fixed width */
        max-width: 180px; /* Adjust size */
        height: auto; /* Maintain aspect ratio */
        display: block;
        flex-grow: 1; /* Allow title to take space */
        margin-right: 1rem; /* Space before close button */
    }

    .panel-close-btn { /* Style for the new close button */
        background: transparent;
        border: none;
        color: #fff5e1a8;
        cursor: pointer;
        padding: 0.5rem;
        margin: -0.5rem; /* Offset padding */
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s ease, background-color 0.2s ease;
        flex-shrink: 0;
    }
    .panel-close-btn:hover, .panel-close-btn:focus-visible {
        color: #fff;
        background-color: #4a409060;
        outline: none;
    }
    .panel-close-btn svg { width: 22px; height: 22px; }


    .no-favorites {
        text-align: center;
        padding: 3rem 1rem;
        color: #fff5e1b3;
        flex-grow: 1; /* Center vertically */
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.8rem;
    }
    .no-fav-icon { font-size: 2rem; }
    .no-favorites p { font-size: 1.1em; font-weight: 600; margin: 0; }
    .no-favorites span:last-child { font-size: 0.9em; opacity: 0.8; }

    .favorites-list {
        list-style: none;
        padding: 0;
        margin: 0; /* Remove default margins */
        flex-grow: 1; /* Allow list to scroll */
        overflow-y: auto; /* Enable scroll if needed */
        touch-action: pan-y; /* Allow vertical scroll on the list ITSELF */
        -webkit-overflow-scrolling: touch;
    }

    li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0.3rem; /* Adjust padding */
        margin-bottom: 0.5rem; /* Space between items */
        cursor: pointer;
        border-radius: 0.5rem; /* Rounded corners */
        transition: background-color 0.2s ease;
        border: 1px solid transparent; /* Placeholder for hover */
    }

    li:hover, li:focus-within { /* Style on hover or when button inside is focused */
        background-color: #2c2663; /* Hover background */
        border-color: #4a4090;
    }

    .meal-info { /* Renamed from meal-cont */
        display: flex;
        align-items: center;
        gap: 0.8rem; /* Space between image and text */
        flex: 1; /* Take available space */
        min-width: 0; /* Prevent overflow */
        padding: 0.3rem 0;
    }

    .meal-image {
        width: 36px; /* Slightly larger image */
        height: 36px;
        border-radius: 6px; /* Rounded image */
        object-fit: cover;
        flex-shrink: 0;
        background-color: #4a4090; /* Placeholder bg */
    }

    .meal-name {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .remove-fav-btn { /* Renamed */
        background: transparent; /* Transparent background */
        border: none;
        color: #e74c3c; /* Red icon color */
        cursor: pointer;
        transition: all 0.2s ease;
        border-radius: 0.4rem;
        padding: 0.4rem; /* Padding around icon */
        display: flex; /* Center icon */
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-left: 0.5rem; /* Space from text */
    }

    .remove-fav-btn:hover, .remove-fav-btn:focus-visible {
        background-color: #e74c3c30; /* Reddish background on hover */
        color: #ff6b6b; /* Brighter red */
        outline: none;
    }
    .remove-fav-btn svg { display: block; } /* Ensure SVG behaves well */

    .meal-image.placeholder { /* Basic style for image placeholder if no image */
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #4a4090; /* Match theme */
        color: #fff5e1;
        font-weight: bold;
        font-size: 1.2rem;
    }
    .loading-favorites {
        text-align: center;
        padding: 2rem;
        font-style: italic;
        color: #fff5e1a8;
    }
</style>