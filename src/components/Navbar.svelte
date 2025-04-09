<script>
    import Favorites from "../assets/Favorites.svelte";
    import Settings from "../assets/Settings.svelte";
    import Shuffle from "../assets/Shuffle.svelte";

    export let onGenerate;
    export let onToggleFavorites;
    export let onOpenSettings;

    let activeButton = null;

    function handleClick(name, callback) {
        activeButton = name;

        // trigger reflow (allows animation to restart if spam-tapped)
        setTimeout(() => activeButton = null, 300);

        callback?.();
    }
</script>
  

<nav class="navbar">
    <button on:click={() => handleClick('settings', onOpenSettings)} aria-label="Settings">
        <span class:active={activeButton === 'settings'}>
            <Settings />
        </span>
    </button>
    <button on:click={() => handleClick('favorites', onToggleFavorites)} aria-label="View Favorites">
        <span class:active={activeButton === 'favorites'}>
            <Favorites />
        </span>
    </button>
    <button on:click={() => handleClick('generate', onGenerate)} aria-label="Generate Meals">
        <span class:active={activeButton === 'generate'}>
            <Shuffle />
        </span>
    </button>
</nav>
  

<style>
    .navbar {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        background: #191337;
        padding: 0.9rem 0;
        display: flex;
        justify-content: space-around;
        align-items: center;
        box-shadow: 0 -2px 40px rgba(0, 0, 0, 0.4);
        z-index: 999;
    }

    .navbar button {
        background-color: #191337;
    }

    .navbar button span {
        background: none;
        border: none;
        cursor: pointer;
        display: inline-block;
        transition: transform 0.2s ease-in-out;
    }

    .navbar button span.active {
        animation: bounce 0.25s ease;
    }

    @keyframes bounce {
        0% { transform: scale(1); }
        40% { transform: scale(1.2); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); }
    }
</style>