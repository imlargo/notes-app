import { useCallback, useRef, useState, type PointerEvent } from "react";
import type { Note } from "../domain/note";
import { bottomRight, clampPoint, clampPosition, clampSize, contains, distanceTo, position, rectFromPoints, resize, subtract, toRect, type Point, type Rect, type Size } from "../domain/geometry";

type Gesture =
    | { kind: "create", origin: Point }
    | { kind: "move", id: number, grab: Point, start: Rect }
    | { kind: "resize", id: number, start: Rect, from: Point }

function movedTo(g: Extract<Gesture, { kind: "move" }>, point: Point, bounds: Size): Rect {
    return clampPosition({ ...g.start, ...subtract(point, g.grab) }, bounds)
}

function resizedTo(g: Extract<Gesture, { kind: "resize" }>, point: Point, bounds: Size): Rect {
    return clampSize(resize(g.start, subtract(point, g.from)), bounds)
}

const MIN_DRAWN_SIZE = 8
const DRAG_THRESHOLD = 4 // how far a press has to travel before it counts as a drag
const TRASH_SLACK = 32 // the zone reaches past the icon, so the corner of the board lands inside it
const TRASH_REACH = 120 // how close the note gets before the zone starts pulling it in

// the note is clamped inside the board,    so what reaches the trash is its corner, never the pointer
type Drag = { id: number, pull: number, pivot: Point }

interface BoardGesturesOptions {
    boardSize: () => Size
    getNote: (id: number) => Note | undefined
    preview: (id: number, changes: Partial<Note>) => void
    commit: (id: number, changes: Partial<Note>, rollback: Partial<Note>) => void
    onCreate: (rect: Rect) => void
    onDelete: (id: number) => void
    onSelect: (id: number | null) => void
}

export function useBoardGestures({ boardSize, getNote, preview, commit, onCreate, onDelete, onSelect }: BoardGesturesOptions) {
    const [draft, setDraft] = useState<Rect | null>(null)
    const [drag, setDrag] = useState<Drag | null>(null)

    const trashRef = useRef<HTMLDivElement>(null)
    const boardOrigin = useRef<Point>({ x: 0, y: 0 })
    const gesture = useRef<Gesture | null>(null)
    const pendingCapture = useRef<Point | null>(null)

    const toLocal = useCallback((e: PointerEvent): Point =>
        subtract({ x: e.clientX, y: e.clientY }, boardOrigin.current), [])

    const trashZone = useCallback((): Rect | null => {
        const trash = trashRef.current?.getBoundingClientRect()
        if (!trash) return null
        return {
            ...subtract({ x: trash.left - TRASH_SLACK, y: trash.top - TRASH_SLACK }, boardOrigin.current),
            w: trash.width + 2 * TRASH_SLACK,
            h: trash.height + 2 * TRASH_SLACK,
        }
    }, [])

    const endGesture = useCallback(() => {
        gesture.current = null
        pendingCapture.current = null
        setDraft(null)
        setDrag(null)
    }, [])

    const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement

        if (target.closest("textarea, button, a, select, [data-no-drag]")) return

        const r = e.currentTarget.getBoundingClientRect();
        boardOrigin.current = { x: r.left, y: r.top }
        const point = toLocal(e)

        // resize handle overlaps the note so it has to win the hit test first
        const isResize = target.closest("[data-resize-handle]") !== null
        const noteEl = target.closest<HTMLDivElement>("[data-note-id]")
        const note = noteEl ? getNote(parseInt(noteEl.dataset.noteId || "0")) : undefined

        onSelect(note ? note.id : null)

        if (note && isResize) {
            gesture.current = { kind: "resize", id: note.id, start: toRect(note), from: point }
        } else if (note) {
            gesture.current = { kind: "move", id: note.id, grab: subtract(point, position(note)), start: toRect(note) }
        } else {
            gesture.current = { kind: "create", origin: point }
        }

        pendingCapture.current = point
    }, [getNote, onSelect, toLocal])

    const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
        const g = gesture.current
        if (!g) return
        const point = toLocal(e)
        const bounds = boardSize()

        const pending = pendingCapture.current
        if (pending) {
            if (Math.hypot(point.x - pending.x, point.y - pending.y) < DRAG_THRESHOLD) return
            pendingCapture.current = null
            e.currentTarget.setPointerCapture(e.pointerId)
        }

        if (g.kind === "create") {
            setDraft(rectFromPoints(g.origin, clampPoint(point, bounds)))
        } else if (g.kind === "move") {
            const moved = movedTo(g, point, bounds)
            preview(g.id, position(moved))

            const zone = trashZone()
            setDrag({
                id: g.id,
                pull: zone ? Math.max(0, 1 - distanceTo(zone, bottomRight(moved)) / TRASH_REACH) : 0,
                pivot: subtract(point, position(moved)), // where the cursor is inside the note
            })
        } else if (g.kind === "resize") {
            preview(g.id, resizedTo(g, point, bounds))
        }
    }, [preview, boardSize, toLocal, trashZone])

    const onPointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
        const g = gesture.current
        if (!g) return

        if (pendingCapture.current) return endGesture()

        const point = toLocal(e)

        if (g.kind === "create") {
            const rect = rectFromPoints(g.origin, clampPoint(point, boardSize()))
            if (rect.w > MIN_DRAWN_SIZE && rect.h > MIN_DRAWN_SIZE) onCreate(rect)
        } else if (g.kind === "move") {
            const moved = movedTo(g, point, boardSize())
            const zone = trashZone()

            if (zone && contains(zone, bottomRight(moved))) {
                onDelete(g.id)
            } else if (moved.x !== g.start.x || moved.y !== g.start.y) {
                commit(g.id, position(moved), g.start)
            }
        } else {
            const resized = resizedTo(g, point, boardSize())
            if (resized.w !== g.start.w || resized.h !== g.start.h) commit(g.id, resized, g.start)
        }

        endGesture()
    }, [onCreate, onDelete, commit, boardSize, toLocal, trashZone, endGesture])

    const cancelGesture = useCallback(() => {
        const g = gesture.current
        if (!g) return
        if (g.kind !== "create") preview(g.id, g.start)
        endGesture()
    }, [preview, endGesture])

    return {
        trashRef,
        draft,
        drag,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        cancelGesture,
    }
}
