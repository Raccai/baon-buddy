<script>
  import TunaSandwich from "/baon/TunaSandwich.png";
  import AppTitle from "/titles/BaonBuddyTitle.png";
  import Sparkle from '../assets/Sparkle.svelte';
</script>

<div class="loading-screen">
  <div class="floating-cont">
    <img src={TunaSandwich} alt="Tuna Sandwich" class="sandwich">
    <div class="shadow"></div>
  </div>
  
  <img src={AppTitle} alt="Baon Buddy" class="app-title">

  <!-- Stars (Animated) -->
  <div class="stars-bg">
    {#each Array(40) as _, i}
      <div class="circle-star"
        style="top: {Math.random() * 100}%; left: {Math.random() * 100}%; animation-delay: {Math.random() * 3}s;"></div>
    {/each}
  
    <!-- SVG Sparkles -->
    {#each Array(10) as _, i}
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
</div>

<style>
  .loading-screen {
    /* background: linear-gradient(135deg, #281e6e, #332A79, #673397); */
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  .floating-cont {
    position: relative;
    animation: float 2s ease-in-out infinite;
  }

  .sandwich {
    width: 120px;
    height: auto;
    z-index: 1;
  }

  .shadow {
    position: absolute;
    bottom: -15px;
    left: 25%;
    width: 60px;
    height: 12px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  .app-title {
    margin-top: 2rem;
    width: 100%;
    max-width: 200px;
    display: block;
  }

  @keyframes float {
    0% {transform: translateY(0)}
    50% {transform: translateY(-12px)}
    100% {transform: translateY(0)}
  }

  @keyframes pulse {
    0%, 100% {transform: scale(1.4); opacity: 0.4;}
    50% {transform: scale(1); opacity: 0.2;}
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
    background: rgba(255, 255, 255, 0.4);
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
</style>