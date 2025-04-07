<script>
  import BaonCard from './components/BaonCard.svelte';
  import Navbar from './components/Navbar.svelte';
  import TalaQuote from './components/TalaQuote.svelte';
  import { meals } from "./lib/meals.js";
  import { getRandomMeals } from "./lib/utils";
  import { saveFavorite, isFavorite, removeFavorite } from './lib/storage';

  let suggestedMeals = [];

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

  {each suggestedMeals as meal (meal.name)}
  <BaonCard {meal} />
  {/each}
</main>

<Navbar />

<style lang="css">
  
</style>
