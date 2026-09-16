import { MockNoteRepository } from "./memory-note-repository";
import { LocalStorageRepository } from "./local-note-repository";
import type { NoteRepository } from "./repository";

export type StorageType = "memory" | "local"

const STORAGE_TYPE_KEY = "notes:storage"

export function createRepository(type: StorageType): NoteRepository {
    return type === "local" ? new LocalStorageRepository() : new MockNoteRepository()
}

// the choice outlives the tab, coming back to an empty board would read as lost notes
export function loadStorageType(): StorageType {
    return localStorage.getItem(STORAGE_TYPE_KEY) === "local" ? "local" : "memory"
}

export function saveStorageType(type: StorageType): void {
    localStorage.setItem(STORAGE_TYPE_KEY, type)
}
