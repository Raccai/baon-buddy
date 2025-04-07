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
  let suggestedMeals = [];

  function openFavorites() {
    favoritesRef.open();
  }

  function generateMeals() {
    suggestedMeals = [...meals]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
  }

  // generates meals on first load
  generateMeals();
</script>

<main>
  <h1 class="main-title">Baon Buddy</h1>
  <TalaQuote />

  {#each suggestedMeals as meal (meal.name)}
    <BaonCard {meal} {favoriteNames} on:faveChange={() => {
      favoriteNames = getFavorites().map(meal => meal.name);
    }} />
  {/each}

  <button on:click={openFavorites}>❤️ Favorites</button>
  <FavoritesModal 
    bind:this={favoritesRef} 
    on:faveChange = {() => {
      favoriteNames = getFavorites().map(meal => meal.name);
    }}
  />
</main>

<Navbar />

<style lang="css">
  
</style>
