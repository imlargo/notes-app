import { memo } from "react"

export const BOARD_INSTRUCTIONS_ID = "board-instructions"

export const ScreenReaderStatus = memo(function ScreenReaderStatus({ announcement }: { announcement: string }) {
    return <>
        <p id={BOARD_INSTRUCTIONS_ID} className="sr-only">
            Arrow keys move the focused note, hold shift to move further, hold alt to resize instead, enter opens it for editing, delete removes it, escape deselects it.
        </p>

        <div aria-live="polite" className="sr-only">{announcement}</div>
    </>
})
