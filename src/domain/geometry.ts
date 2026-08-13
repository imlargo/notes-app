const MIN_NOTE_SIZE = 80

export type Point = { x: number, y: number }
export type Rect = { x: number, y: number, w: number, h: number }

export function rectFromPoints(a: Point, b: Point): Rect {
    return {
        x: Math.min(a.x, b.x),
        y: Math.min(a.y, b.y),
        w: Math.abs(a.x - b.x),
        h: Math.abs(a.y - b.y),
    }
}

export function resize(start: Rect, d: Point): Rect {
    return {
        x: start.x,
        y: start.y,
        w: Math.max(MIN_NOTE_SIZE, start.w + d.x),
        h: Math.max(MIN_NOTE_SIZE, start.y + d.y)
    }
}

export function contains(r: Rect, p: Point): boolean {
    return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h
}