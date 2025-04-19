<script>
  import BaonBuddyTitle from "/titles/BaonBuddyTitle.png";
  import Favorites from "../assets/Favorites.svelte";
  import Settings from "../assets/Settings.svelte";

  export let onToggleFavorites;
  export let onOpenSettings;

  let activeButton = null;

  function handleClick(name, callback) {
    activeButton = name;
    setTimeout(() => activeButton = null, 300);
    callback?.();
  }
</script>

<header class="topbar">
  <div class="image">
    <img src={BaonBuddyTitle} alt="Baon Buddy" class="app-title" />
  </div>
  <div class="topbar-buttons">
    <button on:click={() => handleClick('favorites', onToggleFavorites)} aria-label="View Favorites">
      <span class:active={activeButton === 'favorites'}>
        <Favorites />
      </span>
    </button>
    <button on:click={() => handleClick('settings', onOpenSettings)} aria-label="Open Settings">
      <span class:active={activeButton === 'settings'}>
        <Settings />
      </span>
    </button>
  </div>
</header>

<style>
  .topbar {
    position: fixed;
    top: 0;
    width: 100%;
    height: 68px;
    background: #191337;
    color: #fff;
    padding: 0.2rem;
    font-weight: bold;
    z-index: 9;
    box-shadow: 0 2px 40px rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .image {
    padding-left: 0.6rem;
    padding-top: 0.2rem;
  }

  .app-title {
    height: auto;
    width: auto;
    max-width: 90px;
    margin: 0;
  }

  .topbar-buttons {
    display: flex;
    align-items: center;
    gap: 0;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }

  button:hover {
    transform: scale(0.9);
  }

  span.active {
    animation: bounce 0.25s ease;
  }

  span {
    transform: scale(0.7);
  }

  @keyframes bounce {
    0%   { transform: scale(0.7); }
    50%  { transform: scale(0.9); }
    100% { transform: scale(0.7); }
  }

  /* Standard responsive media queries */
  @media (min-width: 700px) and (min-height: 1000px) {
    .topbar {
      height: 90px;
    }

    .app-title {
      height: auto;
      width: auto;
      max-width: 140px;
      margin: 0;
    }

    .topbar-buttons {
      gap: 2rem;
      margin-right: 2rem;
    }

    span {
      transform: scale(1.2);
    }
  }

  @media (min-width: 900px) and (min-height: 1300px) {
    .topbar {
      height: 140px;
    }

    .app-title {
      height: auto;
      width: auto;
      max-width: 200px;
      margin: 0;
    }

    .topbar-buttons {
      gap: 4rem;
      margin-right: 2rem;
    }

    span {
      transform: scale(1.6);
    }
  }
</style>