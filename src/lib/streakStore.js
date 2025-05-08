// src/lib/streakStore.js
import { writable } from 'svelte/store';
// Import the getter function itself safely
import { getStreakData as getStreakDataFromStorage } from './storage.js';

// --- Default state ---
const defaultStreakState = { lastActionDate: null, currentStreak: 0, longestStreak: 0 };

// --- Create Writable Store - Initialize with DEFAULT ---
const streakStore = writable(defaultStreakState); // <<< Initialize with default object
console.log("[streakStore] Store created with default state.");

// --- Function to load initial data AFTER module resolution ---
let storeInitialized = false;
function loadInitialData() {
    if (storeInitialized) return;
    try {
        console.log("[streakStore] Attempting to load initial data from storage...");
        const storedData = getStreakDataFromStorage(); // Now call the imported function
        streakStore.set(storedData); // Update the store with actual data
        storeInitialized = true;
        console.log("[streakStore] Initial data loaded:", storedData);
    } catch (e) {
        console.error("[streakStore] Error loading initial streak data:", e);
        streakStore.set(defaultStreakState); // Ensure it's set to default on error
    }
}

// --- Function to refresh the store (called by storage.js) ---
export function refreshStreakStore() {
    // Only refresh if already initialized, otherwise loadInitialData handles it
    if (!storeInitialized) {
        console.log("[streakStore] Refresh called before initial load, calling loadInitialData instead.");
        loadInitialData();
    } else {
        console.log("[streakStore] Refreshing streak data from storage...");
        streakStore.set(getStreakDataFromStorage());
    }
}

// --- Export the store ---
export { streakStore };

// --- Trigger initial load slightly after module evaluation ---
// This allows storage.js to fully initialize its constants first.
// Run this only in the browser environment.
if (typeof window !== 'undefined') {
    setTimeout(loadInitialData, 0); // Schedule loading for the next tick
}