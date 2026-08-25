import type { Note } from "../domain/note";

export type Action =
    | { type: "load", notes: Note[] }
    | { type: "add", note: Note }
    | { type: "patch", id: number, changes: Partial<Note> }
    | { type: "remove", id: number }
    | { type: "replace", id: number, note: Note }
    | { type: "bringToFront", id: number }




export function notesReducer(state: Note[], action: Action): Note[] {
    switch (action.type) {
        case "load":

            return action.notes;

        case "add":
            return [...state, action.note]

        case "patch":
            return state.map((n) => n.id === action.id ? {
                ...n,
                ...action.changes
            } : n)
        case "remove":
            return state.filter((n) => n.id !== action.id)

        case "replace":
            return state.map((n) => n.id === action.id ? action.note : n)

        case "bringToFront": {
            // z order is just array order, moving to front = moving to the end
            const note = state.find((n) => n.id === action.id)
            if (!note) return state
            if (state[state.length - 1]?.id === action.id) return state

            return [...state.filter(n => n.id !== action.id), note]
        }
    }

}