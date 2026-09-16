import { describe, it, expect } from "vitest"
import { note } from "../test/factories"
import { notesReducer } from "./notesReducer"

const board = [note(1), note(2), note(3)]

it("load replaces the board", () => {
    expect(notesReducer(board, { type: "load", notes: [note(9)] })).toEqual([note(9)])
})

describe("add", () => {
    it("puts the note on top", () => {
        expect(notesReducer(board, { type: "add", note: note(4) }).at(-1)?.id).toBe(4)
    })

    it("keeps the identity of the notes already on the board", () => {
        const next = notesReducer(board, { type: "add", note: note(4) })
        board.forEach((n, i) => expect(next[i]).toBe(n))
    })
})

describe("remove", () => {
    it("drops the note and keeps the order", () => {
        expect(notesReducer(board, { type: "remove", id: 2 }).map(n => n.id)).toEqual([1, 3])
    })

    it("ignores an unknown id", () => {
        expect(notesReducer(board, { type: "remove", id: 99 })).toEqual(board)
    })
})

describe("patch", () => {
    it("merges the changes into the target note without restacking it", () => {
        expect(notesReducer(board, { type: "patch", id: 2, changes: { x: 50 } })[1])
            .toMatchObject({ id: 2, x: 50, w: 100 })
    })

    it("keeps the identity of the other notes", () => {
        // a drag frame patches one note, the rest keep their identity or the memo is pointless
        const next = notesReducer(board, { type: "patch", id: 2, changes: { x: 50 } })
        expect(next[0]).toBe(board[0])
        expect(next[2]).toBe(board[2])
    })

    it("ignores an unknown id", () => {
        expect(notesReducer(board, { type: "patch", id: 99, changes: { x: 1 } })).toEqual(board)
    })
})

describe("reassignId", () => {
    it("swaps the temporary id and leaves the note where it was", () => {
        const pending = [note(1), note(-1, { text: "typed while creating" }), note(3)]
        expect(notesReducer(pending, { type: "reassignId", from: -1, to: 7 })[1])
            .toEqual(note(7, { text: "typed while creating" }))
    })

    it("ignores an unknown id", () => {
        expect(notesReducer(board, { type: "reassignId", from: -1, to: 7 })).toEqual(board)
    })
})

describe("clamp", () => {
    const bounds = { w: 500, h: 400 }

    it("moves a note that fell outside back inside", () => {
        expect(notesReducer([note(1, { x: 900, y: 900 })], { type: "clamp", bounds })[0])
            .toMatchObject({ x: 400, y: 300 })
    })

    it("returns the same array when every note already fits", () => {
        expect(notesReducer(board, { type: "clamp", bounds: { w: 1000, h: 800 } })).toBe(board)
    })

    it("shrinks a note that no longer fits", () => {
        expect(notesReducer([note(1, { x: 300, w: 900, h: 200 })], { type: "clamp", bounds })[0])
            .toMatchObject({ x: 0, w: 500, h: 200 })
    })

    it("keeps the identity of the notes that did not move", () => {
        const mixed = [note(1), note(2, { x: 900 })]
        const next = notesReducer(mixed, { type: "clamp", bounds })

        expect(next[0]).toBe(mixed[0])
        expect(next[1]).toMatchObject({ x: 400 })
    })
})

describe("bringToFront", () => {
    it("moves the note to the end and keeps its identity", () => {
        const next = notesReducer(board, { type: "bringToFront", id: 1 })

        expect(next.map(n => n.id)).toEqual([2, 3, 1])
        expect(next.at(-1)).toBe(board[0])
    })

    it("returns the same array when there is nothing to move", () => {
        expect(notesReducer(board, { type: "bringToFront", id: 3 })).toBe(board)
        expect(notesReducer(board, { type: "bringToFront", id: 99 })).toBe(board)
    })
})
