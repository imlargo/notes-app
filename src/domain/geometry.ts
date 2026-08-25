const MIN_NOTE_SIZE = 80

export type Point = { x: number, y: number }
export type Rect = { x: number, y: number, w: number, h: number }
export type Size = { w: number, h: number }

export function subtract(a: Point, b: Point): Point {
    return { x: a.x - b.x, y: a.y - b.y }
}

// the fields a move owns
export function position(r: Rect): Point {
    return { x: r.x, y: r.y }
}

// the fields a resize owns
export function toRect(r: Rect): Rect {
    return { x: r.x, y: r.y, w: r.w, h: r.h }
}

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
        h: Math.max(MIN_NOTE_SIZE, start.h + d.y)
    }
}

function clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max)
}

export function clampPoint(p: Point, bounds: Size): Point {
    return { x: clamp(p.x, 0, bounds.w), y: clamp(p.y, 0, bounds.h) }
}

// rect back inside the board
export function clampPosition(r: Rect, bounds: Size): Rect {
    return {
        ...r,
        x: clamp(r.x, 0, Math.max(0, bounds.w - r.w)),
        y: clamp(r.y, 0, Math.max(0, bounds.h - r.h)),
    }
}

// stops a rect from growing past the board
export function clampSize(r: Rect, bounds: Size): Rect {
    return {
        ...r,
        w: clamp(r.w, MIN_NOTE_SIZE, Math.max(MIN_NOTE_SIZE, bounds.w - r.x)),
        h: clamp(r.h, MIN_NOTE_SIZE, Math.max(MIN_NOTE_SIZE, bounds.h - r.y)),
    }
}

export function contains(r: Rect, p: Point): boolean {
    return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h
}