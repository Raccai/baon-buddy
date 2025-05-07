<script>
  import BaonBuddyTitle from "/titles/BaonBuddyTitle.png";
</script>

<header class="topbar">
  <div class="image">
    <img src={BaonBuddyTitle} alt="Baon Buddy" class="app-title" />
  </div> 
</header>

<style>
  .topbar {
    position: fixed;
    top: 0; 
    left: 0; 
    right: 0;
    /* Base height for the content area */
    /* height: 68px; */
    height: calc(68px + env(safe-area-inset-top));
    background: #191337;
    color: #fff5e1; /* Changed default color */
    /* --- ADD Safe Area Padding --- */
    padding: 0 0.4rem; /* Keep horizontal */
    padding-top: env(safe-area-inset-top);
    padding-top: constant(safe-area-inset-top);
    /* --- Adjust height if background should fill safe area --- */
    /* height: calc(68px + env(safe-area-inset-top, 0px)); */
    /* If using calc for height, internal elements might need relative positioning */

    font-weight: bold;
    z-index: 990; /* Adjusted z-index */
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); /* Adjusted shadow */
    display: flex;
    justify-content: center;
    align-items: center; /* Vertically center content within the height */
    border-bottom: 1px solid #3a3375;
    box-sizing: border-box;
  }

  .image {
    display: flex;
    align-items: center;
  }

  .app-title {
    height: auto;
    width: auto;
    max-width: 90px;
    margin: 0;
    display: block;
  }

  @keyframes bounce {
    0%   { transform: scale(0.7); }
    50%  { transform: scale(0.9); }
    100% { transform: scale(0.7); }
  }

  /* Standard responsive media queries */
  @media (min-width: 600px) {
    .topbar {
        height: 85px; /* Base height for this breakpoint */
        /* height: calc(85px + env(safe-area-inset-top, 0px)); */ /* Optional calc */
        padding: 0 1.5rem;
        padding-top: calc(env(safe-area-inset-top, 0px) + 0.2rem);
    }
  }

  @media (min-width: 700px) and (min-height: 1000px) {
    .topbar {
      height: 90px;
    }

    .app-title {
      height: auto;
      width: auto;
      max-width: 140px;
      margin: 0;
    }
  }

  @media (min-width: 900px) and (min-height: 1300px) {
    .topbar {
      height: 140px;
    }

    .app-title {
      height: auto;
      width: auto;
      max-width: 200px;
      margin: 0;
    }
  }
</style>