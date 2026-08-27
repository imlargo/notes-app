import { forwardRef, memo } from "react"
import { Plus } from "lucide-react"
import { type NoteColor } from "../domain/note"
import { ColorPicker } from "./ColorPicker"

interface ToolbarProps {
    onAddNote?: () => void
    color: NoteColor
    colorLabel: string
    onSelectColor: (color: NoteColor) => void
}

export const Toolbar = memo(forwardRef<HTMLButtonElement, ToolbarProps>(({ onAddNote, color, colorLabel, onSelectColor }, ref) => {
    return <div data-no-drag className="bg-neutral-800 flex items-center justify-center gap-x-4 px-2 py-2 rounded-full pointer-events-auto">
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

        <ColorPicker value={color} label={colorLabel} placement="top" onChange={onSelectColor} />
    </div>
}))
