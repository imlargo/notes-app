import { randomColor, type Note } from "../domain/note";
import { sleep } from "../lib/sleep";
import type { NoteRepository } from "./repository";

let _mockNotes: Note[] = [
    { id: 1, text: "Note 1", x: 10, y: 10, w: 150, h: 125 , color: randomColor()},
    { id: 2, text: "Note 2", x: 50, y: 10, w: 150, h: 125 , color: randomColor()},
    { id: 3, text: "Note 3", x: 300, y: 10, w: 150, h: 125, color: randomColor() }
]

// counter instead of max(ids)+1 so we don't reuse an id after a delete
let _nextId = _mockNotes.reduce((max, n) => Math.max(max, n.id), 0) + 1;

export class MockNoteRepository implements NoteRepository {

    async list(): Promise<Note[]> {
        await sleep(500);

        return [..._mockNotes];
    }

    async create(note: Partial<Note>) {
        const newNote = {
            ...note,
            id: _nextId++,
        } as Note

        await sleep(500);

        _mockNotes.push(newNote)
        return newNote
    }

    async delete(noteId: number) {
        await sleep(500);;
        _mockNotes = _mockNotes.filter((note) => note.id !== noteId)
    }

    async update(noteId: number, data: Partial<Note> ) {
        await sleep(500);

        const index = _mockNotes.findIndex((note) => note.id === noteId)
        if (index === -1) throw new Error(`Note ${noteId} does not exist`)

        const updated = {
            ..._mockNotes[index],
            ...data,
        }
        _mockNotes[index] = updated
        return updated
    }
}