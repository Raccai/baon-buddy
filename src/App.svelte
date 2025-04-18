<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { getFavorites } from './lib/storage';

  import Onboarding from './components/Onboarding.svelte';
  import Navbar from './components/Navbar.svelte';
  import Topbar from './components/Topbar.svelte';
  import FavoritesModal from './components/FavoritesModal.svelte';
  import SettingsModal from './components/SettingsModal.svelte';
  import RecipeSheet from './components/RecipeSheet.svelte';

  // Screens
  import Home from './components/screens/Home.svelte';
  import Calendar from './components/screens/Calendar.svelte';
  import BaonList from './components/screens/BaonList.svelte';

  let showOnboarding = localStorage.getItem("hasSeenOnboarding") !== "true";
  let currentScreen = localStorage.getItem("lastScreen") || 'home';

  function handleDone() {
    showOnboarding = false;
  }

  function handleNavigate(screen) {
    currentScreen = screen;
    localStorage.setItem("lastScreen", screen);
  }

  let selectedMeal = null;
  let favoriteNames = getFavorites().map(meal => meal.name);
  let suggestedMeals = [];
  let showRecipe = false;

  // Forda Recipes
  function closeRecipe() {
    showRecipe = false;
  }

  // Favorites and Settings functions
  let favoritesRef;
  let favoritesVisible = false;
  let settingsVisible = false;
  let audio;
  let musicEnabled = localStorage.getItem("musicEnabled") !== "false";
  function toggleFavorites() {
    favoritesVisible = !favoritesVisible;
    favoritesVisible ? favoritesRef.open() : favoritesRef.close();
  }
  function openSettings() {
    settingsVisible = true;
  }
  function toggleMusic() {
    musicEnabled = !musicEnabled;
    localStorage.setItem("musicEnabled", musicEnabled.toString());
    musicEnabled ? audio.play() : audio.pause();
  }

  onMount(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.opacity = '1';
      setTimeout(() => {
        preloader.style.transition = 'opacity 0.8s ease';
        preloader.style.opacity = '0';
        setTimeout(() => preloader.remove(), 800);
      }, 2000);
    }

    audio = new Audio("/music/InVain.mp3");
    audio.loop = true;
    audio.volume = 1;
    if (musicEnabled) {
      audio.play().catch(e => console.warn("Autoplay blocked:", e));
    }
  });
</script>

{#if showOnboarding}
  <div transition:fade={{ duration: 800 }}>
    <Onboarding on:done={handleDone} />
  </div>
{:else}
  <div class="app-container">
    <!-- Fixed topbar -->
    <div class="topbar-wrapper">
      <Topbar 
        onToggleFavorites={toggleFavorites} 
        onOpenSettings={openSettings} 
      />
    </div>
    
    <!-- Forda main screens -->
     {#key currentScreen}
      <div class="screen-wrapper" transition:fade={{ duration: 300 }}>
        {#if currentScreen === 'home'}
          <Home />
        {:else if currentScreen === 'calendar'}
          <Calendar />
        {:else if currentScreen === 'baonlist'}
          <BaonList />
        {/if}
      </div>    
    {/key}

    <!-- Fixed navbar -->
    <div class="navbar-wrapper">
      <Navbar onNavigate={handleNavigate} current={currentScreen} />
    </div>
  </div>
{/if}

<FavoritesModal 
  bind:this={favoritesRef} 
  on:faveChange={() => {
    favoriteNames = getFavorites().map(meal => meal.name);
  }}
  on:close={() => favoritesVisible = false} 
  on:selectMeal={(e) => {
    selectedMeal = e.detail;
    favoritesVisible = false;
    showRecipe = true;
  }}
/>

<SettingsModal 
  visible={settingsVisible} 
  on:close={() => settingsVisible = false} 
  on:faveChange={() => {
    favoriteNames = getFavorites().map(meal => meal.name);
    if (favoritesVisible && favoritesRef) favoritesRef.refresh();
  }}
  on:toggleMusic={toggleMusic}
/>

<RecipeSheet visible={showRecipe} meal={selectedMeal} on:close={closeRecipe} />

<style>
  .topbar-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    z-index: 990;
  }

  .screen-wrapper {
    padding-top: 68px; /* or the height of your Topbar */
    padding-bottom: 70px; /* make room for Navbar */
  }

  .navbar-wrapper {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100vw;
    z-index: 999;
  }
</style>
