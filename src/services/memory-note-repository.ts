import { randomColor, type Note } from "../domain/note";
import { sleep } from "../lib/sleep";
import type { NoteRepository } from "./repository";

function generateNewID(notes: Note[]): number {
    return notes.reduce((max, n) => Math.max(max, n.id), 0) + 1;
}

let _mockNotes: Note[] = [
    { id: 1, text: "Note 1", x: 10, y: 10, w: 150, h: 125 , color: randomColor()},
    { id: 2, text: "Note 2", x: 50, y: 10, w: 150, h: 125 , color: randomColor()},
    { id: 3, text: "Note 3", x: 300, y: 10, w: 150, h: 125, color: randomColor() }
]

export class MockNoteRepository implements NoteRepository {

    async list(): Promise<Note[]> {
        await sleep(500);

        return _mockNotes;
    }

    async create(note: Partial<Note>) {
        await sleep(500);;

        const newNote = {
            ...note,
            id: generateNewID(_mockNotes),
        } as Note
        _mockNotes.push(newNote)
        return newNote
    }

    async delete(noteId: number) {
        await sleep(500);;
        _mockNotes = _mockNotes.filter((note) => note.id !== noteId)
    }

    async update(noteId: number, data: Partial<Note> ) {
        const index = _mockNotes.findIndex((note) => note.id === noteId)
        const updated = {
            ..._mockNotes[index],
            ...data,
        }
        _mockNotes[index] = updated
        return updated
    }


    async _simulateDelay() {
        return new Promise((resolve) => setTimeout(resolve, 0))
    }
}