import { randomColor, type Note } from "../domain/note";
import { sleep } from "../lib/sleep";
import type { NoteRepository } from "./repository";

// sleep just to fake network latency like the other repo
const STORAGE_KEY = "notes"

function loadNotes(): Note[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw) as Note[];
    } catch {
        return [];
    }
}

function saveNotes(notes: Note[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function generateNewID(notes: Note[]): number {
    return notes.reduce((max, n) => Math.max(max, n.id), 0) + 1;
}

export class LocalStorageRepository implements NoteRepository {

    async list(): Promise<Note[]> {
        await sleep(500);
        return loadNotes();
    }

    async create(note: Partial<Note>) {
        await sleep(500);;

        const notes = loadNotes();

        const newNote = {
            id: generateNewID(notes),
            ...note, 
            color: note.color ?? randomColor()
        } as Note

        notes.push(newNote)
        saveNotes(notes)

        return newNote
    }

    async delete(noteId: number) {
        await sleep(500);;
        const notes = loadNotes().filter(n => n.id !== noteId)
        saveNotes(notes)
    }

    async update(noteId: number, data: Partial<Note>) {
        const notes = loadNotes();

        const index = notes.findIndex((note) => note.id === noteId)
        const updated = {
            ...notes[index],
            ...data,
        }
        notes[index] = updated
        saveNotes(notes)
        return updated
    }
}