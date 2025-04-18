<script>
  export let onNavigate;
  export let current;

  function handleNav(target) {
    if (onNavigate) onNavigate(target);
  }
</script>

<nav class="navbar">
  <button on:click={() => handleNav('home')} class:active={current === 'home'}>
    🏠
  </button>
  <button on:click={() => handleNav('calendar')} class:active={current === 'calendar'}>
    📅
  </button>
  <button on:click={() => handleNav('baonlist')} class:active={current === 'baonlist'}>
    🍱
  </button>
</nav>

<style>
  .navbar {
    position: fixed;
    bottom: 0;
    width: 100vw;
    background: #191337;
    display: flex;
    justify-content: space-around;
    padding: 1rem 0;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
    z-index: 999;
  }

  button {
    background: none;
    border: none;
    color: #fff5e1;
    font-size: 1.4rem;
    cursor: pointer;
  }

  .active {
    color: #ffd43b;
    font-weight: bold;
  }
</style>
