import { createDefaultSettings } from './defaultSettings'
import {
  normalizeSettings,
  type AppSettings,
} from './settings'

export const SETTINGS_STORAGE_KEY = 'music-notation-studio.settings'
const LEGACY_SETTINGS_STORAGE_KEY = 'piano-trainer.settings'

export function loadSettings(): AppSettings {
  const fallback = createDefaultSettings()

  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const storedValue = window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY)

    if (!storedValue) {
      return fallback
    }

    return normalizeSettings(JSON.parse(storedValue) as unknown, fallback)
  } catch {
    return fallback
  }
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage can be unavailable or full. Runtime settings remain usable.
  }
}
