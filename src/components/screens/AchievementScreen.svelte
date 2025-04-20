<script>
  import { createEventDispatcher } from 'svelte'; // Import dispatcher for close event
  import { achievements as achievementDefs } from '../../lib/achievementsData.js';
  import { unlockedAchievements } from '../../lib/achievementStore.js';
  import { fade, fly } from 'svelte/transition'; // Import transitions
  import { quintOut } from 'svelte/easing';    // Import easing
  import BaonBuddyAchievementsTitle from "/titles/BaonBuddyAchievements.png"; 

  const dispatch = createEventDispatcher();

  // No 'visible' prop needed if App.svelte controls rendering with #if
  // export let visible = false;

  let achievementsWithStatus = [];
  $: achievementsWithStatus = achievementDefs.map(def => ({
      ...def,
      unlocked: $unlockedAchievements.includes(def.id)
  })).sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      const indexA = achievementDefs.findIndex(d => d.id === a.id);
      const indexB = achievementDefs.findIndex(d => d.id === b.id);
      return indexA - indexB;
  });

  function closeModal() {
      dispatch('close'); // Dispatch close event to App.svelte
  }

</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- Add backdrop and modal structure like SettingsModal -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
    class="modal-backdrop"
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 200 }}
    on:click|self={closeModal}
    role="dialog"
    aria-modal="true"
    aria-labelledby="achievements-title-img"
>
    <div
        class="modal"
        in:fly={{ y: 50, duration: 300, easing: quintOut }}
        out:fly={{ y: 50, duration: 250, easing: quintOut }}
    >
        <header class="modal-header">
             <button class="header-close-btn" on:click={closeModal} aria-label="Close Achievements">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
            <!-- Use an achievements title image -->
            <img src={BaonBuddyAchievementsTitle} alt="Achievements" id="achievements-title-img" class="title-image">
        </header>

        <!-- Main content area for scrolling -->
        <div class="achievements-content">
            {#if achievementsWithStatus.length > 0}
                <div class="achievements-grid">
                    {#each achievementsWithStatus as achievement (achievement.id)}
                        {#if !achievement.secret || achievement.unlocked}
                            <div class="achievement-card" class:unlocked={achievement.unlocked} transition:fade|local={{duration: 200}}>
                                <div class="icon-wrapper">
                                    <span class="icon">{achievement.icon}</span>
                                </div>
                                <div class="details">
                                    <h3 class="name">{achievement.unlocked ? achievement.name : '?????'}</h3>
                                    <p class="description">{achievement.unlocked ? achievement.description : 'Keep exploring to unlock!'}</p>
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
            {:else}
                <p class="no-achievements">No achievements defined yet!</p>
            {/if}
        </div> <!-- End achievements-content -->

    </div> <!-- End modal -->
</div> <!-- End modal-backdrop -->


<style>
    /* --- Base Modal Styles (Copied/Adapted from SettingsModal) --- */
    .modal-backdrop {
        position: fixed; inset: 0;
        background: rgba(10, 8, 30, 0.7); backdrop-filter: blur(4px);
        z-index: 1000; /* Ensure it's above main content but potentially below other modals if needed */
        display: flex; justify-content: center; align-items: center;
        padding: 1rem;
    }

    .modal {
        background: #231d52; color: #fff5e1;
        padding: 1rem; /* Slightly less padding than settings */
        border-radius: 1rem; width: 100%;
        max-width: 420px; /* Can be wider than settings */
        max-height: 85vh; /* Limit height */
        box-shadow: 0 5px 25px rgba(0,0,0,0.4);
        border: 1px solid #4a4090;
        display: flex; flex-direction: column;
        gap: 1rem; /* Space between header and content */
    }

    .modal-header {
        display: flex; flex-direction: column; align-items: center;
        position: relative;
        padding-bottom: 0.5rem; /* Space below image */
        border-bottom: 1px solid #4a4090; /* Separator */
        flex-shrink: 0; /* Prevent header shrinking */
    }

    .header-close-btn {
        position: absolute; top: -5px; right: -5px; /* Adjust position */
        background: transparent; border: none; color: #fff5e1a8;
        cursor: pointer; padding: 0.5rem; margin: 0; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        transition: color 0.2s ease, background-color 0.2s ease;
    }
    .header-close-btn:hover, .header-close-btn:focus-visible {
        color: #fff; background-color: #4a409060; outline: none;
    }
    .header-close-btn svg { width: 22px; height: 22px; }

    .title-image { /* Renamed from settings-title-image */
        width: 100%; max-width: 220px; /* Adjust as needed */
        margin-top: 0.5rem; display: block;
    }

    /* --- Achievements Specific Styles --- */
    .achievements-content {
        flex-grow: 1; /* Allow content to take space */
        overflow-y: auto; /* Enable scrolling ONLY for the list */
        padding-right: 0.5rem; /* Space for scrollbar */
            margin-right: -0.5rem; /* Offset padding for visual alignment */
            scrollbar-width: thin;
            scrollbar-color: #6a5acd #3a3375; /* Themed scrollbar */
    }
    .achievements-content::-webkit-scrollbar { width: 6px; }
    .achievements-content::-webkit-scrollbar-track { background: #3a3375; border-radius: 3px;}
    .achievements-content::-webkit-scrollbar-thumb { background-color: #6a5acd; border-radius: 3px; }


    .achievements-grid {
        display: grid; grid-template-columns: 1fr; gap: 0.8rem; /* Slightly smaller gap */
        width: 100%;
        /* Max width removed, let modal control it */
    }

    .achievement-card {
        background-color: #2c2663; /* Matches settings toggle bg */
        border: 1px solid #4a4090; border-radius: 10px;
        padding: 0.8rem 1rem; /* Slightly less padding */
        display: flex; align-items: center; gap: 1rem;
        opacity: 0.65; filter: grayscale(70%);
        transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
        transform: scale(0.98);
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.15);
    }
    .achievement-card.unlocked {
        opacity: 1; filter: none; transform: scale(1);
        background-color: #3a3375; border-color: #6a5acd;
        box-shadow: 0 3px 8px rgba(0,0,0,0.2), 0 0 6px rgba(179, 136, 235, 0.1); /* subtle glow */
    }
    .icon-wrapper {
        font-size: 2.2rem; /* Slightly smaller icon */
        flex-shrink: 0; width: 50px; height: 50px; /* Smaller circle */
        display: flex; align-items: center; justify-content: center;
        background-color: #1a163f; border-radius: 50%;
        border: 1px solid #4a4090; filter: inherit;
        transition: background-color 0.3s ease;
    }
    .achievement-card.unlocked .icon-wrapper {
        background-color: #4a4090; border-color: #b388eb;
    }
    .icon { line-height: 1; filter: inherit; display: block; }
    .details { flex-grow: 1; min-width: 0; }
    .name {
        font-size: 1.05rem; /* Adjusted size */
        font-weight: 600; margin: 0 0 0.2rem 0; color: #fff5e1a8;
        transition: color 0.3s ease;
    }
     .achievement-card.unlocked .name { color: #fff; }
    .description {
        font-size: 0.85rem; /* Slightly smaller */
        color: #fff5e170; margin: 0; line-height: 1.4;
         transition: color 0.3s ease;
    }
    .achievement-card.unlocked .description { color: #fff5e1b3; }

    .no-achievements { /* Style remains */ }

    /* Problem Screen 1: Large/Tall Tablets */
    @media (min-width: 700px) and (min-height: 1000px) {
        .modal {
            max-width: none;
            width: 80vw;
            padding: 2rem 2rem;
        }

        .achievement-card {
            padding: 1rem 4rem;
        }

        .details {
            padding: 0 2.4rem;
        }

        .details .name, 
        .details .description {
            font-size: 1.4rem;
        }
        
        .icon-wrapper {
            transform: scale(1.6);
        }

        .modal-header {
            height: 80px;
        }
        .title-image, 
        .header-close-btn {
            transform:  scale(1.4);
        }
    }

    /* Problem Screen 2: Very Large/Tall Tablets */
    @media (min-width: 900px) and (min-height: 1300px) {
        .modal {
            max-width: none;
            width: 80vw;
            padding: 2rem 2rem;
        }

        .achievement-card {
            padding: 1rem 4rem;
        }

        .details {
            padding: 0 2rem;
        }

        .details .name, 
        .details .description {
            font-size: 2rem;
        }
        
        .icon-wrapper {
            transform: scale(2);
        }

        .modal-header {
            height: 100px;
        }
        .title-image, 
        .header-close-btn {
            transform:  scale(2);
        }
    }
</style>