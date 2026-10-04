import { setEnabled } from 'cuelume'

// Cuelume leaves preference storage to the app; this keeps the footer's
// sound toggle across visits.
const KEY = 'sound-enabled'

export function readSoundEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'false'
  } catch {
    return true
  }
}

export function applySoundEnabled(enabled: boolean) {
  setEnabled(enabled)
  try {
    localStorage.setItem(KEY, String(enabled))
  } catch {
    // Storage blocked (private mode): the choice lasts for this visit only
  }
}
