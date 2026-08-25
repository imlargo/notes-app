import { MockNoteRepository } from "./memory-note-repository";
import { LocalStorageRepository } from "./local-note-repository";
import type { NoteRepository } from "./repository";

export type StorageType = "memory" | "local"

export function createRepository(type: StorageType): NoteRepository {
    return type === "local" ? new LocalStorageRepository() : new MockNoteRepository()
}
