import type { CSSProperties } from "react";
import type { Note } from "../domain/note"
import { DotSquare, Grab, Grip } from "lucide-react";

interface StickyNoteProps {
    note: Note
    className?: string;

    editing?: boolean;
    onChange?: (id: number, changes: Partial<Note>) => void
    onStopEditing?: () => void
}

// TODO: primitives and memo
export function StickyNote({ note, className, editing, onChange, onStopEditing }: StickyNoteProps) {
    const style: CSSProperties = {
        transform: `translate(${note.x}px, ${note.y}px)`,
        width: note.w,
        height: note.h,
    }

    const cls = "cursor-grab flex flex-col bg-indigo-200 absolute top-0 left-0 border min-w-12 min-h-24 " + className

    const onTextChange = (text: string) => {
        onChange?.(note.id, {
            text: text
        })
    }

    return <div className={cls} style={style} data-note-id={note.id} >
        <div className="flex items-center w-full border-b py-2  p-4">
            <Grip className="size-4 text-neutral-400"></Grip>
        </div>


        <div className="w-full  p-4">

            <textarea
                className="text-neutral-600 w-full max-h-max outline-none bg-none"

                value={note.text}
                onChange={(e) => onTextChange(e.target.value)}
                onBlur={onStopEditing}

                readOnly={!editing}
                placeholder="Type something..."
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        e.currentTarget.blur()
                    }
                }}
            >
            </textarea>
        </div>

        <div data-resize-handle className="absolute -bottom-1.5 -right-1.5 size-3 bg-white border border-purple-500">
        </div>
    </div>
}