import { Loader2 } from "lucide-react"

export function SyncIndicator() {
    return <div
        role="status"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-x-2 bg-neutral-900 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-sm pointer-events-none"
    >
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        <span>Syncing...</span>
    </div>
}
