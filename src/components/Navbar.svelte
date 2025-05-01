<script>
  import Home from "../assets/Home.svelte";
  import BaonList from "../assets/BaonList.svelte";
  import Calendar from "../assets/Calendar.svelte";
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let current = 'home'; // The currently active screen name

  // Function to dispatch navigation event WITH the target screen name
  function handleNav(targetScreen) {
    console.log("Navigating to:", targetScreen); // For debugging
    dispatch('navigate', targetScreen); // Dispathc screen name to App.svelte for navigation
  }
</script>

<nav class="navbar">
  <button
    on:click={() => handleNav('home')}
    class:active={current === 'home'}
    class="nav-btn"
    aria-label="Home"
    aria-current={current === 'home' ? 'page' : undefined}
  >
    <span class="icon-wrapper">
      <Home />
    </span>
    <span class="label">Home</span>
  </button>
  <button
    on:click={() => handleNav('calendar')}
    class:active={current === 'calendar'}
    class="nav-btn"
    aria-label="Calendar"
    aria-current={current === 'calendar' ? 'page' : undefined}
  >
    <span class="icon-wrapper">
      <Calendar />
    </span>
     <span class="label">Calendar</span>
  </button>
  <button
    on:click={() => handleNav('baonlist')}
    class:active={current === 'baonlist'}
    class="nav-btn"
    aria-label="Baon List"
    aria-current={current === 'baonlist' ? 'page' : undefined}
  >
    <span class="icon-wrapper">
      <BaonList />
    </span>
     <span class="label">Baon List</span>
  </button>
</nav>

<!-- Add safe area padding at the bottom -->
<div class="safe-area-bottom"></div>

<style>
  .navbar {
    position: fixed; bottom: 0; left: 0; right: 0;
    background: #191337;
    display: flex; justify-content: space-around; align-items: center;
    padding: 0.6rem 0.6rem; /* Increased base vertical padding */
    padding-bottom: calc(0.6rem + env(safe-area-inset-bottom, 0rem)); /* Adjust safe area */
    gap: 1rem;
    box-shadow: 0 -4px 15px rgba(0,0,0,0.3);
    z-index: 999;
    border-top: 1px solid #3a3375;
    height: 75px; /* << SET A BASE HEIGHT */
    box-sizing: border-box;
  }

  .nav-btn {
    background: none; border: none; color: #fff5e1a8;
    font-size: 0.75rem; /* Slightly larger base label size */
    cursor: pointer; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 0.2rem; /* Increased gap */
    padding: 2rem .8rem; /* Adjusted padding */
    border-radius: 8px;
    transition: color 0.2s ease, background-color 0.2s ease, transform 0.15s ease;
    flex-grow: 1; position: relative;
    -webkit-tap-highlight-color: transparent;
    height: 100%; /* Make button fill height */
  }

  .icon-wrapper {
    line-height: 0;
    /* Style the SVG inside */
    & :global(svg) {
      display: block;
      width: 30px; /* << INCREASED BASE ICON SIZE */
      height: 30px;
      fill: currentColor; stroke: none;
      transition: transform 0.2s ease;
     }
  }

  .label {
    white-space: nowrap;
    margin-top: 0.1rem; /* Adjust label spacing */
  }

  /* Hover/Active States */
  .nav-btn:hover:not(.active) {
    color: #fff5e1; 
    background-color: rgba(255, 245, 225, 0.05);
  }
  .nav-btn:active { transform: scale(0.96); }

  /* Active State */
  .nav-btn.active { 
    color: #fff; 
    font-weight: 600; 
    background-color: #b388eb29;
  }
  .nav-btn.active .icon-wrapper :global(svg) { transform: scale(1.1); }

  /* --- RESPONSIVE --- */

  /* Tablets and potentially larger phones in landscape */
  @media (min-width: 600px) {
    .navbar { height: 85px; 
      padding: 0.8rem 0; 
      padding-bottom: calc(0.8rem + env(safe-area-inset-bottom, 0rem)); 
    }
    .nav-btn { font-size: 0.85rem; gap: 0.3rem; }
    .icon-wrapper :global(svg) { width: 34px; height: 34px; }
    .label { margin-top: 0.2rem; }
      .nav-btn.active::before { height: 4px; left: 25%; right: 25%; }
  }

  /* Larger Tablets / Small Desktops */
  @media (min-width: 900px) {
    .navbar { height: 90px; }
    .nav-btn { font-size: 0.9rem; }
    .icon-wrapper :global(svg) { width: 36px; height: 36px; }
  }

  /* Problem screens, specific styling */
  @media (min-width: 700px) and (min-height: 1000px) {
    .navbar { 
      height: 120px; 
      padding: 0.8rem 0.8rem; 
      gap: 2rem; 
      padding-bottom: calc(0.8rem + env(safe-area-inset-bottom, 0rem)); 
    }
    .icon-wrapper :global(svg) { width: 50px; height: 50px; }
    .label { margin-top: 0.2rem; font-size: 1rem; }
    .nav-btn.active::before { height: 4px; left: 25%; right: 25%; }
  }

  @media (min-width: 900px) and (min-height: 1300px) {
    .navbar { height: 150px; 
      padding: 0.8rem 0.8rem; 
      gap: 2rem; 
      padding-bottom: calc(0.8rem + env(safe-area-inset-bottom, 0rem)); 
    }
    .icon-wrapper :global(svg) { width: 70px; height: 70px; }
    .label { margin-top: 0.2rem; font-size: 1.4rem; }
    .nav-btn.active::before { height: 4px; left: 25%; right: 25%; }
  }
</style>