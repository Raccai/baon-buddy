<script>
  import Home from "../assets/Home.svelte";
  import Calendar from "../assets/Calendar.svelte";
  import Menu from "../assets/Menu.svelte";
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let current = 'home'; // The currently active screen name

  // Function to dispatch navigation event WITH the target screen name
  function handleNav(targetScreen) {
    console.log("Navigating to:", targetScreen); // For debugging
    dispatch('navigate', targetScreen); // Dispatch screen name to App.svelte for navigation
  }

  // Function to dispatch event to open the side menu
  function openMenu() {
    dispatch('toggleMenu'); // <<< Dispatch a new event type
  }
</script>

<nav class="navbar">
  <div class="navbar-content">
    <button
      id="navbar-home-btn" 
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
      id="navbar-calendar-btn" 
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

    <!-- Menu Button (Replaces Baon List) -->
    <button
      id="navbar-menu-btn" 
      on:click={openMenu} 
      class="nav-btn"
      class:active={false} 
      aria-label="Open Menu"
    >
      <span 
        class="icon-wrapper"
        style="transform: scale(1.2);"  
      >
        <Menu />
      </span>
       <span class="label">Menu</span>
    </button>
  </div>

  <div class="safe-area-spacer"></div>
</nav>

<style>
  .navbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 999;
    /* display: flex; flex-direction: column; NO LONGER NEEDED if spacer div is removed */
    box-shadow: 0 -4px 15px rgba(0,0,0,0.3);
    border-top: 1px solid #3a3375;

    /* Apply the background here */
    background: #191337;

    /* Add padding to the bottom of the entire navbar */
    padding-bottom: env(safe-area-inset-bottom, 0px); /* <<< KEY CHANGE */
  }

  .navbar-content {
    /* background: #191337; MOVED to .navbar if you want the padding area to have the same bg */
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 0.6rem 0.6rem; /* Keep original padding for content */
    min-height: 60px; /* Adjust if needed based on your design */
  }

  .safe-area-spacer {
    /* Use the custom var from the plugin, fallback to env(), then to 0px */
    height: var(--custom-safe-area-bottom, env(safe-area-inset-bottom, 0px));
    background-color: #191337;
    width: 100%;
    flex-shrink: 0;
  }

  .nav-btn {
    background: none; 
    border: none; 
    color: #fff5e1a8;
    font-size: 0.75rem; 
    cursor: pointer; 
    display: flex; 
    flex-direction: column;
    align-items: center; 
    justify-content: center;
    gap: 0.2rem; 
    padding: 0.6rem 0.8rem; 
    border-radius: 8px;
    transition: color 0.2s ease, background-color 0.2s ease, transform 0.15s ease;
    flex-grow: 1; 
    position: relative;
    -webkit-tap-highlight-color: transparent;
  }

  .icon-wrapper {
    line-height: 0;
    /* Style the SVG inside */
    & :global(svg) {
      display: block;
      width: 30px; 
      height: 30px;
      fill: currentColor; 
      stroke: none;
      transition: transform 0.2s ease;
     }
  }

  .label {
    white-space: nowrap;
    margin-top: 0.1rem; 
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
    .navbar-content {
      padding: 0.8rem 0;
    }
    .nav-btn { font-size: 0.85rem; gap: 0.3rem; }
    .icon-wrapper :global(svg) { width: 34px; height: 34px; }
    .label { margin-top: 0.2rem; }
    .nav-btn.active::before { height: 4px; left: 25%; right: 25%; }
  }

  /* Larger Tablets / Small Desktops */
  @media (min-width: 900px) {
    .nav-btn { font-size: 0.9rem; }
    .icon-wrapper :global(svg) { width: 36px; height: 36px; }
  }

  /* Problem screens, specific styling */
  @media (min-width: 700px) and (min-height: 1000px) {
    .navbar-content { 
      padding: 0.8rem 0.8rem; 
      gap: 2rem; 
    }
    .icon-wrapper :global(svg) { width: 50px; height: 50px; }
    .label { margin-top: 0.2rem; font-size: 1rem; }
    .nav-btn.active::before { height: 4px; left: 25%; right: 25%; }
  }

  @media (min-width: 900px) and (min-height: 1300px) {
    .navbar-content { 
      padding: 0.8rem 0.8rem; 
      gap: 2rem; 
    }
    .icon-wrapper :global(svg) { width: 70px; height: 70px; }
    .label { margin-top: 0.2rem; font-size: 1.4rem; }
    .nav-btn.active::before { height: 4px; left: 25%; right: 25%; }
  }
</style>