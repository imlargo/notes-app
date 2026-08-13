import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { randomColor, type Note } from "../domain/note";
import { NoteService } from "../services/note";
import { MockNoteRepository } from "../services/memory-note-repository";
import { contains, rectFromPoints, resize, type Point, type Rect } from "../domain/geometry";
import { notesReducer } from "../state/notesReducer";

// ref not state, this updates on every pointermove
type Gesture =
    | { kind: "create", origin: Point }
    | { kind: "move", id: number, grab: Point }
    | { kind: "resize", id: number, start: Rect, from: Point }


export function useBoard() {
    const [notes, dispatch] = useReducer(notesReducer, [])
    const [draft, setDraft] = useState<Rect | null>(null)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [overTrash, setOverTrash] = useState<boolean>(false)

    const trashRef = useRef<HTMLDivElement>(null)

    const boardOrigin = useRef<Point>({ x: 0, y: 0 })
    const gesture = useRef<Gesture | null>(null)

    const noteService = useRef(new NoteService(new MockNoteRepository()))

    const toLocal = useCallback((e: React.PointerEvent): Point => ({
        x: e.clientX - boardOrigin.current.x,
        y: e.clientY - boardOrigin.current.y,
    }), [])

    const trashRect = useCallback((): Rect | null => {
        const trash = trashRef.current?.getBoundingClientRect()
        if (!trash) return null
        return {
            x: trash.left - boardOrigin.current.x,
            y: trash.top - boardOrigin.current.y,
            w: trash.width,
            h: trash.height
        }
    }, [])

    const bringToFront = useCallback((id: number) => {
        dispatch({
            type: "bringToFront",
            id: id,
        })
    }, [])


    const load = useCallback(() => {
        noteService.current.getNotes().then((data) => dispatch({ type: "load", notes: data }))
    }, [])



    const onDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement
        const noteEl = target.closest<HTMLDivElement>("[data-note-id]")
        if (noteEl) setEditingId(parseInt(noteEl.dataset.noteId || "0"))
    }, [])


    const patchNote = useCallback((id: number, changes: Partial<Note>) => {
        dispatch({
            type: "patch",
            id,
            changes
        })
    }, [])


    // this actually persists it, patchNote above is just the optimistic update
    const updateNote = useCallback(async (id: number, note: Partial<Note>) => {
        const updated = await noteService.current.updateNote(id, note)
        patchNote(id, updated)
    }, [patchNote])

    const stopEditing = useCallback(() => {
        if (editingId === null) return

        const note = notes.find((n) => n.id === editingId)
        if (note) {
            updateNote(note.id, note)
        }

        setEditingId(null)
    }, [editingId, notes, updateNote])

    const createNote = useCallback(async (rect: Rect) => {
        const created = await noteService.current.createNote({ ...rect, color: randomColor() })
        dispatch({
            type: "add",
            note: created
        })
    }, [])


    const deleteNote = useCallback(async (id: number) => {
        await noteService.current.deleteNote(id)
        dispatch({
            type: "remove",
            id
        })

        setEditingId((curr) => curr === id ? null : curr)
    }, [])


    const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement

        if (target.closest("textarea")) return

        const r = e.currentTarget.getBoundingClientRect();
        boardOrigin.current = { x: r.left, y: r.top }
        const point = toLocal(e)

        // resize handle overlaps the note so it has to win the hit test first
        const isResize = target.closest("[data-resize-handle]") !== null
        const noteEl = target.closest<HTMLDivElement>("[data-note-id]")
        const note = noteEl ? notes.find((n) => n.id === parseInt(noteEl.dataset.noteId || "0")) : undefined

        if (note) {
            bringToFront(note.id)
        }

        if (note && isResize) {
            gesture.current = {
                kind: "resize",
                id: note.id,
                start: { x: note.x, y: note.y, w: note.w, h: note.h },
                from: point,
            }
        } else if (note) {
            gesture.current = {
                kind: "move",
                id: note.id,
                grab: { x: point.x - note.x, y: point.y - note.y }
            }
        } else {
            gesture.current = { kind: "create", origin: point }
        }

        // so we keep getting move/up events even if the cursor leaves the board
        e.currentTarget.setPointerCapture(e.pointerId)
    }, [notes, bringToFront, toLocal])

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const g = gesture.current
        if (!g) return
        const point = toLocal(e)

        if (g.kind === "create") {
            setDraft(rectFromPoints(g.origin, point))
        } else if (g.kind === "move") {
            patchNote(g.id, { x: point.x - g.grab.x, y: point.y - g.grab.y })
            const trash = trashRect()
            setOverTrash(trash !== null && contains(trash, point))
        } else if (g.kind === "resize") {
            const d: Point = { x: point.x - g.from.x, y: point.y - g.from.y }
            const rect = resize(g.start, d)
            patchNote(g.id, { ...rect })
        }
    }, [patchNote, toLocal, trashRect])

    const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const g = gesture.current
        if (!g) return
        const point = toLocal(e)

        if (g.kind === "create") {
            const rect = rectFromPoints(g.origin, point)
            if (rect.w > 8 && rect.h > 8) {
                createNote(rect)
            }
        } else if (g.kind === "move") {
            const trash = trashRect();
            if (trash && contains(trash, point)) {
                deleteNote(g.id)
            } else {
                const note = notes.find(n => n.id === g.id)
                if (note) updateNote(note.id, note)
            }
        } else {
            const note = notes.find(n => n.id === g.id)
            if (note) updateNote(note.id, note)
        }

        gesture.current = null
        setDraft(null)
    }, [notes, createNote, deleteNote, updateNote, toLocal, trashRect])


    useEffect(() => {
        load()
    }, [load])

    // reading the ref directly is fine, patchNote already rerenders on every move
    const draggingId = gesture.current?.kind === "move" ? gesture.current.id : null

    return {
        notes,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onDoubleClick,
        editingId,
        overTrash,
        patchNote,
        stopEditing,
        draft,
        draggingId,
        trashRef
    }
}