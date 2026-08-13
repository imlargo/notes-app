import type { CSSProperties } from "react";
import type { Note } from "../domain/note"

interface StickyNoteProps {
    note: Note
    className?: string;
}

// TODO: primitives and memo
export function StickyNote({ note, className }: StickyNoteProps) {
    const style: CSSProperties = {
        transform: `translate(${note.x}px, ${note.y}px)`,
        width: note.w,
        height: note.h,
    }

    const cls = "cursor-grab flex flex-col bg-indigo-200 absolute top-0 left-0 border p-4 min-w-12 min-h-24 " + className

    return <div className={cls} style={style} data-note-id={note.id} >
        <textarea className="text-neutral-600 w-full h-full outline-none bg-none" defaultValue={note.text} readOnly>
        </textarea>
    </div>
}