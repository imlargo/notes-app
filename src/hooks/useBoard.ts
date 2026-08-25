import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { randomColor, nextColor, type Note, type NoteColor } from "../domain/note";
import { NoteService } from "../services/note";
import { MockNoteRepository } from "../services/memory-note-repository";
import { LocalStorageRepository } from "../services/local-note-repository";
import type { NoteRepository } from "../services/repository";
import { clampPoint, clampPosition, clampSize, contains, rectFromPoints, resize, type Point, type Rect, type Size } from "../domain/geometry";
import { notesReducer } from "../state/notesReducer";

// ref not state, this updates on every pointermove
type Gesture =
    | { kind: "create", origin: Point }
    | { kind: "move", id: number, grab: Point, start: Rect }
    | { kind: "resize", id: number, start: Rect, from: Point }

export type StorageType = "memory" | "local"

function createRepository(type: StorageType): NoteRepository {
    return type === "local" ? new LocalStorageRepository() : new MockNoteRepository()
}


export function useBoard() {
    const [notes, dispatch] = useReducer(notesReducer, [])
    const [draft, setDraft] = useState<Rect | null>(null)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [overTrash, setOverTrash] = useState<boolean>(false)
    const [pendingFocusId, setPendingFocusId] = useState<number | null>(null)
    const [announcement, setAnnouncement] = useState("")
    const [pendingCount, setPendingCount] = useState(0)
    const [storageType, setStorageType] = useState<StorageType>("memory")
    const [selectedColor, setSelectedColor] = useState<NoteColor>(() => randomColor())
    const [activeNoteId, setActiveNoteId] = useState<number | null>(null)

    const trashRef = useRef<HTMLDivElement>(null)

    const boardRef = useRef<HTMLDivElement>(null)
    const boardOrigin = useRef<Point>({ x: 0, y: 0 })
    const gesture = useRef<Gesture | null>(null)

    // negative so it doesnt collide with the repo
    const lastTempId = useRef(0)

    const noteService = useRef(new NoteService(createRepository("memory")))

    const withPending = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
        setPendingCount(c => c + 1)
        try {
            return await fn()
        } finally {
            setPendingCount(c => c - 1)
        }
    }, [])

    const toLocal = useCallback((e: React.PointerEvent): Point => ({
        x: e.clientX - boardOrigin.current.x,
        y: e.clientY - boardOrigin.current.y,
    }), [])

    const boardSize = useCallback((): Size => {
        const r = boardRef.current?.getBoundingClientRect()
        return r ? { w: r.width, h: r.height } : { w: Infinity, h: Infinity }
    }, [])

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
        withPending(() => noteService.current.getNotes())
            .then((data) => dispatch({ type: "load", notes: data }))
            .catch(() => setAnnouncement("Could not load the notes"))
    }, [withPending])

    // swaps the backend and reloads from it, super simple, no migration between the two
    const changeStorage = useCallback((type: StorageType) => {
        setStorageType(type)
        noteService.current = new NoteService(createRepository(type))
        load()
    }, [load])

    const startEditing = useCallback((id: number) => {
        setEditingId(id)
    }, [])

    const activateNote = useCallback((id: number) => {
        setActiveNoteId(id)
    }, [])

    const onDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement
        const noteEl = target.closest<HTMLDivElement>("[data-note-id]")
        if (noteEl) startEditing(parseInt(noteEl.dataset.noteId || "0"))
    }, [startEditing])


    const patchNote = useCallback((id: number, changes: Partial<Note>) => {
        dispatch({
            type: "patch",
            id,
            changes
        })
    }, [])


    // only patch changed fields
    const updateNote = useCallback(async (id: number, changes: Partial<Note>, rollback?: Partial<Note>) => {
        patchNote(id, changes)
        try {
            await withPending(() => noteService.current.updateNote(id, changes))
        } catch {
            if (rollback) patchNote(id, rollback)
            setAnnouncement("Could not save the note")
        }
    }, [patchNote, withPending])

    // if a note is active it changes the color, otherwise changes the color of the next new note
    const cycleColor = useCallback(() => {
        const active = activeNoteId !== null ? notes.find(n => n.id === activeNoteId) : undefined
        if (active) {
            const next = { color: nextColor(active.color) }
            updateNote(active.id, next, { color: active.color })
        } else {
            setSelectedColor((c) => nextColor(c))
        }
    }, [activeNoteId, notes, updateNote])

    const stopEditing = useCallback(() => {
        if (editingId === null) return

        const note = notes.find((n) => n.id === editingId)
        if (note) {
            updateNote(note.id, { text: note.text })
        }

        setEditingId(null)
    }, [editingId, notes, updateNote])

    // optimistic
    const createNote = useCallback(async (rect: Rect): Promise<Note | null> => {
        const draft = { ...rect, text: "", color: selectedColor }
        const tempId = --lastTempId.current

        dispatch({ type: "add", note: { ...draft, id: tempId } })
        setAnnouncement("Note created")

        try {
            const created = await withPending(() => noteService.current.createNote(draft))
            dispatch({ type: "replace", id: tempId, note: created })
            return created
        } catch {
            dispatch({ type: "remove", id: tempId })
            setAnnouncement("Could not create the note")
            return null
        }
    }, [withPending, selectedColor])

    // keyboard-only way to create a note, since drag-to-create has no keyboard equivalent
    const addNote = useCallback(async () => {
        const offset = (notes.length % 6) * 24
        const created = await createNote({ x: 40 + offset, y: 40 + offset, w: 160, h: 130 })
        if (created) setPendingFocusId(created.id)
    }, [notes.length, createNote])

    const deleteNote = useCallback(async (id: number) => {
        const deleted = notes.find(n => n.id === id)
        if (!deleted) return

        dispatch({ type: "remove", id })
        setEditingId((curr) => curr === id ? null : curr)
        setActiveNoteId((curr) => curr === id ? null : curr)
        setAnnouncement("Note deleted")

        try {
            await withPending(() => noteService.current.deleteNote(id))
        } catch {
            dispatch({ type: "add", note: deleted })
            setAnnouncement("Could not delete the note")
        }
    }, [notes, withPending])

    const moveNoteBy = useCallback((id: number, dx: number, dy: number) => {
        const note = notes.find(n => n.id === id)
        if (!note) return
        const moved = clampPosition({ ...note, x: note.x + dx, y: note.y + dy }, boardSize())
        updateNote(id, { x: moved.x, y: moved.y }, { x: note.x, y: note.y })
    }, [notes, boardSize, updateNote])

    const resizeNoteBy = useCallback((id: number, dw: number, dh: number) => {
        const note = notes.find(n => n.id === id)
        if (!note) return
        const next = clampSize(resize(note, { x: dw, y: dh }), boardSize())
        updateNote(id, next, { x: note.x, y: note.y, w: note.w, h: note.h })
    }, [notes, boardSize, updateNote])


    const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement

        // anything interactive keeps its own behaviour instead of starting a drag
        if (target.closest("textarea, button, a, select")) return

        const r = e.currentTarget.getBoundingClientRect();
        boardOrigin.current = { x: r.left, y: r.top }
        const point = toLocal(e)

        // resize handle overlaps the note so it has to win the hit test first
        const isResize = target.closest("[data-resize-handle]") !== null
        const noteEl = target.closest<HTMLDivElement>("[data-note-id]")
        const note = noteEl ? notes.find((n) => n.id === parseInt(noteEl.dataset.noteId || "0")) : undefined

        if (note) {
            bringToFront(note.id)
            setActiveNoteId(note.id)
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
                grab: { x: point.x - note.x, y: point.y - note.y },
                start: { x: note.x, y: note.y, w: note.w, h: note.h },
            }
        } else {
            // clicking the background clears the selection
            setActiveNoteId(null)
            gesture.current = { kind: "create", origin: point }
        }

        // so we keep getting move/up events even if the cursor leaves the board
        e.currentTarget.setPointerCapture(e.pointerId)
    }, [notes, bringToFront, toLocal])

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const g = gesture.current
        if (!g) return
        const point = toLocal(e)

        const bounds = boardSize()

        if (g.kind === "create") {
            setDraft(rectFromPoints(g.origin, clampPoint(point, bounds)))
        } else if (g.kind === "move") {
            const moved = clampPosition({ ...g.start, x: point.x - g.grab.x, y: point.y - g.grab.y }, bounds)
            patchNote(g.id, { x: moved.x, y: moved.y })
            const trash = trashRect()
            setOverTrash(trash !== null && contains(trash, point))
        } else if (g.kind === "resize") {
            const d: Point = { x: point.x - g.from.x, y: point.y - g.from.y }
            patchNote(g.id, clampSize(resize(g.start, d), bounds))
        }
    }, [patchNote, boardSize, toLocal, trashRect])

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
                if (note) updateNote(note.id, { x: note.x, y: note.y }, g.start)
            }
        } else {
            const note = notes.find(n => n.id === g.id)
            if (note) {
                const { x, y, w, h } = note
                updateNote(note.id, { x, y, w, h }, g.start)
            }
        }

        gesture.current = null
        setDraft(null)
    }, [notes, createNote, deleteNote, updateNote, toLocal, trashRect])


    useEffect(() => {
        load()
    }, [load])

    // focus a note right after creating it via the add-note button, keyboard-only path
    useEffect(() => {
        if (pendingFocusId === null) return
        document.querySelector<HTMLElement>(`[data-note-id="${pendingFocusId}"]`)?.focus()
        setPendingFocusId(null)
    }, [pendingFocusId])

    // reading the ref directly is fine, patchNote already rerenders on every move
    const draggingId = gesture.current?.kind === "move" ? gesture.current.id : null

    const activeNote = activeNoteId !== null ? notes.find(n => n.id === activeNoteId) : undefined
    const toolbarColor = activeNote?.color ?? selectedColor

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
        boardRef,
        trashRef,
        addNote,
        moveNoteBy,
        resizeNoteBy,
        deleteNote,
        startEditing,
        activateNote,
        announcement,
        isLoading: pendingCount > 0,
        storageType,
        changeStorage,
        toolbarColor,
        cycleColor,
    }
}