import type { MockNoteRepository } from "./note-repository";

export class NoteService {
    _repository: MockNoteRepository;

    constructor(repository: MockNoteRepository) {
        this._repository = repository
    }

    async getNotes() {
        return this._repository.list();
    }
}