<script>
  import Sparkle from './assets/Sparkle.svelte';

  import BaonCard from './components/BaonCard.svelte';
  import Navbar from './components/Navbar.svelte';
  import TalaQuote from './components/TalaQuote.svelte';
  import { meals } from "./lib/meals.js";
  import { incrementCounter } from './lib/storage';
  import { onMount } from 'svelte';

  import FavoritesModal from './components/FavoritesModal.svelte';
  import { getFavorites } from './lib/storage';
  import SettingsModal from './components/SettingsModal.svelte';
  import Toast from './components/Toast.svelte';

  let favoriteNames = getFavorites().map(meal => meal.name);
  let favoritesRef;
  let favoritesVisible = false;
  let settingsVisible = false;
  let suggestedMeals = [];
  let bounce = false;
  let audio;
  let musicEnabled = localStorage.getItem("musicEnabled") !== "false";

  // Increment Counter on every App Launch
  onMount(() => {
    audio = new Audio("/UlilangKaluluwa.wav");
    audio.loop = true;
    audio.volume = 1;

    if (musicEnabled) {
      audio.play().catch(e => console.warn("Autoplay blocked:", e));
    }

    incrementCounter("baonAppOpens")
  })

  // Function to toggle
  // @ts-ignore
  function toggleMusic() {
    musicEnabled = !musicEnabled;
    // @ts-ignore
    localStorage.setItem("musicEnabled", musicEnabled);
    if (musicEnabled) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  // Toggle Favorites for Each Card
  function toggleFavorites() {
    if (favoritesVisible) {
      favoritesRef.close();
      favoritesVisible = false;
    } else {
      favoritesRef.open();
      favoritesVisible = true;
    }
  }

  // Open Settings Modal
  function openSettings() {
    settingsVisible = true;
  }

  // Generate Meal Cards
  function generateMeals() {
    suggestedMeals = [...meals]
      .sort(() => 0.5 - Math.random())
      .slice(0, 1);
    
    bounce = false; // reset first
    requestAnimationFrame(() => bounce = true); // allow reactive update
    incrementCounter("baonMealGenerations"); // Increments no. of times meals were generated
  }

  // generates meals on first load
  generateMeals();
</script>

<main>
  <header class="topbar">
    <h1 class="main-title">Baon Buddy</h1>
  </header>

  <div class="character-space">
    <!-- where Tala and Hanan will be (and future characters... maybe) -->
  </div>

  <div class="card-container">
    {#each suggestedMeals as meal (meal.name)}
      <BaonCard
        {meal} 
        {favoriteNames} 
        triggerBounce = {bounce}
        on:faveChange={() => {
          favoriteNames = getFavorites().map(meal => meal.name);
        }} 
      />
    {/each}
  </div>

  <FavoritesModal 
    bind:this = {favoritesRef} 
    on:faveChange = {() => {
      favoriteNames = getFavorites().map(meal => meal.name);
    }}
    on:close = {() => favoritesVisible = false} 
  />

  <!-- Will see if usable -->
  <TalaQuote />

  <!-- Stars (Animated) -->
  <div class="stars-bg">
    {#each Array(40) as _, i}
      <div class="circle-star"
        style="top: {Math.random() * 100}%; left: {Math.random() * 100}%; animation-delay: {Math.random() * 3}s;"></div>
    {/each}
  
    <!-- SVG Sparkles -->
    {#each Array(20) as _, i}
    <div
      class="sparkle-star"
      style="
        top: {Math.random() * 100}%;
        left: {Math.random() * 100}%;
        width: {14 + Math.random() * 12}px;
        height: {14 + Math.random() * 12}px;
        animation-delay: {Math.random() * 3}s;
      ">
      <Sparkle />
    </div>
    {/each}
  </div>

  <!-- Dust Particles (Animated) -->
  <div class="dust-layer">
    {#each Array(50) as _, i}
      <div class="dust" style="
        top: {Math.random() * 100}%;
        left: {Math.random() * 100}%;
        animation-delay: {Math.random() * 5}s;
        animation-duration: {5 + Math.random() * 10}s;
      "></div>
    {/each}
  </div>  

  <!-- Simple background flowy lines -->
  <div class="flow-lines-bg">
    <!-- Layer 1 -->
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="flow-svg" style="top: -250px;">
      <path
        d="M0,40 C25,20 75,60 100,40 L100,60 C75,80 25,20 0,60 Z"
        class="flow-fill"
      />
    </svg>
  
    <!-- Layer 2 -->
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="flow-svg" style="top: 20px;">
      <path
        d="M0,40 C40,20 70,70 100,40 L100,60 C20,80 70,50 0,60 Z"
        class="flow-fill"
      />
    </svg>
  
    <!-- Layer 3 -->
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="flow-svg" style="top: 340px;">
      <path
        d="M0,40 C20,15 80,65 100,40 L100,60 C70,85 30,15 0,60 Z"
        class="flow-fill"
      />
    </svg>
  </div>
</main>

<Navbar 
  onGenerate = {generateMeals}
  onToggleFavorites = {toggleFavorites}
  onOpenSettings = {openSettings}
/>

<SettingsModal 
  visible = {settingsVisible} 
  on:close = {() => settingsVisible = false} 
  on:faveChange = {() => {
    favoriteNames = getFavorites().map(meal => meal.name);
    if (favoritesVisible && favoritesRef) favoritesRef.refresh(); // refreshes favorites list if modal is open)
  }}
  on:toggleMusic = {toggleMusic}
/>

<Toast />

<style lang="css">
  main {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .topbar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 60px;
    background: #191337;
    color: #fff;
    padding: 0.25rem 0;
    text-align: center;
    font-size: 0.48rem;
    font-weight: bold;
    z-index: 9;
    box-shadow: 0 2px 40px rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    line-height: 60px;
  }

  .character-space {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: rgb(148, 52, 52);
    z-index: 0;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    pointer-events: none;
    opacity: 0;
  }

  /* Stars, Twinkling, and Clouds Styling */
  .stars-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
  }

  .circle-star {
    position: absolute;
    width: 4px;
    height: 4px;
    background: white;
    border-radius: 50%;
    opacity: 0.6;
    animation: twinkle 2s infinite ease-in-out;
    z-index: 3;
  }

  .sparkle-star {
    position: absolute;
    width: 20px;
    height: 20px;
    opacity: 0.7;
    animation: twinkle 3s infinite ease-in-out;
    z-index: 1;
  }

  @keyframes twinkle {
    0%, 100% {
      opacity: 0.3;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.3);
    }
  }

  /* BG flowy lines */
  .flow-lines-bg {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    opacity: 0.32;
  }

  .flow-lines-bg svg {
    width: 100%;
    height: 100%;
  }

  .flow-svg {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .flow-fill {
    fill: #231d52a9; /* very subtle white */
  }

  /* Dust Particles */
  .dust-layer {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .dust {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.08);
    animation: floatDust linear infinite;
  }

  @keyframes floatDust {
    0% { transform: translateX(0) translateY(0); opacity: 0.2; }
    50% { opacity: 0.6; }
    100% { transform: translateX(-100vw) translateY(-100vh); opacity: 0; }
  }

  /* Baon Card Container */
  .card-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    position: absolute;
    bottom: 140px;
    left: 0;
    right: 0;
    z-index: 5;
  }
</style>
