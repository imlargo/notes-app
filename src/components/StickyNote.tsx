import type { CSSProperties } from "react";
import type { Note } from "../domain/note"

interface StickyNoteProps {
    note: Note
}

// TODO: primitives and memo
export function StickyNote({ note }: StickyNoteProps) {
    const style: CSSProperties = {
        transform: `translate(${note.x}px, ${note.y}px)`,
        width: note.w,
        height: note.h,
    }

    return <div className="cursor-grab flex flex-col bg-indigo-200 absolute top-10 left-10 border p-4 min-w-12 min-h-24 " style={style} >
        <textarea className="text-neutral-600 w-full h-full outline-none bg-none" value={note.text}>
        </textarea>
    </div>
}