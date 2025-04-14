<script>
  import Main from './components/Main.svelte';
  import { onMount } from 'svelte';

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
</script>

<Main />

<style>

</style>