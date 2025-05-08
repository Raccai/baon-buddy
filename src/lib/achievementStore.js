import { writable } from 'svelte/store';
import { achievements as achievementDefs } from './achievementsData.js';
import { showToast } from './toast.js';

const UNLOCKED_KEY = 'baonUnlockedAchievements';
export const unlockedAchievements = writable(getUnlockedAchievements());

// Preload sound slightly after module load to avoid blocking initial paint
let achievementSound;
if (typeof window !== 'undefined') {
    setTimeout(() => {
        try {
            achievementSound = new Audio('/music/achievementUnlocked.mp3');
            achievementSound.volume = 0.7; // Adjust volume
            achievementSound.load(); // Attempt to load it
            console.log("Achievement sound loaded.");
        } catch(e) {
            console.error("Failed to load achievement sound:", e);
            achievementSound = null;
        }
    }, 500);
 }

// Function to get the list of unlocked achievement IDs
export function getUnlockedAchievements() {
    try {
        const stored = localStorage.getItem(UNLOCKED_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error getting unlocked achievements:", e);
        return [];
    }
}

// Function to save the unlocked list
function saveUnlockedAchievements(unlockedIds) {
    try {
        localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlockedIds));
        unlockedAchievements.set(unlockedIds); // Update the store
    } catch (e) {
        console.error("Error saving unlocked achievements:", e);
    }
}

// The core function to check and unlock achievements
// Call this *after* actions that might trigger an achievement
export function checkAndUnlockAchievements() {
    const currentlyUnlocked = getUnlockedAchievements();
    const newlyUnlocked = [];

    achievementDefs.forEach(achievement => {
        if (currentlyUnlocked.includes(achievement.id)) return;

        let isMet = false;
        try {
            // --- ALWAYS call the 'check' function from achievementsData.js ---
            if (typeof achievement.check === 'function') {
                isMet = achievement.check(); // The check function itself now accesses necessary data
            } else {
                console.warn(`Achievement "${achievement.name}" is missing a 'check' function.`);
            }
        } catch (e) {
            console.error(`Error checking achievement "${achievement.id}" (${achievement.name}):`, e);
        }

        if (isMet) {
            console.log(`Achievement Unlocked: ${achievement.name}`);
            newlyUnlocked.push(achievement.id);
            showToast(`Achievement Unlocked: ${achievement.name}`, 'achievement', 4000);

            // --- PLAY SOUND ---
            if (achievementSound) {
                achievementSound.currentTime = 0; // Rewind if playing
                achievementSound.play().catch(e => console.warn("Achievement sound play failed:", e));
            }
            // --- END PLAY SOUND ---
        }
    });

    if (newlyUnlocked.length > 0) {
        saveUnlockedAchievements([...currentlyUnlocked, ...newlyUnlocked]);
    }
}

// Optional: Reset function for testing
export function resetAchievements() {
    saveUnlockedAchievements([]);
    console.log("Unlocked achievements reset.");
}