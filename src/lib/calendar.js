// src/lib/calendar.js
import { writable, get } from 'svelte/store'; // Import get
import { format, parseISO, setHours, setMinutes, setSeconds } from 'date-fns';
import { recordDailyBaonAction } from './storage';

const CALENDAR_STORAGE_KEY = 'baonCalendarData';

// Function to load data
function loadCalendarData() {
    try {
        const stored = localStorage.getItem(CALENDAR_STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        console.error("Error loading calendar data:", e);
        return {};
    }
}

// The writable store
export const calendarData = writable(loadCalendarData());

// Function to save data (updates store and localStorage)
export function saveCalendarData(data) {
    try {
        const dataToSave = data || {};
        localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(dataToSave));
        calendarData.set(dataToSave); // Update the store
        console.log("Calendar data saved.");
    } catch (e) {
        console.error("Error saving calendar data:", e);
    }
}

// Add Baon(s) for a specific date
// Assumes mealsToAdd is the COMPLETE new array for that day
export function addBaon(dateKey, mealsToAdd) {
    if (!dateKey) return;
    const currentData = get(calendarData); // Get current store value
    const validMealsToAdd = Array.isArray(mealsToAdd) ? mealsToAdd : [];

    // Update or add the entry for the date
    if (validMealsToAdd.length > 0) {
        currentData[dateKey] = validMealsToAdd;
    } else {
        // If adding an empty array, delete the key for that date
        delete currentData[dateKey];
    }

    saveCalendarData(currentData); // Save the modified object

    if (mealsToAdd && mealsToAdd.length > 0) {
        recordDailyBaonAction();
    }
}

// Remove a specific Baon from a date using its index in that day's array
export function removeBaon(dateKey, mealIndex) {
    if (!dateKey || typeof mealIndex !== 'number' || mealIndex < 0) {
        console.error("Invalid arguments for removeBaon:", dateKey, mealIndex);
        return;
    }

    const currentData = get(calendarData); // Get current store value

    // Check if the date exists and has meals
    if (currentData[dateKey] && Array.isArray(currentData[dateKey])) {
        const dayMeals = currentData[dateKey];

        // Check if the index is valid for the array
        if (mealIndex < dayMeals.length) {
            // Remove the meal at the specified index
            dayMeals.splice(mealIndex, 1);
            console.log(`Removed meal at index ${mealIndex} from ${dateKey}`);

            // If the day has no meals left, remove the date entry
            if (dayMeals.length === 0) {
                console.log(`No meals left for ${dateKey}, removing date entry.`);
                delete currentData[dateKey];
            } else {
                // Otherwise, update the array for the date (splice modifies in-place)
                currentData[dateKey] = dayMeals;
            }

            // Save the updated calendar data
            saveCalendarData(currentData);
            recordDailyBaonAction();
        } else {
            console.warn(`Invalid index ${mealIndex} for date ${dateKey} which has ${dayMeals.length} meals.`);
        }
    } else {
        console.warn(`No meals found for date ${dateKey} to remove from.`);
    }
}

// Functions for copy/paste (assuming they work with the calendarData structure)
export function copyBaon(dateKey) {
    const currentData = get(calendarData);
    return currentData[dateKey] ? [...currentData[dateKey]] : null; // Return a copy
}

export function pasteBaon(dateKey, mealsToPaste) {
    if (!dateKey || !Array.isArray(mealsToPaste)) return;
    const currentData = get(calendarData);
    // Overwrite or merge? Current DayModal logic implies overwrite via 'add' event.
    // Let's stick to overwrite for simplicity, matching addBaon.
    currentData[dateKey] = [...mealsToPaste]; // Paste a copy
    saveCalendarData(currentData);

    if (currentData[dateKey] && currentData[dateKey].length > 0) {
        recordDailyBaonAction();
    }
}