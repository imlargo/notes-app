import type { Rect } from "../domain/geometry"

// the outline drawn while dragging a new note into existence
export function DraftRect({ rect }: { rect: Rect }) {
    return <div
        style={{
            transform: `translate(${rect.x}px, ${rect.y}px)`,
            width: rect.w,
            height: rect.h,
        }}
        className="absolute top-0 left-0 border border-dashed bg-neutral-50 opacity-80 pointer-events-none"
    />
}
