import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { randomColor, type Note, type NoteColor } from "../domain/note";
import { clampPosition, clampSize, position, resize, toRect, type Rect } from "../domain/geometry";
import { useNotes } from "./useNotes";
import { useBoardBounds } from "./useBoardBounds";
import { useBoardGestures } from "./useBoardGestures";

const NEW_NOTE = { w: 160, h: 130 }

export function useBoard() {
    const {
        notes, getNote, bringToFront, patchNote, updateNote, createNote, removeNote,
        announcement, isLoading, storageType, changeStorage,
    } = useNotes()

    const { boardRef, boardSize } = useBoardBounds()

    const [editingId, setEditingId] = useState<number | null>(null)
    const [activeNoteId, setActiveNoteId] = useState<number | null>(null)
    const [pendingFocusId, setPendingFocusId] = useState<number | null>(null)
    const [selectedColor, setSelectedColor] = useState<NoteColor>(() => randomColor())

    const startEditing = useCallback((id: number) => setEditingId(id), [])
    const clearActive = useCallback(() => setActiveNoteId(null), [])

    const onDoubleClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
        const noteEl = (e.target as HTMLElement).closest<HTMLDivElement>("[data-note-id]")
        if (noteEl) startEditing(parseInt(noteEl.dataset.noteId || "0"))
    }, [startEditing])

    const stopEditing = useCallback(() => {
        if (editingId === null) return
        const note = getNote(editingId)
        if (note) updateNote(note.id, { text: note.text, h: note.h })
        setEditingId(null)
    }, [editingId, getNote, updateNote])

    // grows the note to fit the text
    const editNote = useCallback((id: number, changes: Partial<Note>) => {
        const note = getNote(id)
        if (!note) return
        const { h } = clampSize({ ...note, ...changes }, boardSize())
        patchNote(id, { ...changes, h })
    }, [getNote, boardSize, patchNote])

    const addNoteAt = useCallback((rect: Rect) =>
        createNote({ ...rect, text: "", color: selectedColor }), [createNote, selectedColor])

    // keyboard-only way to create a note
    const addNote = useCallback(async () => {
        const offset = (notes.length % 6) * 24
        const created = await addNoteAt({ x: 40 + offset, y: 40 + offset, ...NEW_NOTE })
        if (created) setPendingFocusId(created.id)
    }, [notes.length, addNoteAt])

    // dropping a note also drops any UI state pointing at it
    const deleteNote = useCallback((id: number) => {
        setEditingId((curr) => curr === id ? null : curr)
        setActiveNoteId((curr) => curr === id ? null : curr)
        return removeNote(id)
    }, [removeNote])

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
        onCreate: addNoteAt,
        onDelete: deleteNote,
        onSelect: selectNote,
    })

    const activeNote = activeNoteId !== null ? notes.find((n) => n.id === activeNoteId) : undefined

    const selectColor = useCallback((color: NoteColor) => {
        if (!activeNote) return setSelectedColor(color)
        updateNote(activeNote.id, { color }, { color: activeNote.color })
    }, [activeNote, updateNote])

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
        isLoading,
        storageType,
        changeStorage,
        activeNoteId,
        activateNote: setActiveNoteId,
        deactivateNote: clearActive,
        toolbarColor: activeNote?.color ?? selectedColor,
        selectColor,
    }
}
