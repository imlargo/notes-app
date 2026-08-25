import { memo, useEffect, useRef, type CSSProperties, type KeyboardEvent } from "react";
import { COLOR_CLASSES, type Note } from "../domain/note"
import { GripHorizontal } from "lucide-react";
import { BOARD_INSTRUCTIONS_ID } from "./ScreenReaderStatus";

interface StickyNoteProps {
    note: Note
    className?: string;

    fading?: boolean;
    editing?: boolean;
    active?: boolean;
    onChange?: (id: number, changes: Partial<Note>) => void
    onStopEditing?: () => void
    onMove?: (id: number, dx: number, dy: number) => void
    onResize?: (id: number, dw: number, dh: number) => void
    onDelete?: (id: number) => void
    onStartEditing?: (id: number) => void
    onActivate?: (id: number) => void
    onDeactivate?: () => void
}

const STEP = 8
const STEP_LARGE = 32

export const StickyNote = memo(({ note, className, fading, editing, active, onChange, onStopEditing, onMove, onResize, onDelete, onStartEditing, onActivate, onDeactivate }: StickyNoteProps) => {
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

    const cls = `cursor-grab flex flex-col absolute top-0 left-0 border min-w-12 min-h-24 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-indigo-600 ${active ? "ring-2 ring-neutral-800" : ""} ${className} ${fading && "opacity-50"} ${note.color ? COLOR_CLASSES[note.color] : "bg-neutral-50 opacity-80"} `

    const onTextChange = (text: string) => {
        // asks for the height the text needs
        const el = textareaRef.current
        const overflow = el ? el.scrollHeight - el.clientHeight : 0
        onChange?.(note.id, { text, h: note.h + overflow })
    }

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest("textarea, [data-no-drag]")) return

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
        } else if (e.key === "Escape") {
            onDeactivate?.()
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
        aria-describedby={BOARD_INSTRUCTIONS_ID}
        aria-current={active ? "true" : undefined}
        onKeyDown={onKeyDown}
        onFocus={() => onActivate?.(note.id)}
    >
        <div className="flex items-center justify-center border-b px-3 py-2 shrink-0">
            <GripHorizontal className="size-4 text-neutral-400" aria-hidden="true" />
        </div>

        <div className="flex-1 min-h-0 w-full  p-4">
            <textarea
                ref={textareaRef}
                className="text-neutral-600 w-full h-full resize-none outline-none bg-none"
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