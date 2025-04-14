<script>
  import Loading from './components/Loading.svelte';
  import Main from './components/Main.svelte';
  import { fade } from 'svelte/transition';

  let isLoading = true;

  // Simulate a 2 second load
  setTimeout(() => {
    isLoading = false;
  }, 4000);
</script>

{#if isLoading}
  <div transition:fade = {{ duration: 500 }}>
    <Loading />
  </div>
{:else}
  <div transition:fade = {{ duration: 500 }}>
    <Main />
  </div>
{/if}

<style>

</style>
