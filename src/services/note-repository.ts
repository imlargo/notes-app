import type { Note } from "../domain/note";

export class MockNoteRepository {

    async list(): Promise<Note[]> {
        await this._simulateDelay()
        return [];
    }

    async _simulateDelay() {
        return new Promise((resolve) => setTimeout(() => resolve, 500))
    }
}