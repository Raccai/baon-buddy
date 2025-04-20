import { getCounter, getFavorites, getSeenMEals } from './storage.js';
import { calendarData } from './calendar.js'; // Import the store if needed
import { get } from 'svelte/store';

export const achievements = [
    {
        id: 'welcome',
        name: "Baon Buddy Initiate",
        description: "Opened the app for the first time.",
        icon: "👋", // Emoji or path to an SVG/image
        type: 'counter', // Type helps the checking logic
        key: 'baonAppOpens', // The key used in storage.js counter
        threshold: 1,      // Value needed to unlock
        secret: false,     // Show even when locked?
    },
    {
        id: 'generate_1',
        name: "First Suggestion!",
        description: "Generated your first Baon suggestion.",
        icon: "✨",
        type: 'counter',
        key: 'baonMealGenerations',
        threshold: 1,
        secret: false,
    },
    {
        id: 'generate_10',
        name: "Baon Explorer",
        description: "Generated 10 Baon suggestions.",
        icon: "🍲",
        type: 'counter',
        key: 'baonMealGenerations',
        threshold: 10,
        secret: false,
    },
    {
        id: 'generate_50',
        name: "Baon Connoisseur",
        description: "Generated 50 Baon suggestions.",
        icon: "🧑‍🍳",
        type: 'counter',
        key: 'baonMealGenerations',
        threshold: 50,
        secret: false,
    },
    {
        id: 'first_fave',
        name: "Saved the Best!",
        description: "Favorited your first Baon.",
        icon: "💖",
        type: 'list_length', // Check length of a list
        getList: getFavorites, // Function to get the relevant list
        threshold: 1,
        secret: false,
    },
    {
        id: 'fave_5',
        name: "Top Picks",
        description: "Favorited 5 different Baon.",
        icon: "⭐",
        type: 'list_length',
        getList: getFavorites,
        threshold: 5,
        secret: false,
    },
    {
        id: 'first_calendar',
        name: "Meal Planner",
        description: "Added your first Baon to the calendar.",
        icon: "📅",
        type: 'calendar_check', // Custom type for calendar logic
        check: () => Object.keys(get(calendarData)).length > 0, // Check if calendarData store has any entries
        secret: false,
    },
    {
        id: 'calendar_week',
        name: "Week Sorted",
        description: "Planned Baon for 7 different days.",
         icon: "🗓️",
        type: 'calendar_check',
        check: () => Object.keys(get(calendarData)).length >= 7,
        secret: false,
    },
    // --- Example Secret Achievement ---
    {
        id: 'adobo_fave',
        name: "Adobo Aficionado",
        description: "You REALLY like Adobo, don't you?",
        icon: "🍗",
        type: 'list_contains', // Check if a specific item is in a list
        getList: getFavorites,
        value: "Adobo", // Check if name includes 'Adobo' (adjust match logic if needed)
        check: (list, val) => list.some(item => item.name.toLowerCase().includes(val.toLowerCase())),
        secret: true, // Hide until unlocked
    },
    // Add more creative achievements! (e.g., tried all types, used copy/paste, visited all screens)
];

// Helper function to get definition by ID (optional but useful)
export function getAchievementById(id) {
    return achievements.find(a => a.id === id);
}