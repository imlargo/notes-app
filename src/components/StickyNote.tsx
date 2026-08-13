import { memo, type CSSProperties } from "react";
import type { Note, NoteColor, } from "../domain/note"
import { MoreHorizontal } from "lucide-react";

interface StickyNoteProps {
    note: Note
    className?: string;

    fading?: boolean;
    editing?: boolean;
    onChange?: (id: number, changes: Partial<Note>) => void
    onStopEditing?: () => void
}

const COLOR_CLASSES: Record<NoteColor, string> = {
    "indigo": "bg-indigo-200",
    "amber": "bg-amber-200",
    "rose": "bg-rose-200",
    "emerald": "bg-emerald-200",
    "sky": "bg-sky-200",
}

// TODO: primitives and memo
export const StickyNote = memo(({ note, className, fading, editing, onChange, onStopEditing }: StickyNoteProps) => {
    const style: CSSProperties = {
        transform: `translate(${note.x}px, ${note.y}px)`,
        width: note.w,
        height: note.h,
    }

    const cls = `cursor-grab flex flex-col absolute top-0 left-0 border overflow-hidden min-w-12 min-h-24 ${className} ${fading && "opacity-50"} ${note.color ? COLOR_CLASSES[note.color] : "bg-neutral-50 opacity-80"} `

    const onTextChange = (text: string) => {
        onChange?.(note.id, {
            text: text
        })
    }

    return <div className={cls} style={style} data-note-id={note.id} >
        <div className="flex items-center w-full border-b py-2  p-4">
            <MoreHorizontal className="size-4 text-neutral-400"></MoreHorizontal>
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

        <div data-resize-handle className="absolute -bottom-1.5 -right-1.5 size-4 bg-white border border-purple-500">
        </div>
    </div>
})