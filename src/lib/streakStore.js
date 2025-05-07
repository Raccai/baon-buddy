import { writable } from 'svelte/store';
import { getStreakData as getInitialStreakData } from './storage.js';

// Initialize with a safe default, actual data loaded later
export const streakStore = writable({ lastActionDate: null, currentStreak: 0, longestStreak: 0 });

export function initializeStreakStore() {
    console.log("[StreakStore] Initializing with data from localStorage...");
    streakStore.set(getInitialStreakData());
}

// refreshStreakStore is called by storage.js when data changes
export function refreshStreakStore() {
    console.log("[StreakStore] Refreshing with data from localStorage...");
    streakStore.set(getInitialStreakData());
}