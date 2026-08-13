import type { Note } from "../domain/note";

let idcounter = 3;

function generateNewID() {
    const newID = idcounter + 1
    idcounter += 1
    return newID
}

let _mockNotes = [
    { id: generateNewID(), text: "Note 1", x: 10, y: 10, w: 150, h: 125 },
    { id: generateNewID(), text: "Note 2", x: 50, y: 10, w: 150, h: 125 },
    { id: generateNewID(), text: "Note 3", x: 300, y: 10, w: 150, h: 125 }
]

export class MockNoteRepository {

    async list(): Promise<Note[]> {
        await this._simulateDelay()

        return _mockNotes;
    }

    async create(note: Partial<Note>) {
        //await this._simulateDelay();
        const id: number = generateNewID()

        const newNote = note as Note
        newNote.id =  id
        _mockNotes.push(newNote)
        return newNote
    }

    async delete(noteId: number) {
        await this._simulateDelay();
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
        return new Promise((resolve) => setTimeout(resolve, 500))
    }
}