import type { Rect } from "./geometry"

const NOTE_COLORS = ["indigo", "amber", "rose", "emerald", "sky"]
export type NoteColor = (typeof NOTE_COLORS)[number]

export function randomColor() {
    return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
}

export type Note = {
    id: number;
    text: string;
    color: NoteColor;
} & Rect