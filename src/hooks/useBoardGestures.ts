import { useCallback, useRef, useState, type PointerEvent } from "react";
import type { Note } from "../domain/note";
import { clampPoint, clampPosition, clampSize, contains, position, rectFromPoints, resize, subtract, toRect, type Point, type Rect, type Size } from "../domain/geometry";

// this is a ref ref and updates on every pointermove
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

interface BoardGesturesOptions {
    boardSize: () => Size
    getNote: (id: number) => Note | undefined
    // every frame and local
    preview: (id: number, changes: Partial<Note>) => void
    commit: (id: number, changes: Partial<Note>, rollback: Partial<Note>) => void
    onCreate: (rect: Rect) => void
    onDelete: (id: number) => void
    onSelect: (id: number | null) => void
}

export function useBoardGestures({ boardSize, getNote, preview, commit, onCreate, onDelete, onSelect }: BoardGesturesOptions) {
    const [draft, setDraft] = useState<Rect | null>(null)
    const [overTrash, setOverTrash] = useState(false)

    const trashRef = useRef<HTMLDivElement>(null)
    const boardOrigin = useRef<Point>({ x: 0, y: 0 })
    const gesture = useRef<Gesture | null>(null)

    const toLocal = useCallback((e: PointerEvent): Point =>
        subtract({ x: e.clientX, y: e.clientY }, boardOrigin.current), [])

    const trashRect = useCallback((): Rect | null => {
        const trash = trashRef.current?.getBoundingClientRect()
        if (!trash) return null
        return {
            ...subtract({ x: trash.left, y: trash.top }, boardOrigin.current),
            w: trash.width,
            h: trash.height
        }
    }, [])

    const endGesture = useCallback(() => {
        gesture.current = null
        setDraft(null)
        setOverTrash(false)
    }, [])

    const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement

        // anything interactive keeps its own behaviour instead of starting a drag
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

        // so we keep getting move/up events even if the cursor leaves the board
        e.currentTarget.setPointerCapture(e.pointerId)
    }, [getNote, onSelect, toLocal])

    const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
        const g = gesture.current
        if (!g) return
        const point = toLocal(e)
        const bounds = boardSize()

        if (g.kind === "create") {
            setDraft(rectFromPoints(g.origin, clampPoint(point, bounds)))
        } else if (g.kind === "move") {
            preview(g.id, position(movedTo(g, point, bounds)))
            const trash = trashRect()
            setOverTrash(trash !== null && contains(trash, point))
        } else if (g.kind === "resize") {
            preview(g.id, resizedTo(g, point, bounds))
        }
    }, [preview, boardSize, toLocal, trashRect])

    const onPointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
        const g = gesture.current
        if (!g) return
        const point = toLocal(e)

        if (g.kind === "create") {
            const rect = rectFromPoints(g.origin, point)
            if (rect.w > MIN_DRAWN_SIZE && rect.h > MIN_DRAWN_SIZE) onCreate(rect)
        } else if (g.kind === "move") {
            const trash = trashRect();
            if (trash && contains(trash, point)) {
                onDelete(g.id)
            } else {
                commit(g.id, position(movedTo(g, point, boardSize())), g.start)
            }
        } else {
            commit(g.id, resizedTo(g, point, boardSize()), g.start)
        }

        endGesture()
    }, [onCreate, onDelete, commit, boardSize, toLocal, trashRect, endGesture])

    const cancelGesture = useCallback(() => {
        const g = gesture.current
        if (!g) return
        if (g.kind !== "create") preview(g.id, g.start)
        endGesture()
    }, [preview, endGesture])

    return {
        trashRef,
        draft,
        overTrash,
        // reading the ref directly is fine, preview already rerenders on every move
        draggingId: gesture.current?.kind === "move" ? gesture.current.id : null,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        cancelGesture,
    }
}
