import { clampPosition, clampSize, toRect, type Size } from "../domain/geometry";
import type { Note } from "../domain/note";

export type Action =
    | { type: "load", notes: Note[] }
    | { type: "add", note: Note }
    | { type: "patch", id: number, changes: Partial<Note> }
    | { type: "remove", id: number }
    | { type: "reassignId", from: number, to: number }
    | { type: "bringToFront", id: number }
    | { type: "clamp", bounds: Size }


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

        case "reassignId":
            return state.map((n) => n.id === action.from ? { ...n, id: action.to } : n)

        case "clamp": {
            let changed = false
            const next = state.map((n) => {
                const inside = clampSize(clampPosition(n, action.bounds), action.bounds)
                if (inside.x === n.x && inside.y === n.y && inside.w === n.w && inside.h === n.h) return n
                changed = true
                return { ...n, ...toRect(inside) }
            })
            return changed ? next : state
        }

        case "bringToFront": {
            // z order is just array order, moving to front = moving to the end
            const note = state.find((n) => n.id === action.id)
            if (!note) return state
            if (state[state.length - 1]?.id === action.id) return state

            return [...state.filter(n => n.id !== action.id), note]
        }
    }

}