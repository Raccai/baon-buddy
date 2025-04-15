<script>
  import Main from './components/Main.svelte';
  import Onboarding from './components/Onboarding.svelte';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  let showOnboarding = localStorage.getItem("hasSeenOnboarding") !== "true";
  // let showOnboarding = true;

  onMount(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.opacity = '1';
      setTimeout(() => {
        preloader.style.transition = 'opacity 0.8s ease';
        preloader.style.opacity = '0';
        setTimeout(() => preloader.remove(), 800);
      }, 2000); // stays on screen for 1.5s before fading
    }
  });

  function handleDone() {
    showOnboarding = false;
  }
</script>

{#if showOnboarding}
  <div transition:fade = {{ duration: 800 }}>
    <Onboarding on:done = {handleDone} />
  </div>
{:else}
  <div transition:fade = {{ duration: 800 }}>
    <Main />
  </div>
{/if}

<style>

</style>