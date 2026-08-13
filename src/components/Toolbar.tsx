import { forwardRef } from "react"
import { Plus } from "lucide-react"
import { COLOR_CLASSES, type NoteColor } from "../domain/note"

interface ToolbarProps {
    onAddNote?: () => void
    color?: NoteColor
    onCycleColor?: () => void
}

export const Toolbar = forwardRef<HTMLButtonElement, ToolbarProps>(({ onAddNote, color, onCycleColor }, ref) => {
    return <div className="bg-neutral-800 flex items-center justify-center gap-x-4 px-3 py-3 rounded-full pointer-events-auto">
        <button
            ref={ref}
            type="button"
            onClick={onAddNote}
            className="py-2 px-4 bg-white flex items-center justify-center gap-x-1 rounded-full focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
            <Plus className="size-4" aria-hidden="true"></Plus>
            <span>New note</span>
        </button>

        <div className="h-6 w-px rounded-full bg-white/15">
        </div>

        {/* click cycles through the note colors, targets the focused note if there is one */}
        <button
            type="button"
            onClick={onCycleColor}
            aria-label={`Note color: ${color}, click to change`}
            className={`rounded-full size-8  ${color ? COLOR_CLASSES[color] : "bg-purple-500"}`}
        >
        </button>
    </div>
})
