// src/lib/storage.js
import { showToast } from './toast.js';
import { _allMealsStore } from './mealStore.js'; // Import the actual store instance
import { meals as defaultMealsFromFile } from './meals.js';
import { calendarData, saveCalendarDataFS, CALENDAR_DATA_FILENAME } from './calendar.js'; // FS save and filename
import { get as getStoreValue } from 'svelte/store';
import { refreshStreakStore } from './streakStore.js';
import { Capacitor } from '@capacitor/core';
import { Filesystem as CapacitorFilesystem, Directory as CapacitorDirectory } from '@capacitor/filesystem';
import { readFile, writeFile, deleteFsFile } from './filesystemStorage.js';
import { checkAndUnlockAchievements, resetAchievements } from './achievementStore.js';
import { isSameDay, subDays, formatISO, parseISO, startOfDay } from 'date-fns';

// --- Filenames for Filesystem ---
export const ALL_MEALS_FILENAME = 'baonAllEntries_fs.json';
export const DELETED_DEFAULT_MEAL_IDS_FILENAME = 'baonDeletedDefaultMealIds_fs.json';
export const FAVORITES_FILENAME = 'baonFavorites_fs.json';

// --- LocalStorage Keys (for migration flags and small settings/data) ---
const OLD_ALL_BAON_KEY_LS = "baonAllEntries";
const OLD_DELETED_DEFAULT_IDS_LS = "baonDeletedDefaultMealIds";
const OLD_FAVORITES_KEY_LS = "baonFavorites";
const OLD_CALENDAR_KEY_LS = "baonCalendarData"; // Checked by calendar.js during its init

const MIGRATION_CORE_FS_DONE_KEY = 'migrationToFilesystem_Core_v1'; // For meals, deletedIds, favorites

// Keys for data that REMAINS in localStorage
const SEEN_KEY = "seenMeals";
const ONBOARDING_KEY = 'baonBuddyOnboardingStatus'; // Example, manage as needed
const MUSIC_KEY = 'musicEnabled';
const LAST_SCREEN_KEY = 'lastScreen';
const STREAK_DATA_KEY = "baonDailyActionStreak";
const APP_VERSION_KEY = 'baonAppVersion';


export async function initializeAppStorageAndMeals(currentAppVersionFromApp) {
    console.log("[storage] initializeAppStorageAndMeals (FS) called. App Version:", currentAppVersionFromApp);

    if (!localStorage.getItem(MIGRATION_CORE_FS_DONE_KEY)) {
        console.log("[storage] Performing one-time migration of core data from localStorage to Filesystem...");
        try {
            const oldMealsDataLS = localStorage.getItem(OLD_ALL_BAON_KEY_LS);
            if (oldMealsDataLS) {
                try {
                    const mealsToMigrate = JSON.parse(oldMealsDataLS);
                    const cleanedMeals = mealsToMigrate.map(meal => ({
                        ...meal,
                        image: (meal.image && meal.image.startsWith('data:image')) ? null : meal.image,
                    }));
                    await writeFile(ALL_MEALS_FILENAME, cleanedMeals);
                    console.log("[storage] Migrated allMeals to FS.");
                } catch (e) { console.error("Error migrating allMeals:", e); }
            }

            const oldDeletedIdsLS = localStorage.getItem(OLD_DELETED_DEFAULT_IDS_LS);
            if (oldDeletedIdsLS) {
                try {
                    await writeFile(DELETED_DEFAULT_MEAL_IDS_FILENAME, JSON.parse(oldDeletedIdsLS));
                    console.log("[storage] Migrated deletedDefaultMealIds to FS.");
                } catch (e) { console.error("Error migrating deleted IDs:", e); }
            }
            
            const oldFavoritesLS = localStorage.getItem(OLD_FAVORITES_KEY_LS);
            if (oldFavoritesLS) {
                try {
                    const favoritesToMigrate = JSON.parse(oldFavoritesLS);
                    const favoriteIds = favoritesToMigrate.map(fav => fav.id || fav.name).filter(Boolean);
                    await writeFile(FAVORITES_FILENAME, favoriteIds);
                    console.log("[storage] Migrated favorites (as IDs) to FS.");
                } catch (e) { console.error("Error migrating favorites:", e); }
            }
            localStorage.setItem(MIGRATION_CORE_FS_DONE_KEY, 'true');
            console.log("[storage] Core data Filesystem migration marked as done.");
        } catch (migrationError) {
            console.error("[storage] CRITICAL ERROR during core data migration:", migrationError);
        }
    }

    const storedAppVersion = localStorage.getItem(APP_VERSION_KEY);
    let allMealsDataFS = await readFile(ALL_MEALS_FILENAME);

    if (allMealsDataFS === null) {
        console.log("[storage-FS] No meal file. Initializing default meals...");
        await forceUpdateDefaultMeals(); // Creates and saves file
        allMealsDataFS = await getAllMeals(); // Re-read after creation
    } else if (storedAppVersion !== currentAppVersionFromApp) {
        console.log(`[storage-FS] App version mismatch. Updating defaults...`);
        await forceUpdateDefaultMeals();
        allMealsDataFS = await getAllMeals(); // Re-read
    }
    _allMealsStore.set(allMealsDataFS || []); // Ensure store is updated after potential forceUpdate

    if (storedAppVersion !== currentAppVersionFromApp) {
        localStorage.setItem(APP_VERSION_KEY, currentAppVersionFromApp);
    }
    console.log("[storage] initializeAppStorageAndMeals finished.");
}

export const getAllMeals = async () => {
    const meals = await readFile(ALL_MEALS_FILENAME);
    return meals || [];
};

const saveAllMeals = async (mealsArray) => {
    const mealsToSave = Array.isArray(mealsArray) ? mealsArray : [];
    await writeFile(ALL_MEALS_FILENAME, mealsToSave);
    _allMealsStore.set(mealsToSave); // Update Svelte store
};

export const addMeal = async (newMealData) => {
    if (!newMealData?.name?.trim()) { showToast("Baon name is required.", "error"); return false; }
    const currentMeals = await getAllMeals();
    if (currentMeals.some(m => m.name.trim().toLowerCase() === newMealData.name.trim().toLowerCase() && m.id !== newMealData.id)) {
        showToast("A Baon with this name already exists.", "error"); return false;
    }
    const mealToAdd = {
        ...newMealData,
        id: (newMealData.id && (newMealData.id.startsWith('user_') || newMealData.id.startsWith('user_mod_')))
            ? newMealData.id
            : `user_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        isUserDefined: true,
        tags: Array.isArray(newMealData.tags) ? newMealData.tags : [] // <<< ENSURE tags is an array
    };
    await saveAllMeals([...currentMeals, mealToAdd]);
    showToast(`"${mealToAdd.name}" added!`, "success");
    return true;
};

export const updateMeal = async (updatedMealData) => {
    if (!updatedMealData?.id) { showToast("Error: No ID for update.", "error"); return false; }
    if (!updatedMealData?.name?.trim()) { showToast("Baon name is required.", "error"); return false; }
    let currentMeals = await getAllMeals();
    const index = currentMeals.findIndex(m => m.id === updatedMealData.id);
    if (index === -1) { showToast("Could not find Baon to update.", "error"); return false; }
    if (currentMeals.some(m => m.id !== updatedMealData.id && m.name.trim().toLowerCase() === updatedMealData.name.trim().toLowerCase())) {
        showToast("Another Baon has this name.", "error"); return false;
    }
    
    const existingMeal = currentMeals[index];
    currentMeals[index] = { 
        ...existingMeal, 
        ...updatedMealData, 
        isUserDefined: true,
        // Ensure tags from updatedMealData is an array, or keep existing, or default to empty
        tags: Array.isArray(updatedMealData.tags) 
              ? updatedMealData.tags 
              : (Array.isArray(existingMeal.tags) ? existingMeal.tags : []) 
    };
    await saveAllMeals(currentMeals);
    showToast(`"${currentMeals[index].name}" updated!`, "success");
    return true;
};

export const getDeletedDefaultMealIds = async () => {
    const ids = await readFile(DELETED_DEFAULT_MEAL_IDS_FILENAME);
    return Array.isArray(ids) ? ids : [];
};

const addDeletedDefaultMealId = async (mealId) => {
    if (!mealId) return;
    const currentDeleted = await getDeletedDefaultMealIds();
    if (!currentDeleted.includes(mealId)) {
        await writeFile(DELETED_DEFAULT_MEAL_IDS_FILENAME, [...currentDeleted, mealId]);
    }
};

export const deleteMeal = async (mealId) => {
    if (!mealId) return false;
    let currentMeals = await getAllMeals();
    const mealToDelete = currentMeals.find(m => m.id === mealId);
    if (!mealToDelete) { console.warn(`Meal ID ${mealId} not found for deletion.`); return false; }

    if (mealToDelete.isUserDefined === false || mealToDelete.id.startsWith('default_')) {
        await addDeletedDefaultMealId(mealToDelete.id);
    }

    if (Capacitor.isNativePlatform() && mealToDelete.image?.startsWith('capacitor://')) {
        const filename = mealToDelete.image.substring(mealToDelete.image.lastIndexOf('/') + 1);
        if (filename) {
            try {
                await CapacitorFilesystem.deleteFile({ path: filename, directory: CapacitorDirectory.Data });
            } catch (e) { console.warn(`Failed to delete image ${filename}:`, e); }
        }
    }
    await saveAllMeals(currentMeals.filter(m => m.id !== mealId));

    try {
        let liveCalendar = getStoreValue(calendarData);
        let newCalendar = JSON.parse(JSON.stringify(liveCalendar));
        let modified = false;
        for (const dateKey in newCalendar) {
            if (Array.isArray(newCalendar[dateKey])) {
                const initialCount = newCalendar[dateKey].length;
                newCalendar[dateKey] = newCalendar[dateKey].filter(id => id !== mealId);
                if (newCalendar[dateKey].length < initialCount) modified = true;
                if (newCalendar[dateKey].length === 0) delete newCalendar[dateKey];
            }
        }
        if (modified) await saveCalendarDataFS(newCalendar);
    } catch (e) { console.error("Error removing meal from calendar:", e); }

    try {
        let favIds = await getFavorites();
        if (favIds.includes(mealId)) {
            await writeFile(FAVORITES_FILENAME, favIds.filter(id => id !== mealId));
        }
    } catch (e) { console.error("Error removing meal from favorites:", e); }
    
    showToast(`"${mealToDelete.name}" deleted.`, "info");
    return true;
};

export async function forceUpdateDefaultMeals() {
    const currentStoredMeals = await getAllMeals();
    const userDefinedMeals = currentStoredMeals.filter(meal => meal.isUserDefined === true);
    const deletedDefaultIds = await getDeletedDefaultMealIds();
    const finalDefaultSet = defaultMealsFromFile.reduce((acc, defMeal) => {
        const mealId = defMeal.id || `default_${defMeal.name?.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'meal'}_${acc.length}`;
        if (defMeal.name && !deletedDefaultIds.includes(mealId)) {
            acc.push({ ...defMeal, id: mealId, isUserDefined: false });
        }
        return acc;
    }, []);
    const mealMap = new Map();
    finalDefaultSet.forEach(meal => mealMap.set(meal.id, meal));
    userDefinedMeals.forEach(meal => mealMap.set(meal.id, meal));
    await saveAllMeals(Array.from(mealMap.values()));
}

export const getFavorites = async () => {
    const ids = await readFile(FAVORITES_FILENAME);
    return Array.isArray(ids) ? ids : [];
};
export const saveFavorite = async (meal) => {
    if (!meal?.id) return;
    const favIds = await getFavorites();
    if (!favIds.includes(meal.id)) {
        await writeFile(FAVORITES_FILENAME, [...favIds, meal.id]);
        showToast("Added to faves!", "faves");
    }
};
export const removeFavorite = async (mealId) => {
    if (!mealId) return;
    const favIds = await getFavorites();
    if (favIds.includes(mealId)) {
        await writeFile(FAVORITES_FILENAME, favIds.filter(id => id !== mealId));
        showToast("Removed from faves!", "info");
    }
};
export async function clearFavorites() {
    try {
        await writeFile(FAVORITES_FILENAME, []);
        showToast("All favorites cleared!", "info");
        // Consider dispatching an event or directly updating a favorites Svelte store if one exists
    } catch (e) { console.error("Error clearing FS favorites:", e); showToast("Failed to clear faves.", "error");}
}

export function getSeenMeals() { /* ... (LS based) ... */ 
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(SEEN_KEY); return stored ? JSON.parse(stored) : [];
}
export function markMealAsSeen(mealName) { /* ... (LS based) ... */
    if (typeof window === 'undefined' || !mealName) return;
    const current = getSeenMeals(); if (!current.includes(mealName)) localStorage.setItem(SEEN_KEY, JSON.stringify([...current, mealName]));
}
export function clearSeenMeals() { /* ... (LS based) ... */
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SEEN_KEY);
}
export function getCounter(key) { /* ... (LS based) ... */
    if (typeof window === 'undefined' || !key) return 0;
    const val = localStorage.getItem(`counter_${key}`); return val ? parseInt(val, 10) : 0;
}
export function incrementCounter(key) { /* ... (LS based) ... */
    if (typeof window === 'undefined' || !key) return;
    let val = getCounter(key); val++; localStorage.setItem(`counter_${key}`, val.toString()); return val;
}

export function getStreakData() { /* ... (LS based) ... */
    if (typeof window === 'undefined') return { lastActionDate: null, currentStreak: 0, longestStreak: 0 };
    const stored = localStorage.getItem(STREAK_DATA_KEY);
    const defaults = { lastActionDate: null, currentStreak: 0, longestStreak: 0 };
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
}
function saveStreakData(data) { /* ... (LS based) ... */
    if (typeof window === 'undefined') return;
    localStorage.setItem(STREAK_DATA_KEY, JSON.stringify(data));
    if (typeof refreshStreakStore === 'function') refreshStreakStore();
}
export async function updateStreakOnAction() { /* ... (LS based, but needs date-fns) ... */
    const streakData = getStreakData();
    const today = startOfDay(new Date());
    const todayKey = formatISO(today, { representation: 'date' });
    if (!streakData.lastActionDate) streakData.currentStreak = 1;
    else {
        const lastActionDay = startOfDay(parseISO(streakData.lastActionDate));
        if (isSameDay(lastActionDay, subDays(today, 1))) streakData.currentStreak++;
        else if (!isSameDay(lastActionDay, today)) streakData.currentStreak = 1;
    }
    streakData.lastActionDate = todayKey;
    streakData.longestStreak = Math.max(streakData.longestStreak, streakData.currentStreak);
    saveStreakData(streakData);
    await checkAndUnlockAchievements(); // checkAndUnlockAchievements itself is async
}

export async function resetStorage() {
    const fsFiles = [ALL_MEALS_FILENAME, DELETED_DEFAULT_MEAL_IDS_FILENAME, 
        FAVORITES_FILENAME, CALENDAR_DATA_FILENAME];
    for (const file of fsFiles) await deleteFsFile(file);
    const lsKeys = [SEEN_KEY, ONBOARDING_KEY, MUSIC_KEY, LAST_SCREEN_KEY, 
        STREAK_DATA_KEY, APP_VERSION_KEY, MIGRATION_CORE_FS_DONE_KEY, 
        'counter_baonAppOpens', 'counter_baonMealGenerations', 
        'baonCalendarDataVersion', 'migrationCalendarToFS_Done_v1'];
    lsKeys.forEach(key => localStorage.removeItem(key));
    await initializeAppStorageAndMeals(null); // Re-init defaults
    _allMealsStore.set(await getAllMeals()); // Re-populate
    if (typeof refreshStreakStore === 'function') refreshStreakStore();
    resetAchievements(); // This should also be async if it interacts with FS/LS for its state
    showToast("App data has been reset.", "info");
    // Consider window.location.reload(); for a full app state reset if UI doesn't fully update
}