import type { Note } from "../domain/note";

export interface NoteRepository {
    list(): Promise<Note[]>;
    create(note: Partial<Note>): Promise<Note>;
    delete(noteId: number): void;
    update(noteId: number, data: Partial<Note> ): Promise<Note>;
}