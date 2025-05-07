<script>
  import { onMount, onDestroy } from 'svelte';
  import { App as CapacitorApp } from '@capacitor/app';
  import { StatusBar } from '@capacitor/status-bar';
  import { SafeArea } from "capacitor-plugin-safe-area";
  import { Capacitor } from '@capacitor/core';
  import { fade } from 'svelte/transition';
  import { forceUpdateDefaultMeals, getFavorites, incrementCounter, initializeDefaultMealsIfEmpty } from './lib/storage';
  import { checkAndUnlockAchievements } from './lib/achievementStore';

  import Navbar from './components/Navbar.svelte';
  import Topbar from './components/Topbar.svelte';
  import SideMenu from './components/SideMenu.svelte';
  import FavoritesModal from './components/FavoritesModal.svelte';
  import SettingsModal from './components/SettingsModal.svelte';
  import RecipeSheet from './components/RecipeSheet.svelte';
  import Toast from './components/Toast.svelte';

  // Screens
  import AchievementScreen from './components/screens/AchievementScreen.svelte';
  import Home from './components/screens/Home.svelte';
  import Calendar from './components/screens/Calendar.svelte';
  import BaonList from './components/screens/BaonList.svelte';
  import ManageBaonScreen from './components/ManageBaonScreen.svelte';
  import { initializeMealsStore } from './lib/mealStore';
  import { initializeStreakStore } from './lib/streakStore';

  let showOnboarding = localStorage.getItem("hasSeenOnboarding") !== "true";
  let currentScreen = localStorage.getItem("lastScreen") || 'home';

  function handleDone() {
    showOnboarding = false;
  }

  function handleNavigate(event) { // Accept the event object
    const screenName = event.detail; // Extract screen name from detail
    console.log(`App received navigate event for: ${screenName}`); // Debug log
    // Add validation if needed
    if (screenName && ['home', 'calendar', 'baonlist'].includes(screenName)) {
      currentScreen = screenName; // Update state with the correct name
      localStorage.setItem("lastScreen", screenName);
      closeAllModals(); // Close overlays
      closeSideMenu();
    } else {
      console.warn("Invalid screen name received in handleNavigate:", screenName);
    }
  }

  function toggleSideMenu() { // <<< ADD function to toggle menu
    const newState = !sideMenuVisible;
    console.log(`Toggling side menu from ${sideMenuVisible} to ${newState}`);
    sideMenuVisible = newState;
  }
  function closeSideMenu() { // <<< ADD function to close menu
    console.log(`Closing side menu (current: ${sideMenuVisible})`);
    sideMenuVisible = false;
  }

  // Helper to close all overlays (except optionally the one being opened)
  function closeAllModals() { // Updated to include side menu
    favoritesVisible = false;
    settingsVisible = false;
    showRecipeSheet = false;
    achievementsVisible = false;
    manageBaonVisible = false;
    // Does not close side menu here, specific actions handle it
  }

  let favoriteNames = getFavorites().map(meal => meal.name);
  let selectedRecipeMeal = null;
  let showRecipeSheet = false;

  function openRecipeSheet(meal) {
    selectedRecipeMeal = meal;
    showRecipeSheet = true;
  }
  function closeRecipeSheet() {
    showRecipeSheet = false;
  }

  // Favorites and Settings functions
  let favoritesRef; // Keep the ref if you need it for other reasons, but not for open/close
  let favoritesVisible = false;
  let settingsVisible = false;
  let achievementsVisible = false;
  let manageBaonVisible = false;
  let sideMenuVisible = false; // <<< ADD state for side menu
  let audio;
  let musicEnabled = localStorage.getItem("musicEnabled") === "true"; // Default to true if not "false"
  let appIsActive = true;
  let musicShouldPlay = musicEnabled;

  function toggleFavorites() {
    favoritesVisible = !favoritesVisible;
  }
  function openSettings() {
    settingsVisible = true;
  }

  // --- Functions for Achievements ---
  function openAchievements() {
    console.log("Opening Achievements"); // Debug log
    closeAllModals(); // Close others before opening
    achievementsVisible = true;
  }
  function closeAchievements() { achievementsVisible = false; }

  // --- Functions for Manage Baon ---
  function openManageBaon() { // <<< ADD Function to open
    console.log("Opening Manage Baon"); // Debug log
    closeAllModals(); // Close others before opening
    manageBaonVisible = true;
  }
  function closeManageBaon() { // <<< ADD Function to close
    manageBaonVisible = false;
  }

  function refreshAppFavorites() {
    console.log("Refreshing app favorites list...");
    favoriteNames = getFavorites().map(meal => meal.name);
    // If the FavoritesModal is currently open AND has an exported refresh method, call it.
    if (favoritesVisible && favoritesRef?.refresh) {
      console.log("Refreshing FavoritesModal instance.");
      favoritesRef.refresh();
    }
    // Achievement checks might depend on favorite counts, so check again
    checkAndUnlockAchievements();
  }

  // --- Music Control ---
  function playMusic() {
    if (audio && !audio.paused) return; // Already playing
    if (audio && musicEnabled && appIsActive) { // Only play if enabled AND app is active
      console.log("Attempting to play music...");
      audio.play().catch(e => console.warn("Music play failed (likely needs interaction or already playing):", e));
    } else {
      console.log("Music not playing (disabled or app inactive).");
    }
  }

  function pauseMusic() {
    if (audio && !audio.paused) { // Only pause if playing
      console.log("Pausing music...");
      audio.pause();
    }
  }

  function toggleMusic() {
    // This function is CALLED BY SettingsModal when the user manually toggles
    const newMusicEnabledState = localStorage.getItem("musicEnabled") === "true"; // Get state saved by SettingsModal
    musicEnabled = newMusicEnabledState; // Update App.svelte's state
    musicShouldPlay = newMusicEnabledState; // Update desired state

    console.log("App received toggleMusic event. New state:", musicEnabled);
    if (musicEnabled) {
      playMusic(); // Attempt to play if now enabled (respects appIsActive flag)
    } else {
      pauseMusic(); // Pause if now disabled
    }
  }

  function updateNavBarHeight() {
    // If visualViewport is available, use it:
    const visibleH = window.visualViewport?.height ?? document.documentElement.clientHeight;
    const fullH    = window.innerHeight;
    const navBarH  = fullH - visibleH;
    document.documentElement.style.setProperty('--android-nav-height', `${navBarH}px`);
    console.log('Android nav bar height =', navBarH);
  }

  let appStateListener = null;
  const APP_VERSION_KEY = 'baonAppVersion';
  const CURRENT_APP_VERSION = '1.6';
  onMount(async () => {
    // Check if we need to update default meals
    const storedVersion = localStorage.getItem(APP_VERSION_KEY);
    if (storedVersion !== CURRENT_APP_VERSION) {
      console.log(`App version changed from ${storedVersion || 'none'} to ${CURRENT_APP_VERSION}, updating default meals...`);
      
      // Update the default meals
      forceUpdateDefaultMeals();
      
      // Store the new version
      localStorage.setItem(APP_VERSION_KEY, CURRENT_APP_VERSION);
    }

    // --- Capacitor Platform Specific Setup ---
    if (Capacitor.isNativePlatform()) {
        try {
            // Configure Status Bar for edge-to-edge
            await StatusBar.setOverlaysWebView({ overlay: true });
            console.log('StatusBar overlay configured.');
            // Optional: Set status bar style if needed
            // await StatusBar.setStyle({ style: Style.Light }); // Or Style.Dark
        } catch (e) {
            console.error('Error configuring StatusBar:', e);
        }

        // --- Use capacitor-plugin-safe-area ---
        try {
            const safeAreaData = await SafeArea.getSafeAreaInsets();
            const { insets } = safeAreaData;

            // Set CSS custom properties on the :root (html element) for global access
            // Using slightly different names to avoid confusion with Ionic's default --ion-safe-area-*
            // if you ever mix with Ionic components, though your names are fine too.
            document.documentElement.style.setProperty('--custom-safe-area-top', `${insets.top}px`);
            document.documentElement.style.setProperty('--custom-safe-area-right', `${insets.right}px`);
            document.documentElement.style.setProperty('--custom-safe-area-bottom', `${insets.bottom}px`);
            document.documentElement.style.setProperty('--custom-safe-area-left', `${insets.left}px`);

            console.log('SafeArea Insets from plugin:', insets);

            // The plugin might also provide an event listener for changes (e.g., rotation)
            // Check the plugin's documentation for an event like 'safeAreaChanged'
            // Example (syntax might vary based on the plugin):
            SafeArea.addListener('safeAreaChanged', (changedData) => {
                const { insets: newInsets } = changedData;
                document.documentElement.style.setProperty('--custom-safe-area-top', `${newInsets.top}px`);
                document.documentElement.style.setProperty('--custom-safe-area-right', `${newInsets.right}px`);
                document.documentElement.style.setProperty('--custom-safe-area-bottom', `${newInsets.bottom}px`);
                document.documentElement.style.setProperty('--custom-safe-area-left', `${newInsets.left}px`);
                console.log('SafeArea Insets updated:', newInsets);
            });

        } catch (e) {
            console.error("Error getting/setting safe area insets from plugin:", e);
            // Fallback if plugin fails: try to set 0 or rely on CSS env()
            document.documentElement.style.setProperty('--custom-safe-area-bottom', '0px'); // Or some default
        }

    } else {
        // For web, you might want to set fallbacks or rely on CSS env()
        // The plugin likely won't work on web, so these vars won't be set by it.
        // CSS will then fall back to env() or 0px.
        console.log("Not a native platform. Plugin won't set dynamic safe areas.");
    }
    
    // Increment count when app opens
    incrementCounter("baonAppOpens");

    // Init streak
    initializeStreakStore();

    // --- Initialize Combined Meals Store ---
    initializeDefaultMealsIfEmpty();
    initializeMealsStore();
    if (localStorage.getItem("hasSeenOnboarding") === "true") {
      incrementCounter("baonAppOpens");
    }

    // For Achievements
    checkAndUnlockAchievements();

    // --- Preloader Logic ---
    const preloader = document.getElementById('preloader');
    if (preloader) {
      // Ensure initial opacity is set if needed by CSS
      // preloader.style.opacity = '1'; // Might not be needed if CSS handles it

      // Shorter delay before starting fade out (e.g., 500ms)
      setTimeout(() => {
        if (preloader) { // Check again in case component unmounted quickly
          preloader.style.transition = 'opacity 0.8s ease';
          preloader.style.opacity = '0';
          // Remove after fade out transition ends
          setTimeout(() => {
              if (preloader) preloader.remove();
          }, 800); // Match fade duration
        }
      }, 500); // << SHORTER DELAY
    }

    // --- Audio Logic (Separate Try/Catch) ---
    try {
      audio = new Audio("/music/InVain.mp3");
      audio.loop = true;
      audio.volume = 0.8;

      // Store desired state based on settings
      musicShouldPlay = musicEnabled;

      // Initial play attempt ONLY if enabled and app starts active
      if (musicShouldPlay && appIsActive) {
        playMusic(); // Use the helper function
      }
    } catch (err) {
      console.error("Error initializing audio:", err);
    }

    // --- Capacitor App State Listener ---
    appStateListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
      appIsActive = isActive; // Update our tracking variable
      if (isActive) {
        // App came to foreground
        if (musicShouldPlay) { // Check if music SHOULD be playing based on settings
          playMusic();
        }
      } else {
        // App went to background
        pauseMusic(); // Always pause when going to background
      }
    });

    updateNavBarHeight();
    // Recalculate on changes (rotation, keyboard up/down, etc)
    window.visualViewport?.addEventListener('resize', updateNavBarHeight);
    window.addEventListener('resize', updateNavBarHeight);
  });

  onDestroy(() => {
    window.visualViewport?.removeEventListener('resize', updateNavBarHeight);
    window.removeEventListener('resize', updateNavBarHeight);
    if (appStateListener) {
      appStateListener.remove();
    }
  })
</script>

<div class="app-container">
  <div class="topbar-wrapper">
    <Topbar />
  </div>

  <main class="main-content-area"> {#key currentScreen}
    <!-- Wrapper for TRANSITIONS ONLY -->
    <div class="screen-transition-wrapper" transition:fade={{ duration: 200 }}>
      {#if currentScreen === 'home'}
        <Home on:viewRecipe={(e) => openRecipeSheet(e.detail)} />
      {:else if currentScreen === 'calendar'}
        <Calendar />
      {:else if currentScreen === 'baonlist'}
        <BaonList />
      {/if}
    </div>
    {/key}
  </main>

  <!-- <div class="navbar-wrapper">
  </div> -->
</div>

<Navbar 
  on:navigate={handleNavigate} 
  on:toggleMenu={toggleSideMenu}
  current={currentScreen} 
/>

<Toast />

<!-- Modals and Sheets -->
<SideMenu
  visible={sideMenuVisible}
  on:close={() => sideMenuVisible = false}
  on:navigate={handleNavigate} 
  on:toggleFavorites={toggleFavorites}
  on:openSettings={openSettings}
  on:openManageBaon={openManageBaon}
  on:openAchievements={openAchievements} 
/>

<FavoritesModal
  bind:this={favoritesRef}
  visible={favoritesVisible}
  on:faveChange={() => {
    favoriteNames = getFavorites().map(meal => meal.name); // Still need to update this if BaonCard uses it
  }}
  on:close={() => favoritesVisible = false}
  on:viewRecipe={(e) => openRecipeSheet(e.detail)} 
/>

<SettingsModal
  visible={settingsVisible}
  on:close={() => settingsVisible = false}
  on:faveChange={() => {
    favoriteNames = getFavorites().map(meal => meal.name);
    // No need to call refresh on favoritesRef if using visible prop
  }}
  on:toggleMusic={toggleMusic}
  on:openAchievements={openAchievements}
/>

<!-- Pass correct state to RecipeSheet -->
<RecipeSheet
  visible={showRecipeSheet}
  meal={selectedRecipeMeal}
  on:close={closeRecipeSheet}
/>

{#if achievementsVisible}
  <div class="achievements-overlay" transition:fade={{ duration: 250 }}>
    <!-- Add a close button wrapper if needed -->
    <AchievementScreen on:close={closeAchievements} />
  </div>
{/if}

{#if manageBaonVisible}
  <div class="manage-baon-overlay" transition:fade={{duration: 250}}>
    <ManageBaonScreen on:close={closeManageBaon} on:userMealsChanged={refreshAppFavorites} />
  </div>
{/if}

<style>
  .app-container {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background-color: #1a163f;
    /* Add padding at the bottom to account for navbar plus safe area */
    padding-bottom: calc(60px + var(--custom-safe-area-bottom, env(safe-area-inset-bottom, 0px)));
    box-sizing: border-box;
  }

  .topbar-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 990;
    flex-shrink: 0;
    /* Define height EXPLICITLY if Topbar doesn't have one */
    height: 68px; /* Example Height */
    background-color: #231d52; /* Example background */
  }

  .main-content-area {
    flex-grow: 1;
    overflow: hidden;
    position: relative;
    margin-top: 68px;  /* Match Topbar height */
    /* Add bottom margin for navbar */
    margin-bottom: calc(env(safe-area-inset-bottom, 0px));
  }

  .screen-transition-wrapper {
    position: absolute;
    inset: 0; /* Fill the main-content-area (between margins) */
    overflow: hidden; /* Clip content during transition */
    display: flex; /* Make child fill space */
  }

  /* Make screen component fill the transition wrapper */
  /* Ensure the screen component itself has height: 100% */
  .screen-transition-wrapper > :global(*) {
    flex-grow: 1; /* Should fill the flex container */
    width: 100%;
    /* height: 100%; // Usually handled by flex-grow */
  }

  /* Styling for the Achievements Overlay */
  .achievements-overlay {
    position: fixed;
    inset: 0; /* Cover the whole screen */
    z-index: 1000; /* High z-index */
    background-color: rgba(10, 8, 30, 0.5); /* Optional backdrop */
    backdrop-filter: blur(3px); /* Optional blur */
    display: flex; /* Allow centering or positioning */
    /* You might want padding or specific alignment here */
    padding-top: 68px; /* Example: Space for topbar */
    padding-bottom: 70px; /* Example: Space for navbar */
    box-sizing: border-box;
    overflow: hidden; /* Prevent wrapper scroll */
  }

  /* Ensure AchievementsScreen component fills the overlay */
  /* Adjust selector if AchievementsScreen root element is different */
  .achievements-overlay > :global(.achievements-page) {
    width: 100%;
    height: 100%; /* Fill the overlay */
    /* Override background if needed, or let it be transparent */
    background-color: #1a163f; /* Or make it slightly transparent */
    border-radius: 0; /* Remove radius if it had one */
    padding: 1.5rem 1rem 1rem 1rem; /* Adjust padding if needed */
  }

  /* For ManageBaon */
  .manage-baon-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background-color: rgba(10, 8, 30, 0.5); backdrop-filter: blur(3px);
    display: flex; padding-top: 0; padding-bottom: 0;
    box-sizing: border-box; overflow: hidden;
  }
  .manage-baon-overlay > :global(*) { /* Target ManageBaonScreen root */
    width: 100%; height: 100%;
  }
</style>
