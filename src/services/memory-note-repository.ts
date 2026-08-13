import { randomColor, type Note } from "../domain/note";
import { sleep } from "../lib/sleep";
import type { NoteRepository } from "./repository";

let idcounter = 3;

function generateNewID() {
    const newID = idcounter + 1
    idcounter += 1
    return newID
}

let _mockNotes = [
    { id: generateNewID(), text: "Note 1", x: 10, y: 10, w: 150, h: 125 , color: randomColor()},
    { id: generateNewID(), text: "Note 2", x: 50, y: 10, w: 150, h: 125 , color: randomColor()},
    { id: generateNewID(), text: "Note 3", x: 300, y: 10, w: 150, h: 125, color: randomColor() }
]

export class MockNoteRepository implements NoteRepository {

    async list(): Promise<Note[]> {
        await sleep(500);

        return _mockNotes;
    }

    async create(note: Partial<Note>) {
        await sleep(500);;
        const id: number = generateNewID()

        const newNote = note as Note
        newNote.id =  id
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