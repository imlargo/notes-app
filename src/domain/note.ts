import type { Rect } from "./geometry"

export const NOTE_COLORS = ["indigo", "amber", "rose", "emerald", "sky", "fuchsia", "lime"]
export type NoteColor = (typeof NOTE_COLORS)[number]

export const COLOR_CLASSES: Record<NoteColor, string> = {
    "indigo": "bg-indigo-200",
    "amber": "bg-amber-200",
    "rose": "bg-rose-200",
    "emerald": "bg-emerald-200",
    "sky": "bg-sky-200",
    "fuchsia": "bg-fuchsia-200",
    "lime": "bg-lime-200",
}

export function randomColor() {
    return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
}

export function nextColor(current: NoteColor) {
    const i = NOTE_COLORS.indexOf(current)
    return NOTE_COLORS[(i + 1) % NOTE_COLORS.length]
}

export type Note = {
    id: number;
    text: string;
    color: NoteColor;
} & Rect