<script>
  import BaonCard from './components/BaonCard.svelte';
  import Navbar from './components/Navbar.svelte';
  import TalaQuote from './components/TalaQuote.svelte';
  import { meals } from "./lib/meals.js";
  import { getRandomMeals } from "./lib/utils";
  import { saveFavorite, isFavorite, removeFavorite } from './lib/storage';
  import FavoritesModal from './components/FavoritesModal.svelte';
  import { getFavorites } from './lib/storage';

  let favoriteNames = getFavorites().map(meal => meal.name);
  let favoritesRef;
  let favoritesVisible = false;
  let suggestedMeals = [];

  function toggleFavorites() {
    if (favoritesVisible) {
      favoritesRef.close();
      favoritesVisible = false;
    } else {
      favoritesRef.open();
      favoritesVisible = true;
    }
  }

  function openSettings() {
    console.log("settings coming soon");
  }

  function generateMeals() {
    suggestedMeals = [...meals]
      .sort(() => 0.5 - Math.random())
      .slice(0, 1);
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
  
  {#each suggestedMeals as meal (meal.name)}
    <BaonCard {meal} {favoriteNames} on:faveChange={() => {
      favoriteNames = getFavorites().map(meal => meal.name);
    }} />
  {/each}
  
  <FavoritesModal 
  bind:this ={favoritesRef} 
    on:faveChange = {() => {
      favoriteNames = getFavorites().map(meal => meal.name);
    }}
    on:close = {() => favoritesVisible = false} 
    />
  <TalaQuote />
</main>

<Navbar 
  onGenerate = {generateMeals}
  onToggleFavorites = {toggleFavorites}
  onOpenSettings = {openSettings}
/>

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
</style>
