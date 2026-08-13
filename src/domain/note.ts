import type { Rect } from "./geometry"


export type Note = {
    id: number;
    text: string;
    color: string;
} & Rect