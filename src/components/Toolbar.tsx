import { forwardRef } from "react"
import { Palette, Plus } from "lucide-react"

interface ToolbarProps {
    onAddNote?: () => void
}

export const Toolbar = forwardRef<HTMLButtonElement, ToolbarProps>(({ onAddNote }, ref) => {
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

        {/* Divider */}
        <div className="h-8 w-1 bg-neutral-500">
        </div>

        <button type="button" disabled aria-label="Note color, coming soon" className="rounded-full bg-purple-500 size-8 disabled:opacity-50 disabled:cursor-not-allowed">
        </button>

        <Palette className="size-6 text-neutral-500" aria-hidden="true"></Palette>
    </div>
})
