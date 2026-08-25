import { useCallback, useRef } from "react";
import type { Size } from "../domain/geometry";

// shared by the gestures and by the keyboard commands
export function useBoardBounds() {
    const boardRef = useRef<HTMLDivElement>(null)

    const boardSize = useCallback((): Size => {
        const r = boardRef.current?.getBoundingClientRect()
        return r ? { w: r.width, h: r.height } : { w: Infinity, h: Infinity } // infinite so its non negative btw
    }, [])

    return { boardRef, boardSize }
}
