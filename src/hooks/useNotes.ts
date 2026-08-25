import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { Note } from "../domain/note";
import { NoteService } from "../services/note";
import { createRepository, type StorageType } from "../services/create-repository";
import { notesReducer } from "../state/notesReducer";

const ERROR_TIMEOUT = 4000

export function useNotes() {
    const [notes, dispatch] = useReducer(notesReducer, [])
    const notesRef = useRef(notes)
    useEffect(() => { notesRef.current = notes }, [notes])

    const [announcement, setAnnouncement] = useState("")
    const [error, setError] = useState<string | null>(null)
    const errorTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const [pendingCount, setPendingCount] = useState(0)
    const [storageType, setStorageType] = useState<StorageType>("memory")

    // negative so it doesnt collide with the repo
    const lastTempId = useRef(0)

    const noteService = useRef(new NoteService(createRepository("memory")))

    // ref keeps re-renders stable
    const getNote = useCallback((id: number) => notesRef.current.find((n) => n.id === id), [])

    const fail = useCallback((message: string) => {
        setError(message)
        clearTimeout(errorTimer.current)
        errorTimer.current = setTimeout(() => setError(null), ERROR_TIMEOUT)
    }, [])

    const withPending = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
        setPendingCount(c => c + 1)
        try {
            return await fn()
        } finally {
            setPendingCount(c => c - 1)
        }
    }, [])

    const load = useCallback(() => {
        withPending(() => noteService.current.getNotes())
            .then((data) => dispatch({ type: "load", notes: data }))
            .catch(() => fail("Could not load the notes"))
    }, [withPending, fail])

    const changeStorage = useCallback((type: StorageType) => {
        setStorageType(type)
        noteService.current = new NoteService(createRepository(type))
        load()
    }, [load])

    const bringToFront = useCallback((id: number) => {
        dispatch({ type: "bringToFront", id })
    }, [])

    // local only
    const patchNote = useCallback((id: number, changes: Partial<Note>) => {
        dispatch({ type: "patch", id, changes })
    }, [])

    // only patch changed fields
    const updateNote = useCallback(async (id: number, changes: Partial<Note>, rollback?: Partial<Note>) => {
        patchNote(id, changes)
        try {
            await withPending(() => noteService.current.updateNote(id, changes))
        } catch {
            if (rollback) patchNote(id, rollback)
            fail("Could not save the note")
        }
    }, [patchNote, withPending, fail])

    // optimistic
    const createNote = useCallback(async (draft: Omit<Note, "id">): Promise<Note | null> => {
        const tempId = --lastTempId.current

        dispatch({ type: "add", note: { ...draft, id: tempId } })
        setAnnouncement("Note created")

        try {
            const created = await withPending(() => noteService.current.createNote(draft))
            dispatch({ type: "replace", id: tempId, note: created })
            return created
        } catch {
            dispatch({ type: "remove", id: tempId })
            fail("Could not create the note")
            return null
        }
    }, [withPending, fail])

    const removeNote = useCallback(async (id: number) => {
        const deleted = getNote(id)
        if (!deleted) return

        dispatch({ type: "remove", id })
        setAnnouncement("Note deleted")

        try {
            await withPending(() => noteService.current.deleteNote(id))
        } catch {
            dispatch({ type: "add", note: deleted })
            fail("Could not delete the note")
        }
    }, [getNote, withPending, fail])

    useEffect(() => {
        load()
    }, [load])

    return {
        notes,
        getNote,
        bringToFront,
        patchNote,
        updateNote,
        createNote,
        removeNote,
        announcement,
        error,
        isLoading: pendingCount > 0,
        storageType,
        changeStorage,
    }
}
