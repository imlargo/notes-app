import { memo, useEffect, useRef, type CSSProperties, type KeyboardEvent } from "react";
import { COLOR_CLASSES, type Note } from "../domain/note"
import { MoreHorizontal } from "lucide-react";

interface StickyNoteProps {
    note: Note
    className?: string;

    fading?: boolean;
    editing?: boolean;
    onChange?: (id: number, changes: Partial<Note>) => void
    onStopEditing?: () => void
    onMove?: (id: number, dx: number, dy: number) => void
    onResize?: (id: number, dw: number, dh: number) => void
    onDelete?: (id: number) => void
    onStartEditing?: (id: number) => void
    onActivate?: (id: number) => void
}

const STEP = 8
const STEP_LARGE = 32

export const StickyNote = memo(({ note, className, fading, editing, onChange, onStopEditing, onMove, onResize, onDelete, onStartEditing, onActivate }: StickyNoteProps) => {
    const noteRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (editing) textareaRef.current?.focus()
    }, [editing])

    const style: CSSProperties = {
        transform: `translate(${note.x}px, ${note.y}px)`,
        width: note.w,
        height: note.h,
    }

    const cls = `cursor-grab flex flex-col absolute top-0 left-0 border overflow-hidden min-w-12 min-h-24 outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${className} ${fading && "opacity-50"} ${note.color ? COLOR_CLASSES[note.color] : "bg-neutral-50 opacity-80"} `

    const onTextChange = (text: string) => {
        onChange?.(note.id, {
            text: text
        })
    }

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).tagName === "TEXTAREA") return

        if (e.key.startsWith("Arrow")) {
            e.preventDefault()
            const step = e.shiftKey ? STEP_LARGE : STEP
            const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0
            const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0
            if (e.altKey) onResize?.(note.id, dx, dy)
            else onMove?.(note.id, dx, dy)
        } else if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault()
            onDelete?.(note.id)
        } else if (e.key === "Enter" || e.key === "F2") {
            e.preventDefault()
            onStartEditing?.(note.id)
        }
    }

    return <div
        ref={noteRef}
        className={cls}
        style={style}
        data-note-id={note.id}
        tabIndex={0}
        role="group"
        aria-roledescription="sticky note"
        aria-label={note.text || "Empty note"}
        aria-describedby="board-instructions"
        onKeyDown={onKeyDown}
        onFocus={() => onActivate?.(note.id)}
    >
        <div className="flex items-center w-full border-b py-2  p-4">
            <MoreHorizontal className="size-4 text-neutral-400" aria-hidden="true"></MoreHorizontal>
        </div>

        <div className="w-full  p-4">
            <textarea
                ref={textareaRef}
                className="text-neutral-600 w-full max-h-max outline-none bg-none"
                aria-label="Note text"

                value={note.text}
                onChange={(e) => onTextChange(e.target.value)}
                onBlur={onStopEditing}

                readOnly={!editing}
                // one tab stop per note, you get into the text with enter instead
                tabIndex={editing ? 0 : -1}
                placeholder="Type something..."
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        e.currentTarget.blur()
                        noteRef.current?.focus()
                    }
                }}
            >
            </textarea>
        </div>

        {/* just a hit target, useBoard reads this attribute on pointerdown */}
        <div data-resize-handle aria-hidden="true" className="absolute -bottom-1.5 -right-1.5 size-4 bg-white border border-purple-500 cursor-nwse-resize">
        </div>
    </div>
})