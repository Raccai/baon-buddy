<script>
  import { fly, fade } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import Step1 from '/titles/Step1.png';
  import Step2 from '/titles/Step2.png';
  import Step3 from '/titles/Step3.png';
  import Step1NonTitle from '/onboarding/Step1NonTitle.png';
  import Step2NonTitle from '/onboarding/Step2NonTitle.png';
  import Step3NonTitle from '/onboarding/Step3NonTitle.png';
  import { cubicOut } from 'svelte/easing';

  const dispatch = createEventDispatcher();
  let currentStep = 0;

  const steps = [
    {
      img: Step1NonTitle,
      title: Step1,
      desc: 'Your daily lunch companion, powered by love, randomness, and Tala.'
    },
    {
      img: Step2NonTitle,
      title: Step2,
      desc: 'Find a random meal, save your faves, and get inspired when you don’t know what to eat.'
    },
    {
      img: Step3NonTitle,
      title: Step3,
      desc: 'Tala’s got your baon covered. Let’s start!'
    }
  ];

  function next() {
    if (currentStep < steps.length - 1) {
      currentStep++;
    } else {
      localStorage.setItem('hasSeenOnboarding', 'true');
      dispatch('done');
    }
  }

  function finishOnBoarding () {
    localStorage.setItem("hasSeenOnboarding", "true");
    dispatch("done");
  }
</script>

<section class="onboarding">
  {#each steps as step, i}
    {#if i === currentStep}
      <div 
        class="step" 
        in:fly = {{ x: 200, duration: 500 }}
        out:fly = {{ x: -200, duration: 400 }}
      >
        <img class="tala-img" src={step.img} alt={step.title} />
        <img class="step-title" src={step.title} alt={step.title}>
        <p>{step.desc}</p>
        <button on:click={next}>{currentStep === steps.length - 1 ? 'Start Eating!' : 'Next'}</button>
      </div>
    {/if}
  {/each}

  <!-- Stars (Animated) -->
  <div class="stars-bg">
    {#each Array(40) as _, i}
      <div class="circle-star"
        style="top: {Math.random() * 100}%; left: {Math.random() * 100}%; animation-delay: {Math.random() * 3}s;"></div>
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
</section>

<style>
  .onboarding {
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #281e6e, #332A79, #673397);
    color: #fff5e1;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    padding: 2rem;
    z-index: 9999;
  }

  .step {
    text-align: center;
    max-width: 300px;
    background: #fff5e1;
    color: #191337;
    border-radius: 2rem;
    padding: 2rem;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    z-index: 999;
  }

  .tala-img {
    width: 220px;
    height: auto;
    margin-bottom: 1.5rem;
  }

  .step-title {
    width: 180px;
    height: auto;
    margin-bottom: -0.8rem;
  }

  p {
    font-size: 1rem;
    margin-bottom: 2rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-weight: bold;
    color: #fff5e1;
    background: #191337;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  button:hover {
    background: #e0d7bf;
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

  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
</style>