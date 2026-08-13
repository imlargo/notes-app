import type { Note } from "../domain/note";
import type { NoteRepository } from "./repository";

export class NoteService {
    repository: NoteRepository;

    constructor(repository: NoteRepository) {
        this.repository = repository
    }

    async getNotes() {
        return this.repository.list();
    }

    async createNote(note: Partial<Note>): Promise<Note> {
        const created = this.repository.create(note)
        return created
    }

    async updateNote(id: number, data: Partial<Note>): Promise<Note> {
        return this.repository.update(id, data)
    }

    async deleteNote(id: number) {
        return this.repository.delete(id)
    }
}