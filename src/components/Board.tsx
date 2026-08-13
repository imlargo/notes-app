import { useEffect, useState } from "react";
import { Toolbar } from "./Toolbar";
import type { Note } from "../domain/note";
import { NoteService } from "../services/note";
import { MockNoteRepository } from "../services/note-repository";
import { StickyNote } from "./StickyNote";



export function Board() {
    const [notes, setNotes] = useState<Note[]>([]);

    const noteService = new NoteService(new MockNoteRepository());

    useEffect(() => {
        noteService.getNotes().then((data) => setNotes(data))
    }, [])

    return (
        <div className="canvas-grid w-full h-full relative">

            {notes.map((note) => (
                <StickyNote key={note.id}  note={note} ></StickyNote>
            ))}

            <div className="flex items-center justify-center fixed bottom-6 inset-x-0 pointer-events-none">
                <Toolbar></Toolbar>
            </div>
        </div>
    )
}