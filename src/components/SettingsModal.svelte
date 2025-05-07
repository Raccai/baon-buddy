<script>
    import { createEventDispatcher } from 'svelte';
    import { clearFavorites, resetStorage, getCounter } from '../lib/storage.js';
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { showToast } from '../lib/toast.js';
    import BaonBuddySettings from "/titles/BaonBuddySettings.png";
    import AchievementsIcon from "../assets/AchievementsIcon.svelte";

    const dispatch = createEventDispatcher();
    let timesOpened = 0;
    let timesGenerated = 0;
    let musicEnabled = localStorage.getItem("musicEnabled") === "true"; // Correct initial read

    export let visible = false;

    // --- CORRECTED Interaction Logic ---
    function handleMusicToggle() {
        // 1. Calculate the NEW intended state
        const newState = !musicEnabled;

        // 2. Update the component state IMMEDIATELY
        //    Svelte will now reliably see this change for UI updates.
        musicEnabled = newState;
        console.log("Music toggled via UI, new state:", musicEnabled);

        // 3. Perform side effects (localStorage, dispatch) AFTER updating state
        localStorage.setItem("musicEnabled", musicEnabled.toString());
        dispatch("toggleMusic");
    }
    // --- End Corrected Logic ---

    function clearFaves() {
        if (confirm("Are you sure you want to clear all your favorites?")) {
            clearFavorites();
            dispatch("faveChange");
            showToast("Favorites cleared!", "success");
            setTimeout(closeModal, 300);
        }
    }

    function resetApp() {
        if (confirm("Are you sure you want to reset the app? All data including favorites and settings will be lost! This cannot be undone.")) {
            resetStorage();
            showToast("App reset! Reloading...", "success");
            setTimeout(() => window.location.reload(), 1000);
        }
    }

    function closeModal() {
        dispatch('close');
    }

   $: if (visible) {
        timesOpened = getCounter("baonAppOpens");
        timesGenerated = getCounter("baonMealGenerations");
        const storedValue = localStorage.getItem("musicEnabled") === "true";
        if (musicEnabled !== storedValue) {
            musicEnabled = storedValue;
        }
    }
</script>


{#if visible}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div
        class="modal-backdrop"
        in:fade={{ duration: 200 }}
        out:fade={{ duration: 200 }}
        on:click|self={closeModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
    >
        <div
            class="modal"
            in:fly={{ y: 50, duration: 300, easing: quintOut }}
            out:fly={{ y: 50, duration: 250, easing: quintOut }}
        >
            <header class="modal-header">
                 <!-- Add an explicit close button -->
                 <button class="header-close-btn" on:click={closeModal} aria-label="Close Settings">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
                <img src={BaonBuddySettings} alt="Settings" id="settings-title" class="settings-title-image">
            </header>

            <section class="settings-content">
                <section class="setting toggle-setting">
                    <label class="toggle">
                        <span class="toggle-label">{musicEnabled ? 'Music On 🎶' : 'Music Off 🔇'}</span>
                        <input
                            type="checkbox"
                            checked={musicEnabled}  
                            on:change={handleMusicToggle} 
                            aria-labelledby="music-label"
                        />
                        <span class="slider"></span>
                    </label>
                    <span id="music-label" class="visually-hidden">Toggle background music</span>
                </section>

                <section class="setting link-setting">
                    <button class="setting-btn achievements-link" on:click={() => dispatch('openAchievements')}>
                       <span class="btn-icon"><AchievementsIcon /></span> View Achievements
                    </button>
                </section>

                <section class="delete-actions">
                    <button class="setting-btn danger" on:click={clearFaves}>
                        <span class="btn-icon">🧹</span> Clear Favorites
                    </button>
                    <button class="setting-btn danger reset" on:click={resetApp}>
                        <span class="btn-icon">♻️</span> Reset App
                    </button>
                </section>
            </section>

            <section class="more-info">
                <div class="fun-stats">
                    <span class="stat-item" title="Number of times the app has been opened.">
                        <span class="stat-icon">🚀</span> {timesOpened} Opens
                    </span>
                    <span class="stat-item" title="Number of times meals have been generated.">
                        <span class="stat-icon">🍲</span> {timesGenerated} Meals
                    </span>
                </div>
                <!-- <div class="version-info">
                    <p>📦 Version 1.0.0</p>
                </div> -->
            </section>

            <!-- Removed separate close button, using header one -->
            <!-- <button class="close-btn" on:click={closeModal}>Close</button> -->
        </div>
    </div>
{/if}

<style>
    .visually-hidden { /* Added for accessibility */
        position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
        overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
    }
    .modal-backdrop {
        position: fixed;
        inset: 0; /* Replaces top/left/width/height */
        background: rgba(10, 8, 30, 0.7); /* Themed backdrop */
        backdrop-filter: blur(4px);
        z-index: 999;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 1rem; /* Padding for smaller screens */
    }

    .modal {
        background: #231d52; /* Dark theme background */
        color: #fff5e1; /* Creamy text */
        padding: 1.5rem; /* Increased padding */
        border-radius: 1rem;
        width: 100%; /* Use padding on backdrop */
        max-width: 360px; /* Slightly wider */
        box-shadow: 0 5px 25px rgba(0,0,0,0.4); /* Themed shadow */
        border: 1px solid #4a4090; /* Subtle border */
        display: flex;
        flex-direction: column;
        gap: 1.5rem; /* Space between sections */
    }

    .modal-header {
        display: flex;
        flex-direction: column; /* Stack button and image */
        align-items: center;
        position: relative; /* For absolute positioning of close button */
        margin-bottom: -0.5rem; /* Pull content up slightly */
    }

    .header-close-btn {
        position: absolute;
        top: -8px; /* Adjust position */
        right: -8px;
        background: transparent;
        border: none;
        color: #fff5e1a8;
        cursor: pointer;
        padding: 0.5rem;
        margin: 0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s ease, background-color 0.2s ease;
    }
    .header-close-btn:hover, .header-close-btn:focus-visible {
        color: #fff;
        background-color: #4a409060;
        outline: none;
    }
    .header-close-btn svg { width: 22px; height: 22px; }

    .settings-title-image {
        width: 100%;
        max-width: 200px; /* Adjusted size */
        margin-top: 0.5rem; /* Space below close button */
        display: block;
    }

    .settings-content {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
    }

    .toggle-setting {
        background-color: #2c2663; /* Slightly lighter background */
        padding: 0.8rem 1rem;
        border-radius: 0.75rem;
        border: 1px solid #4a4090;
    }

    .toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        cursor: pointer;
        width: 100%;
    }

    .toggle input { display: none; }

    .slider {
        width: 48px; /* Adjusted size */
        height: 26px;
        background-color: #4a4090; /* Off state color */
        border-radius: 999px;
        position: relative;
        transition: background-color 0.3s ease;
        flex-shrink: 0;
        border: 1px solid #6a5acd; /* Subtle border */
    }

    .slider::before {
        content: "";
        position: absolute;
        height: 18px;
        width: 18px;
        background: #fff5e1; /* Handle color */
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        border-radius: 50%;
        top: 3px;
        left: 3px;
        transition: transform 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
    }

    .toggle input:checked + .slider {
        background-color: #b388eb; /* On state color */
        border-color: #fff5e1;
    }

    .toggle input:checked + .slider::before {
        transform: translateX(22px); /* Move handle */
    }

    .toggle-label {
        font-weight: 600; /* Bolder label */
        color: #fff5e1;
        font-size: 1rem;
    }

    /* Delete Buttons Section */
    .delete-actions {
        display: grid; /* Use grid for equal width */
        grid-template-columns: 1fr 1fr;
        gap: 0.8rem;
        margin-top: 0.5rem; /* Space above delete buttons */
    }

    .setting-btn { /* Common styles for all settings buttons */
        padding: 0.7rem 1rem;
        border: none;
        border-radius: 0.6rem;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
    }
    .setting-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        filter: brightness(1.1);
    }
    .setting-btn:active:not(:disabled) {
        transform: translateY(0);
        filter: brightness(0.95);
    }

    .danger { /* Specific danger styles */
        background: #c0392b; /* Adjusted red */
        color: white;
        box-shadow: 0 2px 5px rgba(192, 57, 43, 0.3);
    }
    .danger.reset {
        background: transparent;
        border: 2px solid #c0392b;
        color: #e74c3c; /* Lighter red text */
        box-shadow: none;
    }
    .danger.reset:hover {
        background-color: #c0392b20; /* Subtle hover background */
        color: #c0392b;
    }

    .btn-icon { font-size: 1.1em; }

    /* More Info Section */
    .more-info {
        background-color: #1a163f; /* Darker section bg */
        padding: 0.8rem 1rem;
        border-radius: 0.75rem;
        border: 1px dashed #4a4090; /* Dashed border */
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        margin-top: 0.5rem;
    }

    .fun-stats {
        display: flex;
        justify-content: space-between; /* Space out stats */
        align-items: center;
        flex-wrap: wrap; /* Allow wrapping on small screens */
        gap: 0.5rem;
    }

    .stat-item {
        color: #fff5e1b3; /* Semi-transparent text */
        font-weight: 500;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.3rem;
    }
    .stat-icon { font-size: 1.1em; }


    /* --- Link Setting Style (for Achievements Button) --- */
    .setting-btn.achievements-link {
        background-color: #2c2663; /* Match toggle background */
        color: #fff5e1;
        border: 1px solid #4a4090;
        width: 100%; /* Make it full width like toggle */
        justify-content: center; /* Center content */
        box-shadow: none; /* Remove danger shadow */
    }
    .setting-btn.achievements-link:hover {
        background-color: #3a3375; /* Similar hover to toggle */
        border-color: #6a5acd;
        filter: brightness(1.05); /* Slightly brighter instead of 1.1 */
    }
    .setting-btn.achievements-link:active {
        filter: brightness(0.95);
    }
    /* Style icon within the achievements button */
    .setting-btn.achievements-link .btn-icon :global(svg) {
        width: 20px; /* Adjust icon size */
        height: 20px;
        stroke-width: 2; /* Adjust stroke */
        color: #b388eb; /* Use accent color */
    }
</style>