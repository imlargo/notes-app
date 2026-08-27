import { useEffect, useId, useRef, useState } from "react"
import { Palette } from "lucide-react"
import { COLOR_CLASSES, NOTE_COLORS, type NoteColor } from "../domain/note"

interface ColorPickerProps {
    value: NoteColor
    label: string
    placement?: "top" | "bottom"
    onChange: (color: NoteColor) => void
}

export function ColorPicker({ value, label, placement = "bottom", onChange }: ColorPickerProps) {
    const [open, setOpen] = useState(false)
    const root = useRef<HTMLDivElement>(null)
    const name = useId()

    useEffect(() => {
        if (!open) return
        const close = (e: Event) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
        document.addEventListener("pointerdown", close)
        return () => document.removeEventListener("pointerdown", close)
    }, [open])

    return <div
        ref={root}
        data-no-drag
        className="relative flex"
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false) }}
    >
        <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-haspopup="true"
            aria-expanded={open}
            aria-label={`${label}: ${value}`}
            className={`rounded-full ring-1 ring-black/20 flex items-center justify-center size-7 ${COLOR_CLASSES[value]}`}
        >
            <Palette className="size-4" aria-hidden="true" />
        </button>

        {open && (
            <fieldset className={`absolute left-0 z-10 flex gap-2 rounded-full bg-neutral-800 p-2 ${placement === "top" ? "bottom-full mb-2" : "top-full mt-2"}`}>
                <legend className="sr-only">{label}</legend>

                {NOTE_COLORS.map((color) => (
                    <label key={color}>
                        <input
                            type="radio"
                            name={name}
                            value={color}
                            checked={value === color}
                            onChange={() => { onChange(color); setOpen(false) }}
                            className="sr-only peer"
                        />
                        <span className="sr-only">{color}</span>
                        <span className={`block size-7 rounded-full peer-checked:ring-2 peer-checked:ring-inset peer-focus-visible:outline-2 ${COLOR_CLASSES[color]}`} />
                    </label>
                ))}
            </fieldset>
        )}
    </div>
}
