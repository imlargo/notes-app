import { Palette, Plus } from "lucide-react"

export function Toolbar() {
    return <div className="bg-neutral-800 flex items-center justify-center gap-x-4 px-3 py-3 rounded-full">
        <button className="py-2 px-4 bg-white flex items-center justify-center gap-x-1 rounded-full">
            <Plus className="size-4"></Plus>
            <span>New note</span>
        </button>

        {/* Divider */}
        <div className="h-8 w-1 bg-neutral-500">
        </div>

        <button className="rounded-full bg-purple-500 size-8">
        </button>

        <Palette className="size-6 text-neutral-500"></Palette>
    </div>
}