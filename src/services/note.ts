import type { Note } from "../domain/note";
import type { MockNoteRepository } from "./note-repository";

export class NoteService {
    _repository: MockNoteRepository;

    constructor(repository: MockNoteRepository) {
        this._repository = repository
    }

    async getNotes() {
        return this._repository.list();
    }

    async createNote(note: Partial<Note>): Promise<Note> {
        const created = this._repository.create(note)
        return created
    }
}