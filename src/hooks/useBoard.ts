import { useCallback, useEffect, useReducer, useRef, useState, type MouseEvent } from "react";
import { randomColor, type Note, type NoteColor } from "../domain/note";
import { NoteService } from "../services/note";
import { createRepository, type StorageType } from "../services/create-repository";
import { clampPosition, clampSize, position, resize, toRect, type Rect } from "../domain/geometry";
import { notesReducer } from "../state/notesReducer";
import { useBoardBounds } from "./useBoardBounds";
import { useBoardGestures } from "./useBoardGestures";

export function useBoard() {
    const [notes, dispatch] = useReducer(notesReducer, [])
    const notesRef = useRef(notes)
    useEffect(() => { notesRef.current = notes }, [notes])
    const [editingId, setEditingId] = useState<number | null>(null)
    const [pendingFocusId, setPendingFocusId] = useState<number | null>(null)
    const [announcement, setAnnouncement] = useState("")
    const [pendingCount, setPendingCount] = useState(0)
    const [storageType, setStorageType] = useState<StorageType>("memory")
    const [selectedColor, setSelectedColor] = useState<NoteColor>(() => randomColor())
    const [activeNoteId, setActiveNoteId] = useState<number | null>(null)

    const { boardRef, boardSize } = useBoardBounds()

    // negative so it doesnt collide with the repo
    const lastTempId = useRef(0)

    const noteService = useRef(new NoteService(createRepository("memory")))

    // notes changes on every pointermove, so anything that reads it through the closure gets a new
    // identity per frame and re-renders every note. Going through the ref keeps these stable
    const getNote = useCallback((id: number) => notesRef.current.find((n) => n.id === id), [])

    const withPending = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
        setPendingCount(c => c + 1)
        try {
            return await fn()
        } finally {
            setPendingCount(c => c - 1)
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

    const clearActive = useCallback(() => setActiveNoteId(null), [])

    const startEditing = useCallback((id: number) => {
        setEditingId(id)
    }, [])

    const onDoubleClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
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

    const activeNote = activeNoteId !== null ? notes.find((n) => n.id === activeNoteId) : undefined

    // one control, and the selection ring is what tells you which of the two it is about
    const selectColor = useCallback((color: NoteColor) => {
        if (!activeNote) return setSelectedColor(color)
        updateNote(activeNote.id, { color }, { color: activeNote.color })
    }, [activeNote, updateNote])

    // grows the note to fit the text
    const editNote = useCallback((id: number, changes: Partial<Note>) => {
        const note = getNote(id)
        if (!note) return
        const { h } = clampSize({ ...note, ...changes }, boardSize())
        patchNote(id, { ...changes, h })
    }, [getNote, boardSize, patchNote])

    const stopEditing = useCallback(() => {
        if (editingId === null) return

        const note = getNote(editingId)
        if (note) {
            updateNote(note.id, { text: note.text, h: note.h })
        }

        setEditingId(null)
    }, [editingId, getNote, updateNote])

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
        const offset = (notesRef.current.length % 6) * 24
        const created = await createNote({ x: 40 + offset, y: 40 + offset, w: 160, h: 130 })
        if (created) setPendingFocusId(created.id)
    }, [createNote])

    const deleteNote = useCallback(async (id: number) => {
        const deleted = getNote(id)
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
    }, [getNote, withPending])

    const moveNoteBy = useCallback((id: number, dx: number, dy: number) => {
        const note = getNote(id)
        if (!note) return
        const moved = clampPosition({ ...note, x: note.x + dx, y: note.y + dy }, boardSize())
        updateNote(id, position(moved), position(note))
    }, [getNote, boardSize, updateNote])

    const resizeNoteBy = useCallback((id: number, dw: number, dh: number) => {
        const note = getNote(id)
        if (!note) return
        const next = clampSize(resize(note, { x: dw, y: dh }), boardSize())
        updateNote(id, next, toRect(note))
    }, [getNote, boardSize, updateNote])


    const selectNote = useCallback((id: number | null) => {
        // grabbing a note both raises it and selects it
        if (id !== null) bringToFront(id)
        setActiveNoteId(id)
    }, [bringToFront])

    const {
        trashRef, draft, overTrash, draggingId,
        onPointerDown, onPointerMove, onPointerUp, cancelGesture,
    } = useBoardGestures({
        boardSize,
        getNote,
        preview: patchNote,
        commit: updateNote,
        onCreate: createNote,
        onDelete: deleteNote,
        onSelect: selectNote,
    })

    useEffect(() => {
        load()
    }, [load])

    // focus a note right after creating it via the add-note button, keyboard-only path
    useEffect(() => {
        if (pendingFocusId === null) return
        document.querySelector<HTMLElement>(`[data-note-id="${pendingFocusId}"]`)?.focus()
        setPendingFocusId(null)
    }, [pendingFocusId])

    return {
        notes,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        cancelGesture,
        onDoubleClick,
        editingId,
        overTrash,
        editNote,
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
        announcement,
        isLoading: pendingCount > 0,
        storageType,
        changeStorage,
        activeNoteId,
        activateNote: setActiveNoteId,
        deactivateNote: clearActive,
        toolbarColor: activeNote?.color ?? selectedColor,
        selectColor,
    }
}