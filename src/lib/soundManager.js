const SOUND_EFFECTS_ENABLED_KEY = 'soundEffectsEnabled';

// Cache for Audio objects to avoid re-creating them constantly
const audioCache = {};
let sfxEnabled = true; // Default, will be synced with localStorage

// Function to load a sound and cache it
function loadSound(soundName, path, volume = 0.5) {
    if (typeof window === 'undefined') return null;
    if (audioCache[soundName]) {
        return audioCache[soundName];
    }
    try {
        const audio = new Audio(path);
        audio.volume = volume;
        audioCache[soundName] = audio;
        return audio;
    } catch (e) {
        console.error(`Failed to load sound ${soundName} from ${path}:`, e);
        return null;
    }
}

// Initialize and pre-load common sounds (optional, but good for responsiveness)
// Call this early in your app's lifecycle, e.g., in App.svelte onMount
export function initializeSoundManager() {
    if (typeof window === 'undefined') return;
    
    const storedPreference = localStorage.getItem(SOUND_EFFECTS_ENABLED_KEY);
    sfxEnabled = storedPreference === null ? true : storedPreference === 'true'; // Default true if not set
    localStorage.setItem(SOUND_EFFECTS_ENABLED_KEY, sfxEnabled.toString()); // Ensure it's set

    console.log('[SoundManager] Initialized. SFX Enabled:', sfxEnabled);

    // Preload critical sounds
    loadSound('click', '/music/clickSound.mp3', 0.3);
    loadSound('success', '/music/successSound.mp3', 0.5);
    loadSound('error', '/music/failSound.mp3', 0.5);
    loadSound('toggleOnOff', '/music/toggleSound.mp3', 0.4);
    loadSound('sheetOpenClose', '/music/sheetSound.mp3', 0.4);
    loadSound('favorite', '/music/favoriteSound.mp3', 0.2);
    loadSound('sideOpenClose', '/music/swooshSound.mp3', 0.4);
    // Add more as needed
}

// Function to play a sound
export function playSound(soundName) {
    if (typeof window === 'undefined' || !sfxEnabled) {
        // console.log(`[SoundManager] SFX disabled or not in browser. Sound ${soundName} not played.`);
        return;
    }

    const audio = audioCache[soundName];
    if (audio) {
        audio.currentTime = 0; // Rewind to start
        audio.play().catch(error => {
            // Autoplay restrictions might prevent sound if no recent user interaction
            // console.warn(`[SoundManager] Error playing sound "${soundName}":`, error);
        });
    } else {
        console.warn(`[SoundManager] Sound "${soundName}" not found in cache.`);
    }
}

// Functions to manage the enabled state
export function setSoundEffectsEnabled(enabled) {
    if (typeof window === 'undefined') return;
    sfxEnabled = !!enabled; // Ensure boolean
    localStorage.setItem(SOUND_EFFECTS_ENABLED_KEY, sfxEnabled.toString());
    console.log('[SoundManager] Sound effects set to:', sfxEnabled);
    // Play a toggle sound when setting is changed by user
    // playSound(sfxEnabled ? 'toggleOn' : 'toggleOff'); // Be careful not to create loop if called from toggle itself
}

export function areSoundEffectsEnabled() {
    if (typeof window === 'undefined') return true; // Default to true for SSR or if LS not available
    return sfxEnabled;
}