import type { Note } from "../domain/note"

export const note = (id: number, over: Partial<Note> = {}): Note =>
({ id, text: `note ${id}`, x: 0, y: 0, w: 100, h: 100, color: "sky", ...over })

export const draft = (over: Partial<Note> = {}): Omit<Note, "id"> =>
({ text: "", x: 0, y: 0, w: 100, h: 100, color: "sky", ...over })
