// src/lib/calendar.js
import { writable, get } from 'svelte/store';
import { updateStreakOnAction } from './storage.js';
import { readFile, writeFile } from './filesystemStorage.js';
import { showToast } from './toast.js'; // Assuming you have this utility

export const CALENDAR_DATA_FILENAME = 'baonCalendarData_fs.json';

// LocalStorage keys for one-time migration check
const OLD_CALENDAR_STORAGE_KEY_LS = 'baonCalendarData';
const MIGRATION_CALENDAR_FS_DONE_KEY = 'migrationCalendarToFS_Done_v1'; // Unique key for this specific migration

const initialCalendarState = {};
export const calendarData = writable(initialCalendarState);

export async function initializeCalendarStore() {
    console.log('[calendar-FS] Initializing calendar store...');
    let data = null;

    if (!localStorage.getItem(MIGRATION_CALENDAR_FS_DONE_KEY)) {
        console.log('[calendar-FS] Checking localStorage for calendar data to migrate...');
        const oldLsDataString = localStorage.getItem(OLD_CALENDAR_STORAGE_KEY_LS);
        if (oldLsDataString) {
            try {
                const oldLsData = JSON.parse(oldLsDataString);
                const migratedData = {};
                for (const dateKey in oldLsData) {
                    if (Array.isArray(oldLsData[dateKey])) {
                        if (oldLsData[dateKey].length > 0 && typeof oldLsData[dateKey][0] === 'object' && oldLsData[dateKey][0] !== null) {
                            migratedData[dateKey] = oldLsData[dateKey]
                                .map(mealObject => mealObject?.id || mealObject?.name) // Ensure mealObject exists
                                .filter(Boolean);
                        } else { // Already IDs or empty
                            migratedData[dateKey] = oldLsData[dateKey].filter(id => typeof id === 'string'); // Ensure all are strings
                        }
                        if (migratedData[dateKey]?.length === 0) delete migratedData[dateKey];
                    }
                }
                data = migratedData;
                await writeFile(CALENDAR_DATA_FILENAME, data);
                console.log('[calendar-FS] Data from localStorage migrated/written to Filesystem.');
                // localStorage.removeItem(OLD_CALENDAR_STORAGE_KEY_LS); // Optional cleanup
            } catch (e) {
                console.error('[calendar-FS] Error migrating calendar data from localStorage:', e);
                data = null; 
            }
        }
        localStorage.setItem(MIGRATION_CALENDAR_FS_DONE_KEY, 'true');
    }

    if (data === null) { // If not populated by migration, read from FS
        data = await readFile(CALENDAR_DATA_FILENAME);
    }

    if (data === null) { // If still no data (fresh install or read failed)
        console.log('[calendar-FS] No calendar file. Starting fresh.');
        data = {};
        await writeFile(CALENDAR_DATA_FILENAME, data); // Create empty file
    }

    // Final validation: ensure all entries are arrays of strings
    for (const dateKey in data) {
        if (!Array.isArray(data[dateKey]) || !data[dateKey].every(id => typeof id === 'string')) {
            console.warn(`[calendar-FS] Invalid data format for ${dateKey}. Clearing entry.`);
            delete data[dateKey];
        }
    }

    calendarData.set(data);
    console.log('[calendar-FS] Calendar store initialized from Filesystem with:', data);
}

export async function saveCalendarDataFS(dataToSave) {
    try {
        const currentData = dataToSave || get(calendarData);
        await writeFile(CALENDAR_DATA_FILENAME, currentData);
        calendarData.set(currentData);
    } catch (e) {
        console.error("[calendar-FS] Error saving calendar data to Filesystem:", e);
        showToast("Failed to save calendar changes.", "error");
    }
}

export async function addBaon(dateKey, mealIdsToAdd) {
    if (!dateKey) return;
    const currentData = { ...get(calendarData) };
    const validMealIds = (Array.isArray(mealIdsToAdd) && mealIdsToAdd.every(id => typeof id === 'string'))
                         ? mealIdsToAdd : [];
    if (validMealIds.length > 0) {
        currentData[dateKey] = [...new Set(validMealIds)];
    } else {
        delete currentData[dateKey];
    }
    await saveCalendarDataFS(currentData);
    if (validMealIds.length > 0) await updateStreakOnAction();
}

export async function removeBaon(dateKey, mealIdToRemove) {
    if (!dateKey || typeof mealIdToRemove !== 'string') return;
    const currentData = { ...get(calendarData) };
    let modified = false;
    if (currentData[dateKey]?.length) {
        const initialLength = currentData[dateKey].length;
        currentData[dateKey] = currentData[dateKey].filter(id => id !== mealIdToRemove);
        if (currentData[dateKey].length === 0) delete currentData[dateKey];
        if (currentData[dateKey]?.length < initialLength || (initialLength > 0 && !currentData[dateKey])) modified = true;
    }
    if (modified) {
        await saveCalendarDataFS(currentData);
        // await updateStreakOnAction(); // Decide if removal affects streak
    }
}

export async function pasteBaon(dateKey, mealIdsToPaste) {
    if (!dateKey || !Array.isArray(mealIdsToPaste) || !mealIdsToPaste.every(id => typeof id === 'string')) return;
    const currentData = { ...get(calendarData) };
    currentData[dateKey] = [...new Set(mealIdsToPaste)];
    await saveCalendarDataFS(currentData);
    if (mealIdsToPaste.length > 0) await updateStreakOnAction();
}