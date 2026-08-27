import { memo, type Ref } from "react"
import { Trash } from "lucide-react"

export const TrashZone = memo(function TrashZone({ ref }: { ref: Ref<HTMLDivElement> }) {
    return <div
        ref={ref}
        aria-hidden="true"
        className="trash aspect-square p-4 border border-red-800 bg-red-600/30 rounded-xl flex items-center justify-center pointer-events-none"
    >
        <Trash className="size-5 text-red-800" />
    </div>
})
