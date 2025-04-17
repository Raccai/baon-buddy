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
    <div class="navbar-container">
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
        <button on:click={() => handleClick('generate', onGenerate)} aria-label="Generate Meals" class="generate-btn">
            <span class:active={activeButton === 'generate'}>
                <Shuffle />
            </span>
        </button>
    </div>
</nav>
  
<style>
    .navbar {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        background: #191337;
        padding: 0;
        box-shadow: 0 -2px 40px rgba(0, 0, 0, 0.4);
        z-index: 998;
    }
    
    .navbar-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0.6rem 0;
        display: flex;
        justify-content: space-around;
        align-items: center;
    }

    .navbar button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 12px;
        transition: transform 0.2s ease;
    }
    
    .navbar button:hover {
        transform: scale(1.1);
    }

    .navbar button span {
        display: inline-block;
        transition: transform 0.2s ease-in-out;
    }

    .navbar button span.active {
        animation: bounce 0.25s ease;
    }
    
    .generate-btn {
        transform: scale(1.1);
    }

    @keyframes bounce {
        0% { transform: scale(1); }
        40% { transform: scale(1.2); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); }
    }

    /* Small mobile devices */
    @media (max-width: 320px) {
        .navbar-container {
            padding: 0.7rem 0;
        }
        
        .navbar button {
            padding: 8px;
        }
    }
    
    /* Medium mobile devices */
    @media (min-width: 321px) and (max-width: 480px) {
        .navbar-container {
            padding: 0.8rem 0;
        }
    }
    
    /* Tablets and small laptops */
    @media (min-width: 481px) and (max-width: 768px) {
        .navbar-container {
            padding: 1rem 0;
        }
        
        .navbar button {
            padding: 14px;
        }
    }
    
    /* Large devices (laptops/desktops) */
    @media (min-width: 769px) and (max-width: 1200px) {
        .navbar-container {
            padding: 1.2rem 0;
        }
        
        .navbar button {
            padding: 16px;
        }
        
        .navbar button svg {
            width: 28px;
            height: 28px;
        }
    }
    
    /* Extra large devices */
    @media (min-width: 1201px) {
        .navbar-container {
            padding: 1.4rem 0;
        }
        
        .navbar button {
            padding: 18px;
        }
        
        .navbar button svg {
            width: 24px;
            height: 24px;
        }
    }
    
    /* For wide but short screens */
    @media (max-height: 1400px) and (min-width: 900px) {
        .navbar {
            height: auto;
        }
        
        .navbar-container {
            padding: 1.2rem 0;
        }

        .navbar button {
            transform: scale(1.4);
        }
        
        .generate-btn {
            transform: scale(1.6);
        }
    }
    
    /* For very short screens */
    @media (max-height: 400px) {
        .navbar-container {
            padding: 0.6rem 0;
        }
        
        .navbar button {
            padding: 6px;
        }
    }
</style>