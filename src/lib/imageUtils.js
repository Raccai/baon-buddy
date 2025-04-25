// src/lib/imageUtils.js
import { Capacitor } from '@capacitor/core';

/**
 * Takes a potentially native file URI or a standard web URL and returns a
 * source URL that is displayable in the WebView.
 * It specifically converts known native file URIs using Capacitor.convertFileSrc.
 * Standard web URLs (http, https, /) and data URIs are passed through.
 *
 * @param {string | null | undefined} imageUrl The original image URL/URI
 * @returns {string | null} The displayable image source URL, or null if invalid/error
 */
export function getDisplayImageSrc(imageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string') {
        // console.log("[getDisplayImageSrc] Input is null or not a string.");
        return null;
    }

    const isNative = Capacitor.isNativePlatform();

    // --- Handle different URL types ---

    // 1. Standard Web URLs/Paths & Data URIs - Pass through directly
    // These should work on both web and native (Capacitor serves / paths)
    if (imageUrl.startsWith('http:') || imageUrl.startsWith('https:') || imageUrl.startsWith('data:') || imageUrl.startsWith('/')) {
        // console.log(`[getDisplayImageSrc] Using standard web/relative/data URL: ${imageUrl}`);
        return imageUrl;
    }

    // 2. Native File URIs - Needs conversion ONLY on native
    if (isNative) {
        // Assume anything else at this point on native MIGHT be a native file URI
        // that needs conversion (e.g., from Filesystem, Camera plugins)
        // It could also be an invalid path, convertFileSrc might handle/fail gracefully.
        console.log(`[getDisplayImageSrc] Assuming native path, attempting conversion: ${imageUrl}`);
        try {
            const convertedSrc = Capacitor.convertFileSrc(imageUrl);
            if (!convertedSrc) {
                 console.warn(`[getDisplayImageSrc] convertFileSrc returned empty/null for: ${imageUrl}`);
                 return null; // Conversion failed or returned nothing usable
            }
            console.log(`[getDisplayImageSrc] Using CONVERTED src: ${convertedSrc}`);
            return convertedSrc;
        } catch (e) {
            console.error(`[getDisplayImageSrc] Error converting native src "${imageUrl}":`, e);
            return null; // Return null on error
        }
    } else {
        // 3. On Web - Unrecognized Format (Not http, /, data:)
        // If it's not a standard web format and we're not on native, it's likely invalid.
        console.warn(`[getDisplayImageSrc] Invalid/unhandled URL format for web: ${imageUrl}`);
        return null;
    }
}