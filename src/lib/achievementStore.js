const UNLOCKED_IDS_KEY = 'baonUnlockedAchievementIds';

import { get, writable } from 'svelte/store';
import { achievements as achievementDefs } from './achievementsData.js';
import { showToast } from './toast.js';

export const unlockedAchievements = writable(getUnlockedAchievementIds());
export const achievementsStore = writable(loadAchievements());

// Preload sound slightly after module load to avoid blocking initial paint
let achievementSound;
if (typeof window !== 'undefined') {
    setTimeout(() => {
        try {
            achievementSound = new Audio('/music/successToast.mp3');
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
export function getUnlockedAchievementIds() {
    try {
        const stored = localStorage.getItem(UNLOCKED_IDS_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(parsed) || !parsed.every(id => typeof id === 'string')) {
            // console.warn("[achievementStore] Data in UNLOCKED_IDS_KEY was not an array of strings. Resetting.");
            return [];
        }
        return parsed;
    } catch (e) {
        console.error("Error getting unlocked achievement IDs:", e);
        return [];
    }
}

// Function to save the unlocked list
function saveUnlockedAchievementIds(unlockedIdsArray) {
    try {
        if (!Array.isArray(unlockedIdsArray) || !unlockedIdsArray.every(id => typeof id === 'string')) {
            console.error("[achievementStore] Attempted to save non-array/non-string-array to UNLOCKED_IDS_KEY");
            return;
        }
        localStorage.setItem(UNLOCKED_IDS_KEY, JSON.stringify(unlockedIdsArray));
        unlockedAchievements.set(unlockedIdsArray); // Update the ID-only store
    } catch (e) {
        console.error("Error saving unlocked achievement IDs:", e);
    }
}

function loadAchievements() {
    const unlockedIds = getUnlockedAchievementIds(); // Get the array of IDs
    let currentAchievementObjects = {};

    achievementDefs.forEach(def => {
        currentAchievementObjects[def.id] = {
            ...def,
            isUnlocked: unlockedIds.includes(def.id), // Determine status from the IDs list
            unlockDate: unlockedIds.includes(def.id) ? (localStorage.getItem(`ach_date_${def.id}`) || null) : null, // Simplistic date storage, or derive from a more complex status object if needed elsewhere
        };
    });
    return currentAchievementObjects;
}

function saveFullAchievementStatuses(updatedFullAchievementsObject) {
    const unlockedIds = [];
    // If you want to store unlock dates separately or alongside a more complex status object:
    // const statusesToStoreInLS = {}; 

    for (const id in updatedFullAchievementsObject) {
        const ach = updatedFullAchievementsObject[id];
        if (ach.isUnlocked) {
            unlockedIds.push(id);
            // If storing dates: localStorage.setItem(`ach_date_${id}`, ach.unlockDate);
        } else {
            // localStorage.removeItem(`ach_date_${id}`);
        }
        // Example of storing more complex status if needed (but UNLOCKED_IDS_KEY is primary for unlock status)
        // statusesToStoreInLS[id] = { isUnlocked: ach.isUnlocked, unlockDate: ach.unlockDate };
    }
    
    // localStorage.setItem(ACHIEVEMENT_FULL_STATUS_KEY, JSON.stringify(statusesToStoreInLS)); // If storing full status separately
    
    saveUnlockedAchievementIds(unlockedIds); // Save the list of IDs
    achievementsStore.set(updatedFullAchievementsObject); // Update the main store holding full objects
}

export async function checkAndUnlockAchievements() {
    const currentFullAchievements = get(achievementsStore);
    let achievementsStateChanged = false;
    let newlyUnlockedAchievementsDetails = []; // To store full details for toast

    for (const id in currentFullAchievements) {
        const achievement = currentFullAchievements[id];
        if (achievement.isUnlocked) continue;

        let isMet = false;
        try {
            if (typeof achievement.check === 'function') {
                isMet = await achievement.check();
            } else {
                console.warn(`Achievement "${achievement.name}" missing check function.`);
            }
        } catch (e) {
            console.error(`Error checking achievement "${achievement.id}" (${achievement.name}):`, e);
        }

        if (isMet) {
            console.log(`[Achievements] Condition met for: ${achievement.name}`);
            currentFullAchievements[id].isUnlocked = true;
            currentFullAchievements[id].unlockDate = new Date().toISOString();
            achievementsStateChanged = true;
            if (!achievement.hidden) { // Only add to list for toasting if not initially hidden
                newlyUnlockedAchievementsDetails.push(currentFullAchievements[id]);
            }
        }
    }

    if (achievementsStateChanged) {
        console.log("[Achievements] Saving updated achievement statuses. Newly unlocked count for toast:", newlyUnlockedAchievementsDetails.length);
        saveFullAchievementStatuses(currentFullAchievements); 

        // --- THIS IS THE PART THAT SHOWS TOASTS AND PLAYS SOUND ---
        newlyUnlockedAchievementsDetails.forEach(ach => {
            console.log(`[Achievements] Showing toast & playing sound for: ${ach.name}`);
            // Delay toast slightly to ensure it's visible after any screen transitions or other UI updates
            setTimeout(() => {
                showToast(`🏆 Achievement Unlocked: ${ach.name}!`, "achievement", 2500);
            }, 500); // 500ms delay

            if (achievementSound) {
                achievementSound.currentTime = 0; // Rewind if already playing (e.g., multiple unlocks quickly)
                achievementSound.play().catch(e => console.warn("Achievement sound play failed:", e));
            } else {
                console.warn("[Achievements] achievementSound object is null or not loaded.");
            }
        });
        // --- END TOAST AND SOUND LOGIC ---
    } else {
        // console.log("[Achievements] No new achievements unlocked on this check.");
    }
}

export function resetAchievements() {
    console.log("[Achievements] Resetting all achievements...");
    let freshAchievementObjects = {};
    achievementDefs.forEach(def => {
        freshAchievementObjects[def.id] = {
            ...def,
            isUnlocked: false,
            unlockDate: null,
        };
        localStorage.removeItem(`ach_date_${def.id}`); // Clear any stored dates
    });
    
    // This function updates both UNLOCKED_IDS_KEY in LS (to empty)
    // and the achievementsStore Svelte store.
    saveFullAchievementStatuses(freshAchievementObjects); 
    
    // Explicitly clear the UNLOCKED_IDS_KEY from localStorage as well,
    // as saveFullAchievementStatuses might save an empty array to it, but good to be sure.
    localStorage.removeItem(UNLOCKED_IDS_KEY);
    unlockedAchievements.set([]); // Ensure the ID-only store is also empty

    console.log("[Achievements] Achievement data reset in localStorage and Svelte stores.");
    // The toast is now in storage.js's resetStorage
}

export function migrateAchievementStorage() {
    const oldKey = 'baonAchievementsStatus'; // Your original key that stored objects
    const newKey = UNLOCKED_IDS_KEY;
    
    const migrationDoneKey = 'achievements_migrated_to_ids_v1';

    if (localStorage.getItem(migrationDoneKey)) {
        // console.log("[AchievementStore] ID-based migration already done.");
        return;
    }

    const oldStoredData = localStorage.getItem(oldKey);
    if (oldStoredData) {
        try {
            const oldStatusesObject = JSON.parse(oldStoredData);
            const unlockedIds = [];
            for (const id in oldStatusesObject) {
                if (oldStatusesObject[id]?.isUnlocked) {
                    unlockedIds.push(id);
                    // Optionally migrate unlock dates too if you store them separately
                    // if(oldStatusesObject[id].unlockDate) {
                    //    localStorage.setItem(`ach_date_${id}`, oldStatusesObject[id].unlockDate);
                    // }
                }
            }
            localStorage.setItem(newKey, JSON.stringify(unlockedIds));
            console.log("[AchievementStore] Migrated old achievement statuses to new ID-based list.", unlockedIds);
            // localStorage.removeItem(oldKey); // IMPORTANT: Remove old data after successful migration
            localStorage.setItem(migrationDoneKey, 'true');
        } catch (e) {
            console.error("[AchievementStore] Error migrating achievement data:", e);
        }
    } else {
        // No old data to migrate, still mark as done for future.
        localStorage.setItem(migrationDoneKey, 'true');
    }
}