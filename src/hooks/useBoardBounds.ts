import { useCallback, useEffect, useRef, useState } from "react";
import type { Size } from "../domain/geometry";

// shared by the gestures and by the keyboard commands
export function useBoardBounds() {
    const boardRef = useRef<HTMLDivElement>(null)

    const [size, setSize] = useState<Size>({ w: Infinity, h: Infinity })

    const boardSize = useCallback((): Size => {
        const r = boardRef.current?.getBoundingClientRect()
        return r ? { w: r.width, h: r.height } : { w: Infinity, h: Infinity } // infinite so its non negative btw
    }, [])

    useEffect(() => {
        const board = boardRef.current
        if (!board) return
        const observer = new ResizeObserver(() => setSize(boardSize()))
        observer.observe(board)
        return () => observer.disconnect()
    }, [boardSize])

    return { boardRef, boardSize, size }
}
