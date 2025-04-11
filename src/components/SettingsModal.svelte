<script>
    import { createEventDispatcher } from 'svelte';
    import { clearFavorites, resetStorage } from '../lib/storage.js';
    import { fade, fly } from 'svelte/transition';
    import { showToast } from '../lib/toast.js';
    import { getCounter } from '../lib/storage.js';

    const dispatch = createEventDispatcher();
    let timesOpened = 0;
    let timesGenerated = 0;
    let musicEnabled = localStorage.getItem("musicEnabled") !== "false";

    export let visible = false;

    function toggleMusicSetting() {
        musicEnabled = !musicEnabled;
        // @ts-ignore
        localStorage.setItem("musicEnabled", musicEnabled);
        dispatch("toggleMusic");
    }

    function clearFaves() {
        clearFavorites();
        dispatch("faveChange"); // to refresh any UI
        showToast("Favorites cleared!", "success");

        setTimeout(() => dispatch("close"), 500); // closes settings with delay for smoothness 
    }

    function resetApp() {
        resetStorage(); // a function you’ll define to wipe all app data
        dispatch("faveChange");
        showToast("App reset!", "success");

        setTimeout(() => dispatch("close"), 500); // closes settings with delay for smoothness
    }

    function closeModal() {
        dispatch('close');
    }

   // @ts-ignore
     $: if (visible) {
        timesOpened = getCounter("baonAppOpens");
        timesGenerated = getCounter("baonMealGenerations");
    }
</script>
  
<!-- svelte-ignore a11y_click_events_have_key_events -->
{#if visible}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        class="modal-backdrop" 
        in:fade={{ duration: 200 }} 
        out:fade={{ duration: 200 }} 
        on:click|self={closeModal}
    >
        <div 
        class="modal"
        in:fly={{ y: 40, duration: 250 }}
        out:fly={{ y: 40, duration: 250 }}
        >
            <header class="modal-header">
                <h2>⚙️ Settings</h2>
            </header>

            <section class="main-settings">
                <div class="setting toggle-setting">
                    <label class="toggle">
                        <input type="checkbox" class:checked={musicEnabled} on:change={toggleMusicSetting} />
                        <span class="slider"></span>
                        <span class="toggle-label">{musicEnabled ? 'Music On 🎶' : 'Music Off 🔇'}</span>
                    </label>
                </div>
                  
                <section class="delete-actions">
                    <section class="setting">
                        <button class="danger" on:click={clearFaves}>🗑️ Clear Favorites</button>
                    </section>
        
                    <section class="setting">
                        <button class="danger" on:click={resetApp}>🔄 Reset App</button>
                    </section>
                </section>
            </section>
            
            <section class="more-links">
                <p>
                    <a href="https://shop.angwikanatin.com/raccaian-portfolio/" target="_blank">🌐 My Portfolio</a><br>
                </p>
                <span class="fun-stats">
                    <span>App Opened: {timesOpened} Times</span>
                    <span>Meals Generated: {timesGenerated}</span>
                </span>
                <section class="version-info">
                    <p>📦 Version 1.0.0</p>
                </section>
            </section>
              

            <button class="close-btn" on:click={closeModal}>Close</button>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0; 
        left: 0;
        width: 100vw; 
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .modal {
        background: #fff5e1;
        padding: 1rem;
        border-radius: 1rem;
        width: 90%;
        max-width: 340px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }

    .modal-header h2 {
        margin-bottom: 1rem;
        font-size: 1.5rem;
        color: #231F47;
        text-align: center;
    }

    .setting {
        margin: 1rem 0;
        display: flex;
        justify-content: center;
    }

    /* Non delete actions */
    .toggle {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        position: relative;
    }

    .toggle input {
        display: none;
    }

    .slider {
        width: 50px;
        height: 28px;
        background-color: #ccc;
        border-radius: 999px;
        position: relative;
        transition: background-color 0.3s ease;
        flex-shrink: 0;
    }

    .slider::before {
        content: "";
        position: absolute;
        height: 20px;
        width: 20px;
        background: white;
        border-radius: 50%;
        top: 4px;
        left: 4px;
        transition: transform 0.3s cubic-bezier(0.3, 1.6, 0.5, 1), background 0.3s ease;
    }

    .toggle input:checked + .slider {
        background-color: #84e1b7;
    }

    .toggle input:checked + .slider::before {
        transform: translateX(22px);
    }

    .toggle-label {
        font-weight: bold;
        color: #231F47;
        font-size: 0.95rem;
    }

    /* Delete buttons */
    .delete-actions {
        display: flex;
        flex-direction: row;
        gap: 16px;
        justify-content: space-between;
        align-items: center;
    }
    .danger {
        background: #C40C0C;
        color: white;
        padding: 0.75rem 1.25rem;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1rem;
    }

    .close-btn {
        margin-top: 1.5rem;
        width: 100%;
        padding: 0.75rem;
        background: #231F47;
        color: white;
        border: none;
        border-radius: 10px;
        font-weight: bold;
        cursor: pointer;
    }

    /* Version Info */
    .version-info {
        text-align: center;
        font-size: 0.8rem;
        color: #6c648b;
    }

    /* Links */
    .more-links {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 4px;
    }

    .fun-stats {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        color: #231F47;
        font-weight: 500;    
        gap: 16px;
    }

    .fun-stats span {
        background-color: none;
        border: 2px dashed #6c648b;
        color: #6c648b;
        padding: 0.2rem 0.8rem;
        border-radius: 14px;
        font-size: 0.9rem;
    }
</style>  