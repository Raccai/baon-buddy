// src/lib/mealStore.js
import { writable } from 'svelte/store';
// getAllMeals will be imported dynamically or App.svelte will call loadMealsIntoStoreFromFS

export const _allMealsStore = writable([]); // Initialize empty
console.log("[mealStore] Store created (initially empty for async FS load).");

// Called from App.svelte onMount
export async function loadMealsIntoStoreFromFS() {
    console.log("[mealStore] Attempting load from FS via storage.js::getAllMeals...");
    try {
        const { getAllMeals } = await import('./storage.js'); // Ensure storage.js doesn't import this file at top level
        const mealsFromStorage = await getAllMeals();
        _allMealsStore.set(mealsFromStorage || []);
        console.log(`[mealStore] FS Load: Store updated with ${mealsFromStorage?.length || 0} meals.`);
    } catch (e) {
        console.error("[mealStore] Error loading meals into store from FS:", e);
        _allMealsStore.set([]);
    }
}

// This function is primarily for storage.js to call after saveAllMeals if it doesn't update _allMealsStore directly
// OR for other parts of the app to manually trigger a refresh.
// Since saveAllMeals in storage.js now directly calls _allMealsStore.set(), this might be less critical
// but good to have.
export function refreshMealsStore() {
    console.log("[mealStore] Refresh triggered, reloading from FS...");
    loadMealsIntoStoreFromFS();
}

export { _allMealsStore as allMeals };