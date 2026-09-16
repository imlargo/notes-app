import { describe, it, expect } from "vitest"
import {
    clampPoint, clampPosition, clampSize, contains, distanceTo, position, rectFromPoints,
    resize, subtract, toRect, type Size,
} from "./geometry"
import { note } from "../test/factories"

const board: Size = { w: 1000, h: 800 }
const MIN = 96

it("subtract gives the delta between two points", () => {
    expect(subtract({ x: 30, y: 10 }, { x: 100, y: 4 })).toEqual({ x: -70, y: 6 })
})

it("position and toRect pick the fields a gesture is allowed to write", () => {
    const dragged = note(1, { x: 5, y: 7, w: 200, h: 150 })

    expect(position(dragged)).toEqual({ x: 5, y: 7 })
    expect(toRect(dragged)).toEqual({ x: 5, y: 7, w: 200, h: 150 })
})

describe("rectFromPoints", () => {
    it("normalises a drag made in any direction", () => {
        expect(rectFromPoints({ x: 110, y: 220 }, { x: 10, y: 20 })).toEqual({ x: 10, y: 20, w: 100, h: 200 })
        expect(rectFromPoints({ x: 10, y: 220 }, { x: 110, y: 20 })).toEqual({ x: 10, y: 20, w: 100, h: 200 })
    })

    it("collapses a press that never moved", () => {
        expect(rectFromPoints({ x: 40, y: 40 }, { x: 40, y: 40 })).toEqual({ x: 40, y: 40, w: 0, h: 0 })
    })
})

describe("resize", () => {
    it("applies the delta to the size only", () => {
        expect(resize({ x: 5, y: 7, w: 200, h: 200 }, { x: 20, y: -30 }))
            .toEqual({ x: 5, y: 7, w: 220, h: 170 })
    })

    it("stops at the minimum size", () => {
        expect(resize({ x: 0, y: 0, w: 100, h: 100 }, { x: -900, y: -900 })).toMatchObject({ w: MIN, h: MIN })
    })
})

describe("clampPosition", () => {
    it("keeps the whole rect inside the board", () => {
        expect(clampPosition({ x: 950, y: 780, w: 200, h: 150 }, board))
            .toEqual({ x: 800, y: 650, w: 200, h: 150 })
        expect(clampPosition({ x: -50, y: -50, w: 200, h: 150 }, board)).toMatchObject({ x: 0, y: 0 })
    })

    it("pins a rect bigger than the board to the origin", () => {
        expect(clampPosition({ x: 10, y: 10, w: 2000, h: 2000 }, board)).toMatchObject({ x: 0, y: 0 })
    })

    it("does nothing while the board is unmeasured", () => {
        const rect = { x: 900, y: 900, w: 100, h: 100 }
        expect(clampPosition(rect, { w: Infinity, h: Infinity })).toEqual(rect)
    })
})

describe("clampSize", () => {
    it("stops the rect growing past the edge", () => {
        expect(clampSize({ x: 900, y: 700, w: 500, h: 500 }, board))
            .toEqual({ x: 900, y: 700, w: 100, h: 100 })
    })

    it("keeps the minimum size even with no room left for it", () => {
        expect(clampSize({ x: 990, y: 790, w: 200, h: 200 }, board)).toMatchObject({ w: MIN, h: MIN })
        expect(clampSize({ x: 4000, y: 4000, w: 200, h: 200 }, board)).toMatchObject({ w: MIN, h: MIN })
    })
})

it("clampPoint keeps the drawn corner inside the board", () => {
    expect(clampPoint({ x: 1200, y: -30 }, board)).toEqual({ x: 1000, y: 0 })
})

describe("distanceTo", () => {
    const trash = { x: 100, y: 100, w: 50, h: 50 }

    it("measures from the nearest edge, not from the centre", () => {
        expect(distanceTo(trash, { x: 130, y: 60 })).toBe(40)
        expect(distanceTo(trash, { x: 190, y: 130 })).toBe(40)
    })

    it("measures the diagonal off a corner", () => {
        expect(distanceTo(trash, { x: 70, y: 60 })).toBe(50)
    })
})

describe("contains", () => {
    const trash = { x: 100, y: 100, w: 50, h: 50 }

    it("takes the edges and nothing outside them", () => {
        expect(contains(trash, { x: 100, y: 100 })).toBe(true)
        expect(contains(trash, { x: 150, y: 150 })).toBe(true)
        expect(contains(trash, { x: 99, y: 120 })).toBe(false)
        expect(contains(trash, { x: 120, y: 151 })).toBe(false)
    })

    it("keeps nothing but its own corner when the rect has no area", () => {
        // an unmounted trash zone measures 0x0, it must not swallow the drop
        const collapsed = { x: 0, y: 0, w: 0, h: 0 }
        expect(contains(collapsed, { x: 1, y: 0 })).toBe(false)
        expect(contains(collapsed, { x: 0, y: 0 })).toBe(true)
    })
})
