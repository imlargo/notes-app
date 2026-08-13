import type { Note } from "../domain/note";

export class MockNoteRepository {

    async list(): Promise<Note[]> {
        await this._simulateDelay()
        return [
            { id: 1, text: "Note 1", color: "red", x: 10, y: 10, w: 100, h: 100 },
            { id: 2, text: "Note 2", color: "blue", x: 50, y: 10, w: 100, h: 100 },
            { id: 3, text: "Note 3", color: "green", x: 300, y: 10, w: 100, h: 100 }
        ];
    }

    async _simulateDelay() {
        return new Promise((resolve) => setTimeout(resolve, 500))
    }
}