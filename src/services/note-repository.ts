import type { Note } from "../domain/note";

export class MockNoteRepository {

    async list(): Promise<Note[]> {
        await this._simulateDelay()
        return [
            { id: 1, text: "Note 1", x: 10, y: 10, w: 150, h: 125 },
            { id: 2, text: "Note 2", x: 50, y: 10, w: 150, h: 125 },
            { id: 3, text: "Note 3", x: 300, y: 10, w: 150, h: 125 }
        ];
    }

    async _simulateDelay() {
        return new Promise((resolve) => setTimeout(resolve, 500))
    }
}