import { memo, type Ref } from "react"
import { Trash } from "lucide-react"

interface TrashZoneProps {
    ref: Ref<HTMLDivElement>
    // a note is being dragged
    armed?: boolean
    // 0/1
    pull?: number
}

export const TrashZone = memo(function TrashZone({ ref, armed, pull = 0 }: TrashZoneProps) {
    const over = pull === 1

    return <div
        ref={ref}
        aria-hidden="true"
        // grows as the note comes closer, and its hit area with it
        style={{ scale: String(1 + 0.3 * pull) }}
        className={`trash aspect-square p-4 border border-red-800 rounded-xl flex items-center justify-center
            pointer-events-none transition-colors duration-200
            ${over ? "bg-red-600" : armed ? "bg-red-600/50" : "bg-red-600/30"}`}
    >
        <Trash className={`size-5 ${over ? "text-white" : "text-red-800"}`} />
    </div>
})
