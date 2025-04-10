<script>
    import { createEventDispatcher } from 'svelte';
    import { clearFavorites, resetStorage } from '../lib/storage.js';
    import { fade, fly } from 'svelte/transition';

    const dispatch = createEventDispatcher();

    export let visible = false;
    let message = "";
    let showMessage = false;

    function showToast(msg) {
        message = msg;
        showMessage = true;
        setTimeout(() => showMessage = false, 2500);
    }

    function clearFaves() {
        clearFavorites();
        dispatch("faveChange"); // to refresh any UI
        dispatch("close") // closes settings
        showToast("Favorites cleared!");
    }

    function resetApp() {
        resetStorage(); // a function you’ll define to wipe all app data
        dispatch('faveChange');
        dispatch("close") // closes settings
        showToast('App reset!');
    }

    function closeModal() {
        dispatch('close');
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

        <section class="setting">
            <button class="danger" on:click={clearFaves}>🗑️ Clear Favorites</button>
        </section>

        <section class="setting">
            <button class="danger" on:click={resetApp}>🔄 Reset App</button>
        </section>

        <button class="close-btn" on:click={closeModal}>Close</button>
        </div>
    </div>
    <div class="toast">{message}</div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .modal {
        background: #fff5e1;
        padding: 2rem;
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

    .danger {
        background: #e84a5f;
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

    /* Styling for Toast Messages */
    .toast {
        position: absolute;
        bottom: 1.5rem;
        left: 50%;
        transform: translateX(-50%);
        background: #231F47;
        color: white;
        padding: 0.6rem 1rem;
        border-radius: 10px;
        font-size: 0.95rem;
        animation: fadeInOut 2.5s ease-in-out;
        z-index: 999;
    }

    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, 20px); }
        10% { opacity: 1; transform: translate(-50%, 0); }
        90% { opacity: 1; transform: translate(-50%, 0); }
        100% { opacity: 0; transform: translate(-50%, 20px); }
    }
</style>  