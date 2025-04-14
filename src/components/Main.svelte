<script>
  import Sparkle from '../assets/Sparkle.svelte';
  import Tala from "/characters/Tala.png";

  import BaonCard from './BaonCard.svelte';
  import Navbar from './Navbar.svelte';
  import TalaQuote from './TalaQuote.svelte';
  import SettingsModal from './SettingsModal.svelte';
  import Toast from './Toast.svelte';
  import FavoritesModal from './FavoritesModal.svelte';

  import { incrementCounter } from '../lib/storage';
  import { meals } from "../lib/meals.js";
  import { getFavorites } from '../lib/storage';
  
  import BaonBuddyTitle from "/titles/BaonBuddyTitle.png";
  import { onMount } from 'svelte';
  

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
    audio = new Audio("/music/UlilangKaluluwa.wav");
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
    <img src={BaonBuddyTitle} alt="Baon Buddy" class="app-title">
  </header>

  <!-- For characters -->
  <div class="character-space">
    <img src={Tala} alt="Tala" class="tala-floating">
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
    height: 68px; 
    background: #191337;
    color: #fff;
    padding: 0; 
    font-weight: bold;
    z-index: 9;
    box-shadow: 0 2px 40px rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .app-title {
    width: 100%;
    max-width: 100px;
    display: block;
    margin: 0; 
    margin-top: 4px;
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

  /* Tala character + animation */
  .character-space {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    z-index: 4;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    pointer-events: none;
    overflow: hidden;
  }

  .tala-floating {
    height: auto;
    max-height: 58vh; /* Reduced from 62vh */
    width: auto;
    max-width: 100%;
    animation: bob 3s ease-in-out infinite;
    pointer-events: none;
    user-select: none;
    position: absolute;
    bottom: 280px; /* Adjusted position */
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
    z-index: 10;
  }

  @keyframes bob {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-6px);
    }
  }

  /* Improved media queries for different device sizes */
  /* For tall screens (portrait orientation) */
  @media (min-aspect-ratio: 1/2) and (min-height: 700px) {
    .tala-floating {
      max-height: 50vh;
      bottom: 280px;
    }
  }

  /* For standard screens */
  @media (min-aspect-ratio: 2/3) {
    .tala-floating {
      max-height: 50vh;
      bottom: 250px;
    }
  }

  /* For wider screens */
  @media (min-aspect-ratio: 4/3) {
    .tala-floating {
      max-height: 45vh;
      bottom: 200px;
    }
  }

  /* For very wide screens */
  @media (min-aspect-ratio: 16/9) {
    .tala-floating {
      max-height: 30vh;
      bottom: 150px;
    }
  }

  /* Specific media queries for problem devices */
  /* iPhone SE and similar small devices */
  @media (max-height: 700px) and (max-width: 375px) {
    .tala-floating {
      max-height: 56vh;
      bottom: 160px;
    }
    
    .card-container {
      bottom: 120px;
    }
  }
  
  /* iPhone 12 Pro and similar devices */
  @media (min-height: 800px) and (max-height: 850px) and (max-width: 400px) {
    .tala-floating {
      max-height: 62vh;
      bottom: 220px;
    }
    
    .card-container {
      bottom: 130px;
    }
  }

  /* Samsung S8+ and similar devices */
  @media (max-height: 800px) and (max-width: 400px) {
    .tala-floating {
      max-height: 52vh;
      bottom: 220px;
    }
    
    .card-container {
      bottom: 130px;
    }
  }

  /* For short screens, regardless of width */
  @media (max-height: 600px) {
    .tala-floating {
      max-height: 30vh;
      bottom: 120px;
    }
    
    .card-container {
      bottom: 80px;
    }
  }

  @media (max-height: 500px) {
    .tala-floating {
      max-height: 25vh;
      bottom: 100px;
    }
    
    .card-container {
      bottom: 70px;
    }
  }

  /* For extremely short screens */
  @media (max-height: 400px) {
    .tala-floating {
      max-height: 20vh;
      bottom: 90px;
    }
    
    .card-container {
      bottom: 60px;
    }
  }

  /* For wide but short screens - addresses the specific issue mentioned */
  @media (max-height: 1400px) and (min-width: 800px) {
    .tala-floating {
      max-height: 68vh;
      bottom: 240px;
    }

    .topbar {
      height: fit-content;
    }

    .app-title {
      max-width: 200px;
    }
  }

  @media (max-height: 800px) and (min-width: 1280px) {
    .tala-floating {
      max-height: 54vh;
      bottom: 220px;
    }

    main {
      flex-direction: row;
    }
  }

  @media (max-height: 1400px) and (min-width: 900px) {
    .card-container {
      bottom: 160px;
    }
  }
</style>