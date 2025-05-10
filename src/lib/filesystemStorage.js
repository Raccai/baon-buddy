// src/lib/filesystemStorage.js
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const DATA_DIRECTORY = Directory.Data;

export async function readFile(filename) {
  if (!Capacitor.isNativePlatform()) {
    console.warn(`[FS-WebFallback] Reading ${filename} from localStorage.`);
    const data = localStorage.getItem(filename);
    try {
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`[FS-WebFallback] Error parsing JSON from localStorage for ${filename}:`, e);
      return null;
    }
  }
  try {
    const result = await Filesystem.readFile({
      path: filename,
      directory: DATA_DIRECTORY,
      encoding: Encoding.UTF8,
    });

    let fileDataString;
    if (typeof result.data === 'string') {
      fileDataString = result.data;
    } else if (result.data instanceof Blob) { // Handle Blob case explicitly
      console.warn(`[FS] Read file ${filename} as Blob (likely on web), converting to string.`);
      fileDataString = await result.data.text();
    } else {
      console.error(`[FS] Read file ${filename} returned unexpected data type:`, typeof result.data);
      return null;
    }
    
    try {
      return JSON.parse(fileDataString);
    } catch (parseError) {
      console.error(`[FS] CRITICAL: Error parsing JSON from file ${filename}. Content snippet:`, fileDataString.substring(0, 200), "Error:", parseError);
      throw new Error(`Failed to parse JSON from ${filename}. File might be corrupt.`);
    }

  } catch (e) {
    if (e.message && (e.message === 'File does not exist' || e.message.includes('NOT_FOUND') || e.code === 'ENOENT')) {
      console.log(`[FS] File ${filename} not found, returning null.`);
      return null;
    }
    console.error(`[FS] Error in readFile operation for ${filename}:`, e);
    throw e; // Re-throw other/filesystem errors or our custom parse error
  }
}

export async function writeFile(filename, data) {
  if (!Capacitor.isNativePlatform()) {
    console.warn(`[FS-WebFallback] Writing ${filename} to localStorage.`);
    try {
      localStorage.setItem(filename, JSON.stringify(data));
    } catch (e) {
      console.error(`[FS-WebFallback] Error writing to localStorage for ${filename}:`, e);
      if (e.name === 'QuotaExceededError') {
        alert(`Web storage is full. Cannot save ${filename}.`);
      }
      throw e;
    }
    return;
  }
  try {
    await Filesystem.writeFile({
      path: filename,
      data: JSON.stringify(data),
      directory: DATA_DIRECTORY,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    console.log(`[FS] File ${filename} written successfully.`);
  } catch (e) {
    console.error(`[FS] Error writing file ${filename}:`, e);
    throw e;
  }
}

export async function deleteFsFile(filename) {
  if (!Capacitor.isNativePlatform()) {
    console.warn(`[FS-WebFallback] Deleting ${filename} from localStorage.`);
    localStorage.removeItem(filename);
    return;
  }
  try {
    await Filesystem.deleteFile({
      path: filename,
      directory: DATA_DIRECTORY,
    });
    console.log(`[FS] File ${filename} deleted successfully.`);
  } catch (e) {
    if (e.message === 'File does not exist' || e.message.includes('NOT_FOUND') || e.code === 'ENOENT') {
      console.log(`[FS] File ${filename} not found, no need to delete.`);
      return;
    }
    console.error(`[FS] Error deleting file ${filename}:`, e);
    // Not re-throwing here, as delete failure might not be critical in all cases
  }
}