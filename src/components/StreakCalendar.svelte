<script>
  import { 
    format, startOfMonth, 
    endOfMonth, eachDayOfInterval, 
    getDay, parseISO, 
    isWithinInterval, subDays, 
    isEqual, isToday 
  } from 'date-fns';
  import { streakStore } from '../lib/streakStore.js'; // Import the store
  import BaonBuddyStreak from "/titles/BaonBuddyStreak.png";

  export let displayMonth = new Date();

  // Initialize state with defaults
  let daysInMonth = [];
  let leadingBlanksCount = 0;
  let currentActionStreak = 0;
  let longestActionStreak = 0;
  let streakDaysInView = new Set();

  // --- Reactive block triggered by $streakStore OR displayMonth ---
  // This replaces loadDisplayData and the separate $: blocks
  $: {
      console.log("[StreakCal] Reactivity triggered. Month:", displayMonth, "StreakData:", $streakStore);
      if ($streakStore && displayMonth) { // Ensure both have values
          const currentStreakInfo = $streakStore;
          currentActionStreak = currentStreakInfo.currentStreak || 0;
          longestActionStreak = currentStreakInfo.longestStreak || 0;
          const lastActionDateStr = currentStreakInfo.lastActionDate;

          const start = startOfMonth(displayMonth);
          const end = endOfMonth(displayMonth);
          // Update daysInMonth and leadingBlanks only if displayMonth actually changed
          // (Could add optimization here later if needed)
          daysInMonth = eachDayOfInterval({ start, end });
          leadingBlanksCount = getDay(start);

          // Calculate streak days (same logic as before)
          const newStreakDays = new Set();
          if (currentActionStreak > 0 && lastActionDateStr) {
              try {
                  const lastDate = parseISO(lastActionDateStr);
                  if (isWithinInterval(lastDate, { start, end })) {
                      newStreakDays.add(lastActionDateStr);
                      for (let i = 1; i < currentActionStreak; i++) {
                          const streakDay = subDays(lastDate, i);
                          if (!isWithinInterval(streakDay, { start, end })) break;
                          newStreakDays.add(format(streakDay, 'yyyy-MM-dd'));
                      }
                  }
              } catch(e) { console.error("Error parsing lastActionDate:", e); }
          }
          streakDaysInView = newStreakDays; // Update the Set reactively
           console.log("[StreakCal] Updated streakDaysInView:", streakDaysInView);
      } else {
          // Reset if store or month is not ready
          daysInMonth = [];
          leadingBlanksCount = 0;
          currentActionStreak = 0;
          longestActionStreak = 0;
          streakDaysInView = new Set();
      }
  }
</script>

<div class="streak-calendar-wrapper">
  <img src={BaonBuddyStreak} alt="Baon Buddy Streak" class="baon-buddy-streak">
  <div class="streak-info-container">
      <div class="streak-stat current-streak">
          <span class="streak-icon">🔥</span>
          <span class="streak-value">{currentActionStreak}</span>
          <span class="streak-label">Current Streak</span>
      </div>
      <div class="streak-stat longest-streak">
          <span class="streak-icon">🏆</span>
          <span class="streak-value">{longestActionStreak}</span>
          <span class="streak-label">Longest Streak</span>
      </div>
  </div>

  <div class="mini-calendar-header">
    <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
  </div>
  
  {#if daysInMonth.length > 0}
    <div class="mini-calendar-grid">
      {#each Array(leadingBlanksCount) as _} <div class="mini-day blank"></div> {/each}
      {#each daysInMonth as day (format(day, 'yyyy-MM-dd'))}
        {@const dayKey = format(day, 'yyyy-MM-dd')}
        {@const isStreakDay = streakDaysInView.has(dayKey)} 
        {@const today = isToday(day)}
        <div
          class="mini-day"
          class:streak={isStreakDay} 
          class:today={today && !isStreakDay} 
          class:streak-today={isStreakDay && today} 
          title={ isStreakDay ? `Streak Day (${format(day, 'MMM d')})` : format(day, 'MMM d') }
        >
          <span>{format(day, 'd')}</span>
        </div>
      {/each}
    </div>
  {:else}
    <p class="loading-streak-cal">Loading streak calendar...</p>
  {/if}
</div>

<style>
  .streak-calendar-wrapper {
    margin-top: -1.8rem; /* More space from main calendar */
    margin-bottom: 12rem;
    padding: 1.2rem 1.5rem; /* Slightly more padding */
    background: #231d52; /* Slightly darker than settings, more "solid" */
    border-radius: 18px; /* More pronounced radius */
    border: 1px solid #4a4090;
    width: 100%; max-width: 440px; /* Slightly narrower than main cal */
    box-shadow: 0 8px 16px rgba(0,0,0,0.3); /* Deeper shadow */
  }

  .baon-buddy-streak {
    width: 160px;
    margin-bottom: 1rem;
  }

  .streak-info-container {
    display: flex; justify-content: space-between; /* Use space-between */
    align-items: stretch; margin-bottom: 1.5rem;
    gap: 1rem;
  }
  .streak-stat {
    background-color: #2c2663; /* Base from settings */
    padding: 0.7rem 0.5rem; /* Adjust padding for content */
    border-radius: 10px; text-align: center; color: #fff5e1;
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    border: 1px solid #4a4090;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.15);
  }
  .streak-icon { font-size: 1.6rem; margin-bottom: 0.3rem; line-height: 1; }
  .streak-value { font-size: 1.8rem; font-weight: 700; line-height: 1; color: #fff;}
  .streak-label {
    font-size: 0.65rem; color: #fff5e1b3; text-transform: uppercase;
    letter-spacing: 0.6px; margin-top: 0.3rem;
  }
  .current-streak .streak-icon, .current-streak .streak-value { color: #ffcc00; /* Gold-ish for current */ }
  .longest-streak .streak-icon, .longest-streak .streak-value { color: #b388eb; /* Purple for longest */ }


  .mini-calendar-header {
    display: grid; grid-template-columns: repeat(7, 1fr);
    text-align: center; font-size: 0.75rem; color: #fff5e1a8;
    margin-bottom: 0.6rem; padding: 0 4px; /* Align with grid gap */
  }
  .mini-calendar-header div { font-weight: 500; }

  .mini-calendar-grid {
    display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; /* Slightly larger gap */
  }
  .mini-day {
    aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; /* Larger day numbers */
    color: #fff5e1a8;
    background-color: #3a3375;
    border-radius: 50%; /* Make them circles */
    transition: all 0.25s ease-out;
    border: 1px solid #4a4090; /* Subtle border for all */
    cursor: default; /* Not interactive */
  }
  .mini-day span { line-height: 1; }
  .mini-day.blank { background-color: transparent; border-color: transparent; box-shadow: none; }

  .mini-day.streak {
    /* Style for days part of the CURRENT action streak */
    background-color: #ffcc00; /* Gold background for active streak */
    border-color: #e6b800;
    color: #3a3375; /* Darker text */
    font-weight: bold;
    box-shadow: 0 0 8px rgba(255, 204, 0, 0.6);
    transform: scale(1.05);
  }
  .mini-day.today {
    /* Style for today IF NOT part of the streak */
    background-color: transparent; color: #fff5e1; font-weight: bold;
    border: 1px solid #b388eb;
    box-shadow: 0 0 6px rgba(179, 136, 235, 0.4);
    /* Reset any potential transform */
    transform: scale(1);
   }
  .mini-day.streak-today {
    /* Optional: Special style if TODAY is also part of the streak */
    /* Often just inheriting .streak is fine, or add subtle indicator */
    border-color: #fff; /* White border for today + streak */
  }
  .loading-streak-cal {
    text-align: center;
    padding: 1rem;
    font-style: italic;
    color: #fff5e1a8;
  }
</style>