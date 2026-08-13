import type { MockNoteRepository } from "./note-repository";

export class NoteService {
    repository: MockNoteRepository;

    constructor(repository: MockNoteRepository) {
        this.repository = repository
    }

    async getNotes() {
        return this.repository.list();
    }
}