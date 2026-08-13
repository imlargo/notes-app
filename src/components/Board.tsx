import React, { useEffect, useRef, useState } from "react";
import { Toolbar } from "./Toolbar";
import type { Note } from "../domain/note";
import { NoteService } from "../services/note";
import { MockNoteRepository } from "../services/note-repository";
import { StickyNote } from "./StickyNote";
import { contains, rectFromPoints, resize, type Point, type Rect } from "../domain/geometry";
import { Trash } from "lucide-react";


type Gesture =
    | { kind: "create", origin: Point }
    | { kind: "move", id: number, grab: Point }
    | { kind: "resize", id: number, start: Rect, from: Point }

export function Board() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [draft, setDraft] = useState<Rect | null>(null)


    const [editingId, setEditingId] = useState<number | null>(null)
    const [overTrash, setOverTrash] = useState<boolean>(false)

    const boardRef = useRef<HTMLDivElement>(null)
    const trashRef = useRef<HTMLDivElement>(null)


    const boardOrigin = useRef<Point>({ x: 0, y: 0 })
    const gesture = useRef<Gesture | null>(null)

    const noteService = new NoteService(new MockNoteRepository());

    useEffect(() => {
        noteService.getNotes().then((data) => setNotes(data))
    }, [])


    const toLocal = (e: React.PointerEvent): Point => ({
        x: e.clientX - boardOrigin.current.x,
        y: e.clientY - boardOrigin.current.y,
    })

    const trashRect = () => {
        const trash = trashRef.current?.getBoundingClientRect()
        if (!trash) return null
        return {
            x: trash.left - boardOrigin.current.x,
            y: trash.top - boardOrigin.current.y,
            w: trash.width,
            h: trash.height
        }
    }

    const bringToFront = (id: number) => {
        setNotes((prev) => {
            const note = prev.find((n) => n.id === id)
            if (!note) return prev

            // last one
            if (prev[prev.length - 1]?.id === id) return prev

            return [...prev.filter(n => n.id !== id), note]
        })
    }

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement

        // On clicking input 
        if (target.closest("textarea")) return

        const r = e.currentTarget.getBoundingClientRect();
        boardOrigin.current = { x: r.left, y: r.top }
        const point = toLocal(e)

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

        e.currentTarget.setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
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
    }

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
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
    }

    const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement
        const noteEl = target.closest<HTMLDivElement>("[data-note-id]")
        if (noteEl) setEditingId(parseInt(noteEl.dataset.noteId || "0"))
    }

    function stopEditing() {
        if (editingId === null) return

        const note = notes.find((n) => n.id === editingId)
        if (note) {
            updateNote(note.id, note)
        }

        setEditingId(null)
    }

    async function createNote(rect: Rect) {
        const created = await noteService.createNote({ ...rect })
        setNotes((prev) => [...prev, created])
    }

    async function updateNote(id: number, note: Partial<Note>) {
        const updated = await noteService.updateNote(id, note)
        patchNote(id, updated)

    }

    function patchNote(id: number, changes: Partial<Note>) {
        setNotes((prev) => prev.map((n) => n.id === id ? { ...n, ...changes } : n))
    }

    async function deleteNote(id: number) {
        await noteService.deleteNote(id)
        setNotes((prev) => prev.filter(n => n.id !== id))
        setEditingId((curr) => curr === id ? null : curr)
    }

    return (
        <div className="board canvas-grid w-full h-full relative select-none  " ref={boardRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onDoubleClick={onDoubleClick}
        >

            {notes.map((note) => (
                <StickyNote
                    fading={overTrash && editingId !== note.id && gesture.current?.kind === "move" && gesture.current.id === note.id}
                    editing={editingId === note.id}
                    onChange={patchNote}
                    onStopEditing={stopEditing}

                    key={note.id} note={note} ></StickyNote>
            ))}


            {draft && (<StickyNote className="pointer-events-none" note={draft as Note} ></StickyNote>)}

            <div className="flex items-center justify-between fixed bottom-6 inset-x-0 pointer-events-none px-4">
                <div></div>
                <Toolbar></Toolbar>

                <div className="trash aspect-square p-4 border border-red-800 bg-red-600/30 rounded-xl flex items-center justify-center pointer-events-none" ref={trashRef}>
                    <Trash className="size-5 text-red-800"></Trash>
                </div>
            </div>
        </div>
    )
}