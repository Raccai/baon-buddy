import { get } from 'svelte/store';
import { getCounter, getFavorites } from './storage.js'; // Direct imports are fine here
import { calendarData } from './calendar.js';

export const achievements = [
    {
        id: 'welcome', name: "Baon Buddy Initiate", description: "Opened the app for the first time.",
        icon: "👋", type: 'custom_check', // Use a generic type for these
        check: () => getCounter('baonAppOpens') >= 1,
        secret: false,
    },
    {
        id: 'generate_1', name: "First Suggestion!", description: "Generated your first Baon suggestion.",
        icon: "✨", type: 'custom_check',
        check: () => getCounter('baonMealGenerations') >= 1,
        secret: false,
    },
    {
        id: 'first_fave', name: "Saved the Best!", description: "Favorited your first Baon.",
        icon: "💖", type: 'custom_check',
        check: () => getFavorites().length >= 1,
        secret: false,
    },
    {
        id: 'fave_5', name: "Top Picks", description: "Favorited 5 different Baon.",
        icon: "⭐", type: 'custom_check',
        check: () => getFavorites().length >= 5,
        secret: false,
    },
    {
        id: 'first_calendar', name: "Meal Planner", description: "Added your first Baon to the calendar.",
        icon: "📅", type: 'custom_check',
        check: () => Object.keys(get(calendarData)).length > 0,
        secret: false,
    },
    {
        id: 'calendar_week', name: "Week Sorted", description: "Planned Baon for 7 different days.",
        icon: "🗓️", type: 'custom_check',
        check: () => Object.keys(get(calendarData)).length >= 7,
        secret: false,
    },
    {
        id: 'adobo_fave', name: "Adobo Aficionado", description: "You REALLY like Adobo, don't you?",
        icon: "🍗", type: 'custom_check',
        check: () => getFavorites().some(item => item.name.toLowerCase().includes("adobo".toLowerCase())),
        secret: true,
    },
];

export function getAchievementById(id) {
    return achievements.find(a => a.id === id);
}