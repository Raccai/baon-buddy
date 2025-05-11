<script>
  import { onMount, onDestroy } from 'svelte';
  import { App as CapacitorApp } from '@capacitor/app';
  import { StatusBar } from '@capacitor/status-bar';
  import { SafeArea } from "capacitor-plugin-safe-area";
  import { Capacitor } from '@capacitor/core';
  import { fade, fly } from 'svelte/transition';
  import { quintIn, quintOut } from 'svelte/easing';

  // Import ASYNC storage functions
  import {
    initializeAppStorageAndMeals,
    getFavorites, // ASYNC
    incrementCounter, // Assuming synchronous (uses localStorage for small counters)
    updateMeal,     // ASYNC
    addMeal,        // ASYNC
    deleteMeal,      // ASYNC
    resetStorage,

    clearFavorites


    // forceUpdateDefaultMeals is now primarily called by initializeAppStorageAndMeals
  } from './lib/storage.js';

  // Svelte Stores & Store Loaders
  import { allMeals as allMealsStore, loadMealsIntoStoreFromFS } from './lib/mealStore.js';
  import { initializeCalendarStore } from './lib/calendar.js'; // Calendar store itself is in calendar.js
  import { get as getStoreValue } from 'svelte/store'; // To read store values synchronously if needed

  // Other Utilities
  import { checkAndUnlockAchievements } from './lib/achievementStore.js';
  import { showToast } from './lib/toast.js';

  // Components
  import Navbar from './components/Navbar.svelte';
  import Topbar from './components/Topbar.svelte';
  import SideMenu from './components/SideMenu.svelte';
  import FavoritesModal from './components/FavoritesModal.svelte';
  import SettingsModal from './components/SettingsModal.svelte';
  import RecipeSheet from './components/RecipeSheet.svelte';
  import Toast from './components/Toast.svelte';
  import BaonForm from './components/BaonForm.svelte';
  import ConfirmationModal from './components/ConfirmationModal.svelte';

  // Screens
  import AchievementScreen from './components/screens/AchievementScreen.svelte';
  import Home from './components/screens/Home.svelte';
  import Calendar from './components/screens/Calendar.svelte';
  import BaonList from './components/screens/BaonList.svelte';
  import ManageBaonScreen from './components/ManageBaonScreen.svelte';

  // --- App State ---
  let currentScreen = localStorage.getItem("lastScreen") || 'home';
  // Modal/Overlay Visibility
  let sideMenuVisible = false;
  let favoritesVisible = false;
  let settingsVisible = false;
  let achievementsVisible = false;
  let manageBaonVisible = false;
  let showRecipeSheet = false;
  let showBaonForm = false;
  // BaonForm State
  let currentBaonFormMode = "add"; // 'add' or 'edit'
  let baonFormInitialData = null;   // Data passed to BaonForm when editing
  // Data for UI
  let favoriteNames = [];         // Array of names of favorited meals
  let selectedRecipeMeal = null;  // Meal object for RecipeSheet
  // Audio
  let audio;
  let musicEnabled = localStorage.getItem("musicEnabled") === "true";
  let appIsActive = true;
  let musicShouldPlay = musicEnabled;
  // App Version (can be const if only used in onMount)
  const CURRENT_APP_VERSION = '1.8'; // Bump for significant changes like storage
  // For FavoritesModal binding
  let favoritesRef;

  // --- Confirmation Modal State ---
  let showConfirmModal = false;
  let confirmModalProps = {
    title: 'Are you sure?',
    message: 'This action cannot be undone.',
    confirmText: 'Yes, Proceed',
    cancelText: 'No, Cancel',
    confirmClasses: 'btn-danger', // Default to danger
    onConfirm: () => {},         // Placeholder for the action
    onCancel: () => { showConfirmModal = false; },
    isLoading: false,
  };

  function requestConfirmation({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', confirmClasses = 'btn-danger', onConfirmAction, isDangerous = true }) {
    confirmModalProps = {
      title,
      message,
      confirmText,
      cancelText,
      confirmClasses: isDangerous ? 'btn-danger' : 'btn-primary',
      onConfirm: async () => { // Make the wrapper async
        confirmModalProps.isLoading = true;
        try {
          await onConfirmAction(); // Execute the actual async action
        } catch (e) {
          console.error("Error during confirmed action:", e);
          // Optionally show a generic error toast here if the action itself doesn't
        } finally {
          confirmModalProps.isLoading = false;
          showConfirmModal = false; // Close modal after action or error
        }
      },
      onCancel: () => { showConfirmModal = false; confirmModalProps.isLoading = false; },
      isLoading: false,
    };
    showConfirmModal = true;
  }

  // --- Navigation & Modal Control ---
  function handleNavigate(event) {
    const screenName = event.detail;
    if (['home', 'calendar', 'baonlist'].includes(screenName)) {
      currentScreen = screenName;
      localStorage.setItem("lastScreen", screenName);
      closeAllModals();
      closeSideMenu();
    } else {
      console.warn("Invalid screen name for navigation:", screenName);
    }
  }

  function toggleSideMenu() { sideMenuVisible = !sideMenuVisible; }
  function closeSideMenu() { sideMenuVisible = false; }

  function closeAllModals() {
    favoritesVisible = false;
    settingsVisible = false;
    showRecipeSheet = false;
    achievementsVisible = false;
    manageBaonVisible = false;
    // showBaonForm is controlled by its own open/close handlers
  }

  function openRecipeSheet(meal) {
    selectedRecipeMeal = meal;
    showRecipeSheet = true;
  }
  function closeRecipeSheet() {
    showRecipeSheet = false;
    selectedRecipeMeal = null;
  }

  function toggleFavorites() { favoritesVisible = !favoritesVisible; }
  function openSettings() { settingsVisible = true; }
  function openAchievements() { closeAllModals(); achievementsVisible = true; }
  function closeAchievements() { achievementsVisible = false; }
  function openManageBaon() { closeAllModals(); manageBaonVisible = true; }
  function closeManageBaon() { manageBaonVisible = false; }

  async function refreshAppFavorites() {
    console.log("[App] Refreshing app favorites...");
    try {
      const favoriteMealIds = await getFavorites(); // Returns array of IDs
      const allCurrentMeals = getStoreValue(allMealsStore);

      if (favoriteMealIds && Array.isArray(favoriteMealIds) && allCurrentMeals && Array.isArray(allCurrentMeals)) {
        favoriteNames = favoriteMealIds
          .map(id => {
            const foundMeal = allCurrentMeals.find(m => m.id === id);
            return foundMeal ? foundMeal.name : null;
          })
          .filter(Boolean);
        console.log("[App] Updated favoriteNames:", favoriteNames);
      } else {
        console.warn("[App] Could not derive favorite names. fav IDs:", favoriteMealIds, "all meals count:", allCurrentMeals?.length);
        favoriteNames = [];
      }
      console.log("[App] Updated favoriteNames:", favoriteNames);

      if (favoritesVisible && favoritesRef?.refresh) {
        favoritesRef.refresh(); // If FavoritesModal has a sync refresh method
      }

      await checkAndUnlockAchievements();
    } catch (error) {
        console.error("[App] Error refreshing app favorites:", error);
        favoriteNames = []; // Fallback
    }
  }

  // --- Music Control ---
  function playMusic() {
    console.log(`[App] Attempting playMusic. musicEnabled: ${musicEnabled}, appIsActive: ${appIsActive}, audio object:`, audio);
    if (audio && !audio.paused) { console.log("[App] Music already playing."); return; }
    if (audio && musicEnabled && appIsActive) {
        console.log("[App] Conditions met. Calling audio.play()...");
        audio.play()
            .then(() => console.log("[App] Music playback started."))
            .catch(e => console.error("[App] Music play() failed:", e));
    } else {
        console.log("[App] Conditions not met for playing music.");
    }
  }
  function pauseMusic() {
    if (audio && !audio.paused) {
      audio.pause();
    }
  }
  function toggleMusic() {
    musicEnabled = localStorage.getItem("musicEnabled") === "true"; // Re-read from LS
    musicShouldPlay = musicEnabled;
    if (musicEnabled && appIsActive) {
      playMusic();
    } else {
      pauseMusic();
    }
  }

  // --- BaonForm Handling ---
  function openAddBaonForm() {
    closeAllModals();
    baonFormInitialData = null;
    currentBaonFormMode = 'add';
    showBaonForm = true;
  }

  function handleRequestOpenAddForm() { // From SideMenu
    openAddBaonForm();
  }

  function handleEditBaonRequest(event) { // From BaonCard (Home, BaonList)
    const mealFromCard = event.detail;
    if (!mealFromCard) {
      showToast("Error: No meal data to edit.", "error");
      return;
    }
    closeAllModals();
    baonFormInitialData = JSON.parse(JSON.stringify(mealFromCard)); // Deep copy
    currentBaonFormMode = 'edit';
    showBaonForm = true;
  }

  async function handleSaveBaonFromForm(event) {
    const formDataFromBaonForm = event.detail;
    let success = false;

    try {
      if (currentBaonFormMode === 'add') {
        success = await addMeal(formDataFromBaonForm);
      } else if (currentBaonFormMode === 'edit') {
        if (!baonFormInitialData || !baonFormInitialData.id) {
          showToast("Save error: Edit context lost.", "error");
          return;
        }
        const originalId = baonFormInitialData.id;
        const wasDefault = baonFormInitialData.isUserDefined === false || originalId.startsWith('default_');

        if (wasDefault) {
          const newUserMeal = {
            ...formDataFromBaonForm,
            id: `user_mod_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            isUserDefined: true,
            originalDefaultId: originalId
          };
          if (await addMeal(newUserMeal)) {
            await deleteMeal(originalId);
            success = true;
          }
        } else {
          const mealToUpdate = {
            ...formDataFromBaonForm,
            id: originalId,
            isUserDefined: true,
            originalDefaultId: formDataFromBaonForm.originalDefaultId || baonFormInitialData.originalDefaultId || null
          };
          success = await updateMeal(mealToUpdate);
        }
      }
    } catch (error) {
      console.error("[App] Error during save/update operation:", error);
      showToast("An unexpected error occurred while saving.", "error");
      success = false;
    }

    if (success) {
      showBaonForm = false;
      baonFormInitialData = null;
      await refreshAppFavorites(); // Refresh favorites list which might impact UI
      // The $allMeals store is updated directly by saveAllMeals in storage.js
    }
    // If not success, form remains open. Toasts for specific errors (like name collision)
    // are handled within addMeal/updateMeal.
  }

  function handleCancelBaonForm() {
    showBaonForm = false;
    baonFormInitialData = null;
  }

  async function confirmAndDeleteBaon(mealId, mealName) {
    requestConfirmation({
      title: 'Delete Baon?',
      message: `Are you sure you want to delete "<strong>${mealName}</strong>"?<br>This will also remove it from all planned calendar days. This action cannot be undone.`,
      confirmText: 'Delete',
      onConfirmAction: async () => { // This is the actual async work
        const success = await deleteMeal(mealId);
        if (success) {
          await refreshAppFavorites(); // Refresh relevant app state
        } else {
          // showToast(`Could not delete "${mealName}".`, "error");
        }
        // No need to close modal here, onConfirm wrapper does it.
      }
    });
  }

  async function handleRequestDeleteBaon(event) { // This comes from Home/BaonList
    const mealIdToDelete = event.detail;
    if (!mealIdToDelete) return;
    const allCurrentMeals = getStoreValue(allMealsStore);
    const meal = allCurrentMeals.find(m => m.id === mealIdToDelete);
    const mealName = meal ? meal.name : "this Baon";
    
    await confirmAndDeleteBaon(mealIdToDelete, mealName); // Call new confirm function
  }

  async function handleRequestClearFavorites() {
    requestConfirmation({
      title: 'Clear All Favorites?',
      message: 'Are you sure you want to remove all Baon from your favorites list? This cannot be undone.',
      confirmText: 'Clear All',
      onConfirmAction: async () => {
        await clearFavorites(); // from storage.js
        // refreshAppFavorites is already called by the on:faveChange from SettingsModal
        // but if clearFavorites itself doesn't trigger an update path for favoriteNames, call it here:
        await refreshAppFavorites(); 
        // Toast is handled by storage.js::clearFavorites
      }
    });
  }
  
  // --- Example Usage: Resetting App (called from SettingsModal) ---
  // SettingsModal would dispatch 'requestResetApp'
  // App.svelte: on:requestResetApp={handleRequestResetApp}
  async function handleRequestResetApp() {
    requestConfirmation({
      title: 'Reset App Data?',
      message: '<strong>DANGER ZONE!</strong><br>Are you absolutely sure you want to reset the entire app? All your Baon, calendar plans, favorites, and settings will be permanently deleted.',
      confirmText: 'Yes, Reset App',
      confirmClasses: 'btn-danger reset-app-btn', // Add custom class for more specific styling if needed
      onConfirmAction: async () => {
        await resetStorage(); // from storage.js
        // resetStorage shows its own toast and might reload the page.
        // If not reloading, you might need to re-initialize app state here.
        // For a full reset, a page reload is often best:
        setTimeout(() => window.location.reload(), 1000);
      }
    });
  }

  // --- Lifecycle & Platform Setup ---
  let appStateListener = null;

  onMount(async () => {
    console.log("[App] onMount: Starting initialization...");

    // 1. Initialize core storage: handles migrations, default meals to FS.
    await initializeAppStorageAndMeals(CURRENT_APP_VERSION);

    // 2. Load data from Filesystem into Svelte stores.
    await loadMealsIntoStoreFromFS(); // Populates $allMeals
    await initializeCalendarStore();  // Populates $calendarData

    // 3. Populate UI-dependent data like favoriteNames.
    await refreshAppFavorites();

    // 4. Capacitor Platform Specific Setup
    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
      } catch (e) { console.error('Error configuring StatusBar:', e); }

      if (Capacitor.isPluginAvailable('SafeArea')) {
        try {
          const safeAreaData = await SafeArea.getSafeAreaInsets();
          const { insets } = safeAreaData;
          document.documentElement.style.setProperty('--custom-safe-area-top', `${insets.top}px`);
          document.documentElement.style.setProperty('--custom-safe-area-right', `${insets.right}px`);
          document.documentElement.style.setProperty('--custom-safe-area-bottom', `${insets.bottom}px`);
          document.documentElement.style.setProperty('--custom-safe-area-left', `${insets.left}px`);

          SafeArea.addListener('safeAreaChanged', (changedData) => {
            const { insets: newInsets } = changedData;
            document.documentElement.style.setProperty('--custom-safe-area-top', `${newInsets.top}px`);
            document.documentElement.style.setProperty('--custom-safe-area-right', `${newInsets.right}px`);
            document.documentElement.style.setProperty('--custom-safe-area-bottom', `${newInsets.bottom}px`);
            document.documentElement.style.setProperty('--custom-safe-area-left', `${newInsets.left}px`);
          });
        } catch (e) { console.error("Error with SafeArea plugin:", e); }
      } else {
        console.warn("SafeArea plugin not available.");
      }
    } else {
      console.log("Not a native platform. Skipping some native-specific setup.");
    }
    
    // 5. Other initializations
    incrementCounter("baonAppOpens"); // Assuming this uses localStorage and is quick
    await checkAndUnlockAchievements();

    // --- Preloader ---
    const preloader = document.getElementById('preloader');
    if (preloader) {
      setTimeout(() => {
        if (preloader) {
          preloader.style.transition = 'opacity 0.8s ease';
          preloader.style.opacity = '0';
          setTimeout(() => preloader.remove(), 800);
        }
      }, 500);
    }

    // --- Audio ---
    try {
      audio = new Audio("/music/InVain.mp3"); // Path relative to public folder
      audio.loop = true; audio.volume = 0.8;
      musicShouldPlay = musicEnabled; // musicEnabled is from localStorage
      if (musicShouldPlay && appIsActive) playMusic(); // playMusic checks musicEnabled and appIsActive again
    } catch (err) { console.error("Audio init error:", err); }

    // --- App State Listener ---
    if (Capacitor.isPluginAvailable('App')) {
      appStateListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        appIsActive = isActive;
        if (isActive && musicShouldPlay) playMusic();
        else if (!isActive) pauseMusic();
      });
    }
    console.log("[App] onMount: Initialization finished.");
  });

  onDestroy(() => {
    if (appStateListener) appStateListener.remove();
    if (audio) {
      audio.pause();
      audio.src = ''; // Release audio resource
      audio = null;
    }
    // Remove other listeners if any were added directly to window/document
  });
</script>

<div class="app-container">
  <div class="topbar-wrapper">
    <Topbar />
  </div>

  <main class="main-content-area"> 
    {#key currentScreen}
      <div class="screen-transition-wrapper" transition:fade={{ duration: 200 }}>
        {#if currentScreen === 'home'}
          <Home 
            on:viewRecipe={(e) => openRecipeSheet(e.detail)} 
            on:editBaon={handleEditBaonRequest}
            {favoriteNames}
            on:requestFavoriteRefresh={refreshAppFavorites} 
            on:requestDeleteBaon={handleRequestDeleteBaon}
          />
        {:else if currentScreen === 'calendar'}
          <Calendar />
        {:else if currentScreen === 'baonlist'}
          <BaonList
            on:editBaon={handleEditBaonRequest}
            on:viewRecipe={(e) => openRecipeSheet(e.detail)}
            {favoriteNames}
            on:requestFavoriteRefresh={refreshAppFavorites}
            on:requestDeleteBaon={handleRequestDeleteBaon}
          />
        {/if}
      </div>
    {/key}
  </main>

  <Navbar 
    on:navigate={handleNavigate} 
    on:toggleMenu={toggleSideMenu}
    current={currentScreen} 
  />
</div>

<Toast />

<!-- Modals and Sheets -->
<SideMenu
  visible={sideMenuVisible}
  on:close={closeSideMenu} 
  on:navigate={handleNavigate}
  on:toggleFavorites={toggleFavorites}
  on:openSettings={openSettings}
  on:openManageBaon={openManageBaon}
  on:openAchievements={openAchievements}
  on:requestOpenAddForm={handleRequestOpenAddForm}
/>

<FavoritesModal
  bind:this={favoritesRef}
  visible={favoritesVisible}
  on:faveChange={refreshAppFavorites} 
  on:close={() => favoritesVisible = false}
  on:viewRecipe={(e) => openRecipeSheet(e.detail)} 
/>

<SettingsModal
  visible={settingsVisible}
  on:close={() => settingsVisible = false}
  on:faveChange={refreshAppFavorites}
  on:toggleMusic={toggleMusic}
  on:openAchievements={openAchievements}
  on:requestClearFavorites={handleRequestClearFavorites} 
  on:requestResetApp={handleRequestResetApp}
/>

<RecipeSheet
  visible={showRecipeSheet}
  meal={selectedRecipeMeal}
  on:close={closeRecipeSheet}
/>

{#if achievementsVisible}
  <div class="achievements-overlay" transition:fade={{ duration: 250 }}>
    <AchievementScreen on:close={closeAchievements} />
  </div>
{/if}

{#if manageBaonVisible}
  <div class="manage-baon-overlay" transition:fade={{duration: 250}}>
    <ManageBaonScreen 
      on:close={closeManageBaon} 
      on:userMealsChanged={refreshAppFavorites} 
    />
  </div>
{/if}

<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if showBaonForm}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="form-modal-backdrop" on:click|self={handleCancelBaonForm} transition:fade>
    <div class="form-wrapper" transition:fly={{y: 30, duration: 250, easing: quintOut }}>
      <BaonForm
        formMode={currentBaonFormMode} 
        initialData={baonFormInitialData}
        on:save={handleSaveBaonFromForm}
        on:cancel={handleCancelBaonForm}
      />
    </div>
  </div>
{/if}

<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if showConfirmModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="confirm-modal-backdrop"
    on:click|self={confirmModalProps.onCancel}
    transition:fade={{ duration: 200 }}
  >
    <div
      class="confirm-modal"
      role="alertdialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      in:fly={{ 
        y: 50,               
        duration: 350,        
        opacity: 0,           
        easing: quintOut      
      }}
      out:fly={{ 
        y: 50,                
        duration: 250,        
        opacity: 0,           
        easing: quintIn       
      }}
    >
      <ConfirmationModal
        visible={showConfirmModal}
        title={confirmModalProps.title}
        message={confirmModalProps.message}
        confirmText={confirmModalProps.confirmText}
        cancelText={confirmModalProps.cancelText}
        confirmClasses={confirmModalProps.confirmClasses}
        isLoading={confirmModalProps.isLoading}
        on:confirm={confirmModalProps.onConfirm}
        on:cancel={confirmModalProps.onCancel}
      />
    </div>
  </div>
{/if}

<style>
  .app-container {
    height: 100vh; /* Or 100dvh for dynamic viewport height */
    width: 100vw;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background-color: #1a163f;
    padding-bottom: calc(60px + var(--custom-safe-area-bottom, env(safe-area-inset-bottom, 0px)));
    box-sizing: border-box;
  }

  .topbar-wrapper {
    position: fixed; /* Or sticky, depending on desired scroll behavior with main content */
    top: 0;
    left: 0;
    width: 100%;
    z-index: 990;
    flex-shrink: 0;
    height: 68px; /* Adjust to actual Topbar height */
    background-color: #231d52; /* Or Topbar's actual background */
    /* Add padding-top for safe area if Topbar is transparent or overlays status bar */
    padding-top: var(--custom-safe-area-top, env(safe-area-inset-top, 0px));
    box-sizing: content-box; /* If height is fixed and padding-top adds to it */
  }
  /* If Topbar height should include safe-area padding: */
  /* .topbar-wrapper { height: calc(68px + var(--custom-safe-area-top, env(safe-area-inset-top, 0px))); } */

  .confirm-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(10, 8, 30, 0.75); /* Slightly darker for more focus */
    backdrop-filter: blur(4px);
    z-index: 10050; /* Higher than other modals if it can appear on top */
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
  }

  .confirm-modal {
    background: #2c2663; /* Theme background */
    color: #fff5e1;
    padding: 1.5rem 2rem; /* More padding */
    border-radius: 12px;
    width: 100%;
    max-width: 380px; /* Control max width */
    box-shadow: 0 8px 30px rgba(0,0,0,0.35);
    border: 1px solid #4a4090;
    text-align: center; /* Center text content */
  }

  .main-content-area {
    flex-grow: 1;
    overflow: hidden; /* Important for child absolute positioning and transitions */
    position: relative; /* For screen-transition-wrapper */
    /* Adjust margin-top to be Topbar's effective height */
    margin-top: calc(68px + var(--custom-safe-area-top, env(safe-area-inset-top, 0px)));
    /* margin-bottom is handled by app-container's padding-bottom for the Navbar */
  }

  .screen-transition-wrapper {
    position: absolute;
    inset: 0;
    overflow: hidden; 
    display: flex; 
  }

  .screen-transition-wrapper > :global(*) {
    flex-grow: 1;
    width: 100%;
    height: 100%; /* Ensure screens fill the wrapper */
    overflow-y: auto; /* Allow individual screens to scroll if their content exceeds viewport */
    -webkit-overflow-scrolling: touch;
  }

  .form-modal-backdrop {
    position: fixed; inset: 0;
    background-color: rgba(10, 8, 30, 0.7);
    backdrop-filter: blur(4px);
    z-index: 10010;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem; /* Provides some space around the form on small screens */
    box-sizing: border-box;
  }
  .form-wrapper {
    width: 100%;
    max-width: 450px;
    max-height: 90vh; /* Can be 90dvh for dynamic viewport */
    /* BaonForm itself will handle its internal scrolling due to its grid layout */
    /* overflow-y: auto; No need here if BaonForm is designed to scroll internally */
  }
  
  /* Overlay styles for other modals */
  .achievements-overlay, .manage-baon-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background-color: rgba(10, 8, 30, 0.5); 
    backdrop-filter: blur(3px);
    display: flex; 
    /* Let the child screen component handle its own padding and safe areas */
    /* padding-top: var(--custom-safe-area-top, env(safe-area-inset-top, 0px)); */
    /* padding-bottom: var(--custom-safe-area-bottom, env(safe-area-inset-bottom, 0px)); */
    box-sizing: border-box; 
    overflow: hidden; 
  }
  .achievements-overlay > :global(*), .manage-baon-overlay > :global(*) {
    width: 100%; 
    height: 100%;
    /* The screen components (AchievementScreen, ManageBaonScreen) should handle their own internal scrolling and padding */
  }
</style>