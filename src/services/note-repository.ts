import type { Note } from "../domain/note";

let _mockNotes = [
    { id: 1, text: "Note 1", x: 10, y: 10, w: 150, h: 125 },
    { id: 2, text: "Note 2", x: 50, y: 10, w: 150, h: 125 },
    { id: 3, text: "Note 3", x: 300, y: 10, w: 150, h: 125 }
]

export class MockNoteRepository {

    async list(): Promise<Note[]> {
        await this._simulateDelay()

        return _mockNotes;
    }


    async create(note: Note) {
        await this._simulateDelay();

        _mockNotes.push(note)
        return
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