<script>
  import { createEventDispatcher, onMount } from 'svelte';
  // Assuming settingsStore.js handles notification settings specifically
  // If these are in storage.js, adjust the import path.
  import { getNotificationSettings, saveNotificationSettings } from '../lib/settingsStore.js';
  import { getCounter } from '../lib/storage.js'; // For fun stats
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { showToast } from '../lib/toast.js';
  import BaonBuddySettings from "/titles/BaonBuddySettings.png";
  import AchievementsIcon from "../assets/AchievementsIcon.svelte";

  const dispatch = createEventDispatcher();

  export let visible = false;

  // --- State for Tabs ---
  let activeTab = 'general';

  // --- State for Settings ---
  let timesOpened = 0;
  let timesGenerated = 0;
  
  // musicEnabled will be initialized based on localStorage when the modal becomes visible
  let musicEnabled = false; 
  
  let notificationSettings = {
    dayBeforeEnabled: false,
    dayBeforeTime: '20:00',
    dayOfEnabled: true,
    dayOfTime: '08:00'
  };

  function loadAndSyncSettings() {
    // Sync music setting
    musicEnabled = localStorage.getItem("musicEnabled") === "true";
    
    // Load notification settings
    notificationSettings = getNotificationSettings();

    // Load stats
    timesOpened = getCounter("baonAppOpens");
    timesGenerated = getCounter("baonMealGenerations");
    console.log("[SettingsModal] Settings loaded/synced. Music:", musicEnabled);
  }

  // Load settings when the component is first mounted AND visible,
  // OR when it becomes visible again.
  onMount(() => {
    if (visible) {
      loadAndSyncSettings();
    }
  });

  // This reactive statement handles the case where the modal might be re-used
  // and `visible` prop changes from false to true.
  let wasVisible = false;
  $: if (visible && !wasVisible) { // Became visible
    loadAndSyncSettings();
    wasVisible = true;
  } else if (!visible && wasVisible) { // Became hidden
    wasVisible = false;
  }


  // --- General Settings Handlers ---
  function handleMusicToggle() {
    // The `bind:checked={musicEnabled}` on the input means `musicEnabled`
    // is already updated to the new state by Svelte when this function is called.
    console.log("[SettingsModal] Music toggle changed by user. New state for musicEnabled:", musicEnabled);
    
    // 1. Save the new state to localStorage
    localStorage.setItem("musicEnabled", musicEnabled.toString());
    
    // 2. Dispatch event to App.svelte so it can react (e.g., play/pause audio)
    dispatch("toggleMusic"); 
    // App.svelte's toggleMusic handler should also read from localStorage to get the definitive state.
  }

  function requestClearFaves() {
    dispatch("requestClearFavorites");
  }

  function requestResetApp() {
    dispatch("requestResetApp");
  }

  // --- Notification Settings Handlers ---
  function handleNotificationSettingsChange() {
    // `notificationSettings` is already up-to-date due to `bind:checked` and `bind:value`
    saveNotificationSettings(notificationSettings);
    dispatch('notificationSettingsChanged');
    showToast("Reminder settings saved!", "success");
  }

  function closeModal() {
    dispatch('close');
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
{#if visible}
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    class="modal-backdrop"
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 200 }}
    on:click|self={closeModal}
    role="dialog"
    aria-modal="true"
    aria-labelledby="settings-title-img"
  >
    <div
      class="modal"
      in:fly={{ y: 50, duration: 300, easing: quintOut }}
      out:fly={{ y: 50, duration: 250, easing: quintOut }}
    >
      <header class="modal-header">
        <button class="header-close-btn" on:click={closeModal} aria-label="Close Settings">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        <img src={BaonBuddySettings} alt="Settings" id="settings-title-img" class="settings-title-image">
      </header>

      <nav class="tabs-nav">
        <button 
          class="tab-btn" 
          class:active={activeTab === 'general'} 
          on:click={() => activeTab = 'general'}
          aria-pressed={activeTab === 'general'}
        >
          General
        </button>
        <button 
          class="tab-btn" 
          class:active={activeTab === 'notifications'} 
          on:click={() => activeTab = 'notifications'}
          aria-pressed={activeTab === 'notifications'}
        >
          Notifications
        </button>
      </nav>

      <div class="tab-content-wrapper">
        {#if activeTab === 'general'}
          <section class="settings-tab-content general-settings" transition:fade={{ duration: 150, delay: 50 }}>
            <div class="setting-group">
                <h4 class="setting-group-title">App Settings</h4>
                <section class="setting toggle-setting">
                    <label class="toggle" for="music-toggle-input">
                        <span class="toggle-label">{musicEnabled ? 'Music On 🎶' : 'Music Off 🔇'}</span>
                        <input
                            id="music-toggle-input"
                            type="checkbox"
                            bind:checked={musicEnabled}  
                            on:change={handleMusicToggle}
                        />
                        <span class="slider"></span>
                    </label>
                </section>

                <section class="setting link-setting">
                    <button class="setting-btn achievements-link" on:click={() => dispatch('openAchievements')}>
                       <span class="btn-icon"><AchievementsIcon /></span> View Achievements
                    </button>
                </section>
            </div>
            
            <div class="setting-group">
                <h4 class="setting-group-title">Data Management</h4>
                <section class="delete-actions">
                    <button class="setting-btn danger" on:click={requestClearFaves}>
                        <span class="btn-icon">🧹</span> Clear Favorites
                    </button>
                    <button class="setting-btn danger reset" on:click={requestResetApp}>
                        <span class="btn-icon">♻️</span> Reset App
                    </button>
                </section>
            </div>
          </section>
        {/if}

        {#if activeTab === 'notifications'}
          <section class="settings-tab-content notification-settings" transition:fade={{ duration: 150, delay: 50 }}>
            <div class="setting-group">
              <h4 class="setting-group-title">Baon Reminders ⏰</h4>
              <section class="setting notification-setting">
                <label class="toggle" for="daybefore-toggle-input">
                  <span class="toggle-label">Reminder for Tomorrow's Baon</span>
                  <input id="daybefore-toggle-input" type="checkbox" bind:checked={notificationSettings.dayBeforeEnabled} on:change={handleNotificationSettingsChange}/>
                  <span class="slider"></span>
                </label>
                {#if notificationSettings.dayBeforeEnabled}
                  <div class="time-input-wrapper" transition:fly={{ y: -10, duration: 200, easing: quintOut }}>
                    <input type="time" class="time-input" bind:value={notificationSettings.dayBeforeTime} on:change={handleNotificationSettingsChange}/>
                  </div>
                {/if}
              </section>
              <section class="setting notification-setting">
                <label class="toggle" for="dayof-toggle-input">
                  <span class="toggle-label">Reminder for Today's Baon</span>
                  <input id="dayof-toggle-input" type="checkbox" bind:checked={notificationSettings.dayOfEnabled} on:change={handleNotificationSettingsChange}/>
                  <span class="slider"></span>
                </label>
                {#if notificationSettings.dayOfEnabled}
                  <div class="time-input-wrapper" transition:fly={{ y: -10, duration: 200, easing: quintOut }}>
                    <input type="time" class="time-input" bind:value={notificationSettings.dayOfTime} on:change={handleNotificationSettingsChange}/>
                  </div>
                {/if}
              </section>
            </div>
            <p class="reminder-note">
                Reminders are updated when settings change. Ensure Baon Buddy has notification permissions in your device settings.
            </p>
          </section>
        {/if}
      </div>
      
      <section class="more-info">
        <div class="fun-stats">
          <span class="stat-item" title="Number of times the app has been opened.">
            <span class="stat-icon">🚀</span> {timesOpened} Opens
          </span>
          <span class="stat-item" title="Number of times meals have been generated.">
            <span class="stat-icon">🍲</span> {timesGenerated} Meals
          </span>
        </div>
      </section>
    </div>
  </div>
{/if}

<style>
    .visually-hidden { 
        position: absolute; 
        width: 1px; 
        height: 1px; 
        padding: 0; 
        margin: -1px;
        overflow: hidden; 
        clip: rect(0, 0, 0, 0); 
        white-space: nowrap; 
        border: 0;
    }

    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(10, 8, 30, 0.7);
        backdrop-filter: blur(4px);
        z-index: 10020; /* Ensure it's high enough */
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 1rem;
    }

    .modal {
        background: #231d52;
        color: #fff5e1;
        padding: 0; /* Padding will be applied to inner sections */
        border-radius: 1rem;
        width: 100%;
        max-width: 380px;
        height: 80vh; /* Limit height for viewport friendliness */
        box-shadow: 0 5px 25px rgba(0,0,0,0.4);
        border: 1px solid #4a4090;
        display: flex;
        flex-direction: column;
        overflow: hidden; /* Modal itself doesn't scroll; tab-content-wrapper does */
    }

    /* --- Modal Header --- */
    .modal-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        padding: 1rem 1.5rem 0.8rem 1.5rem; /* Inner padding for header content */
        border-bottom: 1px solid #4a4090;
        flex-shrink: 0; /* Prevent header from shrinking */
    }

    .header-close-btn {
        position: absolute;
        top: 8px;     /* Position inside padding */
        right: 8px;   /* Position inside padding */
        background: transparent;
        border: none;
        color: #fff5e1a8;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s ease, background-color 0.2s ease;
    }
    .header-close-btn:hover, 
    .header-close-btn:focus-visible {
        color: #fff;
        background-color: #4a409060;
        outline: none;
    }
    .header-close-btn svg { 
        width: 22px; 
        height: 22px; 
    }

    .settings-title-image {
        width: 100%;
        max-width: 180px; /* Or your preferred size */
        margin-top: 0.2rem; /* Space if close button is above */
        display: block;
    }

    /* --- Tab Navigation --- */
    .tabs-nav {
        display: flex;
        border-bottom: 1px solid #403870; /* Slightly different color for tab underline */
        flex-shrink: 0;
        background-color: #2c2663; /* Optional: slight bg difference for tab bar */
    }

    .tab-btn {
        flex-grow: 1;
        padding: 0.8rem 0.5rem;
        background-color: transparent;
        border: none;
        border-bottom: 3px solid transparent; /* Indicator line */
        color: #fff5e1a8; /* Inactive tab text */
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: color 0.2s ease, border-bottom-color 0.2s ease;
        text-align: center;
        border-radius: 0;
    }
    .tab-btn:hover {
        color: #fff5e1; /* Brighter on hover */
    }
    .tab-btn.active {
        color: #b388eb; /* Active tab text color */
        border-bottom-color: #b388eb; /* Active indicator line */
    }

    /* --- Tab Content --- */
    .tab-content-wrapper {
        flex-grow: 1; /* Takes available vertical space */
        position: relative;
        overflow-x: hidden;
        overflow-y: auto; /* Makes this area scrollable if content overflows */
        padding: 1.2rem 1.5rem; /* Padding for the content within the tabs */
        scrollbar-width: thin;
        scrollbar-color: #6a5acd #3a3375; /* Themed scrollbar */
    }
    .tab-content-wrapper::-webkit-scrollbar { width: 6px; }
    .tab-content-wrapper::-webkit-scrollbar-track { background: #3a3375; border-radius:3px; }
    .tab-content-wrapper::-webkit-scrollbar-thumb { background-color: #6a5acd; border-radius:3px;}

    .settings-tab-content { /* Container for each tab's specific settings */
        display: flex;
        flex-direction: column;
        gap: 1.5rem; /* Space between distinct setting groups */
        width: 100%;
    }

    /* --- Setting Groups & Individual Settings --- */
    .setting-group {
        /* No specific background/border, inherits from tab-content or modal */
        padding: 0; /* No extra padding if content is directly inside */
        display: flex;
        flex-direction: column;
        gap: 1rem; /* Space between individual settings within this group */
    }

    .setting-group-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: #b388eb; /* Accent color for group titles */
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 0.2rem 0;
        text-align: left;
        padding-bottom: 0.3rem;
        border-bottom: 1px dashed #4a4090; /* Dashed separator for titles */
    }

    .setting, /* General wrapper for a setting item */
    .toggle-setting,
    .link-setting {
        background-color: #2c2663; /* Background for individual setting items */
        padding: 0.8rem 1rem;
        border-radius: 0.75rem;
        border: 1px solid #4a4090;
    }

    /* Toggle Switch (Music, Notification Enables) */
    .toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        cursor: pointer;
        width: 100%;
    }
    .toggle input[type="checkbox"] { 
        display: none; /* Hide native checkbox */
    }
    .slider {
        width: 48px;
        height: 26px;
        background-color: #4a4090; /* "Off" state */
        border-radius: 999px;
        position: relative;
        transition: background-color 0.3s ease;
        flex-shrink: 0;
        border: 1px solid #6a5acd;
    }
    .slider::before {
        content: "";
        position: absolute;
        height: 18px;
        width: 18px;
        background: #fff5e1;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        border-radius: 50%;
        top: 3px;
        left: 3px;
        transition: transform 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
    }
    .toggle input[type="checkbox"]:checked + .slider {
        background-color: #b388eb; /* "On" state */
        border-color: #fff5e1;
    }
    .toggle input[type="checkbox"]:checked + .slider::before {
        transform: translateX(22px);
    }
    .toggle-label {
        font-weight: 500; /* Adjusted from 600 */
        color: #fff5e1;
        font-size: 0.95rem; /* Adjusted from 1rem */
        text-align: left;
        flex-grow: 1; /* Allow label to take space */
    }

    /* Notification Specific Time Inputs */
    .notification-setting .toggle { /* The label part of notification setting */
        margin-bottom: 0.3rem; /* Space if time input appears below */
    }
    .time-input-wrapper {
        margin-top: 0.6rem; /* Space above the time input field */
        width: auto; /* Let it be natural width or set max-width on input */
        display: flex; /* If you want to align anything next to it later */
    }
    .time-input {
        background-color: #1a163f;
        color: #fff5e1;
        border: 1px solid #4a4090;
        border-radius: 6px;
        padding: 0.5rem 0.7rem;
        font-size: 0.95rem;
        width: auto; /* Fit content */
        min-width: 100px; /* Ensure it's not too small */
    }
    .time-input:focus {
        outline: none;
        border-color: #b388eb;
        box-shadow: 0 0 0 2px rgba(179, 136, 235, 0.2);
    }

    /* General Button Styles (Achievements link, Danger buttons) */
    .setting-btn {
        padding: 0.7rem 1rem;
        border: none;
        border-radius: 0.6rem;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
    }
    .setting-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        filter: brightness(1.1);
    }
    .setting-btn:active:not(:disabled) {
        transform: translateY(0);
        filter: brightness(0.95);
    }
    .btn-icon { 
        font-size: 1.1em; /* Make icon slightly larger than text */
    }

    /* Achievements Link Button */
    .setting-btn.achievements-link {
        background-color: #2c2663; /* Match other setting items */
        color: #fff5e1;
        border: 1px solid #4a4090;
        width: 100%;
        box-shadow: none;
    }
    .setting-btn.achievements-link:hover {
        background-color: #3a3375;
        border-color: #6a5acd;
        filter: brightness(1.05);
    }
    .setting-btn.achievements-link .btn-icon :global(svg) { /* For SVG icons */
        width: 20px;
        height: 20px;
        stroke-width: 2; /* If using stroke-based SVGs */
        color: #b388eb; /* Accent color for icon */
    }

    /* Delete Actions Section & Danger Buttons */
    .delete-actions {
        display: grid;
        grid-template-columns: 1fr 1fr; /* Equal width buttons */
        gap: 0.8rem;
        margin-top: 0; /* No extra margin if it's the content of a setting-group */
    }
    .danger {
        background: #c0392b; /* Main danger red */
        color: white;
        box-shadow: 0 2px 5px rgba(192, 57, 43, 0.3);
    }
    .danger.reset { /* Specific style for Reset App button */
        background: transparent;
        border: 2px solid #c0392b;
        color: #e74c3c; /* Lighter red text */
        box-shadow: none;
    }
    .danger.reset:hover {
        background-color: rgba(192, 57, 43, 0.15); /* Subtle red hover */
        color: #c0392b; /* Darker red text on hover */
    }

    /* --- More Info / Footer Section --- */
    .more-info {
        background-color: #1a163f; /* Darkest background */
        padding: 1rem 1.5rem; /* Match tab content horizontal padding */
        border-top: 1px solid #403870; /* Separator */
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        flex-shrink: 0; /* Prevent shrinking */
    }
    .fun-stats {
        display: flex;
        justify-content: space-around; /* Evenly space stats */
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem; /* Space between stat items */
    }
    .stat-item {
        color: #fff5e1b3;
        font-weight: 500;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.3rem;
    }
    .stat-icon { 
        font-size: 1.1em; 
    }

    .reminder-note {
        font-size: 0.8rem;
        color: #fff5e199;
        text-align: left;
        margin-top: 0.5rem;
        padding: 0.5rem;
        background-color: rgba(0,0,0,0.1);
        border-radius: 4px;
        line-height: 1.4;
    }
</style>