/**
 * localStorage access, kept in one place and always guarded.
 *
 * Storage can be unavailable (private windows, blocked site data) and can hold
 * a payload written by an older version of the app, so every read is wrapped
 * and a version mismatch is treated as "no saved state" rather than an error.
 */

const STORAGE_KEY = 'novastudio.demo.v1';
const STORAGE_VERSION = 1;

interface Envelope<T> {
  version: number;
  savedAt: string;
  payload: T;
}

export function readPersisted<T>(): T | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as Envelope<T>;
    if (envelope.version !== STORAGE_VERSION) return null;
    return envelope.payload;
  } catch {
    return null;
  }
}

export function writePersisted<T>(payload: T): boolean {
  try {
    const envelope: Envelope<T> = {
      version: STORAGE_VERSION,
      savedAt: new Date().toISOString(),
      payload,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    // Quota exceeded or storage disabled — the app keeps working in memory.
    return false;
  }
}

export function clearPersisted(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do; the caller resets in-memory state either way.
  }
}

export function persistedSavedAt(): string | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as Envelope<unknown>).savedAt ?? null;
  } catch {
    return null;
  }
}
