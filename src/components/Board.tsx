import React, { useEffect, useRef, useState } from "react";
import { Toolbar } from "./Toolbar";
import type { Note } from "../domain/note";
import { NoteService } from "../services/note";
import { MockNoteRepository } from "../services/note-repository";
import { StickyNote } from "./StickyNote";
import { rectFromPoints, toLocal, type Point, type Rect } from "../domain/geometry";

export function Board() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [draft, setDraft] = useState<Rect | null>(null)

    const start = useRef<Point | null>(null)
    const boardOrigin = useRef<Point>({ x: 0, y: 0 })

    const noteService = new NoteService(new MockNoteRepository());

    useEffect(() => {
        noteService.getNotes().then((data) => setNotes(data))
    }, [])


    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        boardOrigin.current = { x: r.left, y: r.top }
        start.current = toLocal(e)
        e.currentTarget.setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!start.current) return;
        setDraft(rectFromPoints(start.current, toLocal(e)))
    }

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!start.current) return;
        const rect = rectFromPoints(start.current, toLocal(e))
        if (rect.w > 8 && rect.h > 8) {
            createNote(rect)
        }

        start.current = null
        setDraft(null)
    }

    const boardRef = useRef<HTMLDivElement>(null)

    function createNote(rect: Rect) {
        noteService.createNote({
            ...rect
        })
    }

    return (
        <div className="board canvas-grid w-full h-full relative select-none  " ref={boardRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
        >

            {notes.map((note) => (
                <StickyNote key={note.id} note={note} ></StickyNote>
            ))}


            {draft && (<StickyNote className="pointer-events-none" note={draft as Note} ></StickyNote>)}

            <div className="flex items-center justify-center fixed bottom-6 inset-x-0 pointer-events-none">
                <Toolbar></Toolbar>
            </div>
        </div>
    )
}