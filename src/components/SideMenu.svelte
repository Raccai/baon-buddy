<!-- src/components/SideMenu.svelte -->
<script>
  import { createEventDispatcher, onDestroy as svelteOnDestroy } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing'; 
  import { sfxClick } from '../lib/sfxClick';
  import { playSound } from '../lib/soundManager';
  import FavoritesIcon from "../assets/Favorites.svelte";
  import SettingsIcon from "../assets/Settings.svelte";
  import ManageBaonIcon from "../assets/ManageBaonIcon.svelte";
  import BaonListIcon from "../assets/BaonList.svelte";
  import AchievementsIcon from '../assets/AchievementsIcon.svelte';
  import BaonBuddySideMenu from "/titles/BaonBuddySideMenu.png";
  import AddIcon from '../assets/AddIcon.svelte';

  export let visible = false;
  const dispatch = createEventDispatcher();

  let panelElement;        // Bound to the <aside> element
  let isDragging = false;
  let dragStartX = 0;        // X position where drag started
  let currentAppliedTranslateX = 0; // The actual translateX value last applied
  let panelWidth = 0;
  let menuNavElement; // To bind to the scrollable .menu-nav

  const SWIPE_CLOSE_THRESHOLD_PIXELS = 80; // e.g., swipe 80 pixels to close

  let panelInlineStyle = '';
  let backdropInlineStyle = '';

  function handleTouchStart(event) {
    if (!panelElement || !visible) return;
    
    isDragging = true;
    dragStartX = event.touches[0].clientX;
    currentAppliedTranslateX = 0; 
    panelWidth = panelElement.offsetWidth;
    panelElement.style.transition = 'none';
    
    const backdrop = panelElement.previousElementSibling;
    if (backdrop?.classList.contains('menu-backdrop')) {
        backdrop.style.transition = 'none';
    }
    // console.log(`[SideMenu] Touch START. StartX: ${dragStartX.toFixed(2)}, PanelWidth: ${panelWidth}`);
  }

  function handleTouchMove(event) {
    if (!isDragging || !panelElement) return;

    let currentTouchX = event.touches[0].clientX;
    let deltaX = currentTouchX - dragStartX;

    // We are dragging a right-side panel further TO THE RIGHT to close.
    // So, deltaX should be positive.
    
    // Prevent default browser horizontal scroll/navigation IF we are actually moving the panel.
    // This is important.
    if (deltaX > 0) { // Only prevent default if actually dragging in the close direction
        event.preventDefault();
    }


    let newTranslateX = Math.max(0, deltaX); // Don't allow dragging "more open" (further left than 0)
    
    panelInlineStyle = `transform: translateX(${newTranslateX}px); transition: none;`;
    currentAppliedTranslateX = newTranslateX; // Store the applied value

    const backdrop = panelElement.previousElementSibling;
    if (backdrop?.classList.contains('menu-backdrop') && panelWidth > 0) {
        const opacity = Math.max(0, 1 - (newTranslateX / panelWidth) * 1.2);
        backdropInlineStyle = `opacity: ${opacity.toFixed(2)}; transition: none;`;
    }
    // console.log(`[SideMenu] Touch MOVE. DeltaX: ${deltaX.toFixed(2)}, TranslateX: ${newTranslateX.toFixed(2)}`);
  }

  function handleTouchEnd(event) {
    if (!isDragging || !panelElement) return;
    isDragging = false;

    // currentAppliedTranslateX holds the last transform value from touchmove
    console.log(`[SideMenu] Touch END. Last Applied TranslateX: ${currentAppliedTranslateX.toFixed(2)}`);

    panelElement.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)';
    const backdrop = panelElement.previousElementSibling;
    if (backdrop?.classList.contains('menu-backdrop')) {
        backdrop.style.transition = 'opacity 0.3s ease-out';
    }

    if (currentAppliedTranslateX > SWIPE_CLOSE_THRESHOLD_PIXELS) { // Use pixel threshold
        console.log('[SideMenu] Swipe threshold MET. Dispatching close.');
        panelInlineStyle = ''; 
        backdropInlineStyle = '';
        dispatch('close'); 
    } else {
        console.log('[SideMenu] Swipe threshold NOT met. Snapping back.');
        panelInlineStyle = `transform: translateX(0px); transition: transform 0.2s ease-out;`;
        backdropInlineStyle = `opacity: ''; transition: opacity 0.2s ease-out;`;
        setTimeout(() => {
            if (!isDragging) {
                 panelInlineStyle = '';
                 backdropInlineStyle = '';
            }
        }, 250);
    }
  }

  function dispatchCloseAndReset() { // Used by X button and backdrop click
      // If it was being dragged and then X is clicked, reset transform before Svelte transition
      if (panelElement) {
          panelElement.style.transition = 'none'; // Prevent conflict
          panelElement.style.transform = '';
      }
      const backdrop = panelElement?.previousElementSibling;
      if (backdrop && backdrop.classList.contains('menu-backdrop')) {
          backdrop.style.transition = 'none';
          backdrop.style.opacity = '';
      }
      dispatch('close');
  }

  function handleMenuAction(actionType, detail = null) {
    console.log("Menu action:", actionType, detail);
    // NOTE TO SELF: Dispatching close *here* means the menu starts closing *before*
    // the action in App.svelte fully completes (like opening another modal).
    // This usually looks fine, but could be adjusted if needed.
    dispatch('close'); // Dispatch close FIRST
    // Add a tiny delay before dispatching the main action for smoother visual
    setTimeout(() => {
      dispatch(actionType, detail);
    }, 100); // Short delay (adjust if needed)
  }

  function closeMenu() {
    playSound('sideOpenClose');
    visible = false;
    dispatch('close');
  }

</script>

{#if visible}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="menu-backdrop"
    style={backdropInlineStyle}
    on:click={dispatchCloseAndReset}
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 200 }}
  ></div>

  <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
  <aside
    class="menu-panel"
    bind:this={panelElement}
    on:touchstart|passive={handleTouchStart} 
    on:touchmove={handleTouchMove}       
    on:touchend={handleTouchEnd}
    on:touchcancel={handleTouchEnd}       
    style="{panelInlineStyle} touch-action: none;" 
    in:fly={{ x: '100%', duration: 350, easing: quintOut }} 
    out:fly={{ x: '100%', duration: 300, easing: quintOut }} 
    role="menu" aria-label="Main Menu"
  >
    <!-- Optional: Add a header inside the menu -->
    <div class="menu-header">
      <img src={BaonBuddySideMenu} alt="Baon Buddy Side Menu" class="menu-title-image">
      <button class="menu-close-btn" use:sfxClick on:click={closeMenu} aria-label="Close Menu">×</button>
    </div>

    <nav class="menu-nav" transition:fade={{duration: 200, delay: 100}}>
      <!-- Baon List Navigation -->
      <button class="menu-item" use:sfxClick on:click={() => handleMenuAction('navigate', 'baonlist')}>
        <span class="menu-icon"><BaonListIcon /></span>
        <span class="menu-label">Baon List</span>
      </button>
      <!-- Favorites Modal Toggle -->
      <button 
        class="menu-item" 
        use:sfxClick 
        on:click={() => {
          handleMenuAction('toggleFavorites');
          playSound('sideOpenClose');
        }}
      >
        <span class="menu-icon"><FavoritesIcon /></span>
        <span class="menu-label">Favorites</span>
      </button>
      <!-- Settings Modal Toggle -->
      <button class="menu-item" use:sfxClick on:click={() => handleMenuAction('openSettings')}>
        <span class="menu-icon"><SettingsIcon /></span>
        <span class="menu-label">Settings</span>
      </button>
      <!-- Achievements (can also be found in the settings modal for now) -->
      <button class="menu-item" use:sfxClick on:click={() => handleMenuAction('openAchievements')}>
        <span class="menu-icon"><AchievementsIcon /></span>
        <span class="menu-label">Achievements</span>
      </button>
      <!-- Manage Baon -->
      <button class="menu-item" use:sfxClick on:click={() => handleMenuAction('openManageBaon')}>
        <span class="menu-icon"><ManageBaonIcon /></span>
        <span class="menu-label">Manage Baon</span>
      </button>
      <!-- Add Baon -->
      <button class="menu-item" use:sfxClick on:click={() => handleMenuAction('requestOpenAddForm')}>
        <span class="menu-icon"><AddIcon /></span>
        <span class="menu-label">Add Baon</span>
      </button>
    </nav>
    <div class="menu-footer">
      Baon Buddy v2.0
    </div>
  </aside>
{/if}

<style>
  .menu-backdrop {
    position: fixed; inset: 0;
    background-color: rgba(10, 8, 30, 0.65); /* Slightly darker */
    backdrop-filter: blur(4px); /* Slightly more blur */
    z-index: 1010;
  }

  .menu-panel {
    position: fixed; top: 0; bottom: 0; right: 0;
    width: 80%; max-width: 320px; /* Increased max-width */
    background-color: #231d52; color: #fff5e1;
    box-shadow: -5px 0 25px rgba(0,0,0,0.4); /* Softer, larger shadow */
    z-index: 1011;
    display: flex; flex-direction: column;
    border-left: 1px solid #4a4090; /* Add border */
    box-sizing: border-box;
    /* Apply safe area padding directly */
    padding-top: calc(var(--custom-safe-area-top));
    padding-bottom: calc(var(--custom-safe-area-bottom, env(safe-area-inset-bottom, 0px)));
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  .menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem 1rem 0.8rem 0; /* Padding */
    border-bottom: 1px solid #4a4090;
    flex-shrink: 0;
  }
  .menu-title-image {
    width: auto;
    height: 35px;
    max-width: 70%;
    display: block;
  }
  .menu-close-btn {
    background: none; border: none; color: #fff5e1a8;
    font-size: 1.8rem; line-height: 1; cursor: pointer;
    padding: 0.3rem; margin: -0.3rem; /* Hit area */
    border-radius: 50%;
    transition: color 0.2s ease, background-color 0.2s ease;
  }
  .menu-close-btn:hover {
    color: #fff; background-color: #4a409060;
  }

  .menu-nav {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow-y: auto; /* Allow scroll if needed */
    padding: 1rem 1rem; /* Padding above/below list */
    gap: 0.6rem;
    scrollbar-width: thin;
    scrollbar-color: #6a5acd #3a3375;
    touch-action: pan-y; /* Explicitly allow vertical scroll for the nav area */
    -webkit-overflow-scrolling: touch
  }
  .menu-nav::-webkit-scrollbar { width: 6px; }
  .menu-nav::-webkit-scrollbar-track { background: #3a3375; }
  .menu-nav::-webkit-scrollbar-thumb { background-color: #6a5acd; border-radius: 3px; }

  .menu-item {
    display: flex; align-items: center; gap: 1rem;
    padding: 1rem 1.5rem; /* Increased padding */
    background: none; 
    border: none; 
    color: #fff5e1;
    font-size: 1.05rem; /* Increased font size */
    text-align: left; 
    width: 100%; 
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;
    border: 1px solid #3a3375;
  }
  .menu-item:first-child { border-top: 1px solid #3a3375; }
  .menu-item:hover {
    background-color: #3a3375; /* Theme hover color */
    color: #fff; /* Brighter text on hover */
  }
  .menu-item:active {
    background-color: #4f46a8; /* Active press color */
  }

  .menu-icon {
    flex-shrink: 0; line-height: 0;
    color: #b388eb; /* Accent color */
    transition: transform 0.2s ease;
  }
  .menu-icon :global(svg) {
    width: 28px; /* Slightly larger icons */
    height: 28px;
    fill: currentColor; stroke: none;
  }
  .menu-item:hover .menu-icon {
    transform: scale(1.1); /* Subtle icon scale on hover */
  }

  .menu-label { flex-grow: 1; }

  .menu-footer {
    padding: 1.2rem;
    text-align: center;
    font-size: 0.8rem;
    color: #fff5e1a8;
    flex-shrink: 0;
    border-top: 1px solid #4a4090;
  }

  /* --- Responsive --- */
  @media (min-width: 768px) { /* Tablet */
    .menu-panel {
      max-width: 350px; /* Slightly wider */
    }
    .menu-header {
      padding: 1rem 1.2rem 1rem 2rem;
    }
    .menu-title-image {
      height: 40px;
    }
    .menu-item {
      padding: 1.1rem 2rem;
      font-size: 1.15rem;
      gap: 1.2rem;
    }
    .menu-icon :global(svg) {
      width: 30px;
      height: 30px;
    }
  }
</style>