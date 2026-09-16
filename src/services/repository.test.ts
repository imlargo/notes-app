import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import type { NoteRepository } from "./repository"
import { NOTE_COLORS } from "../domain/note"
import { draft, note } from "../test/factories"

const LATENCY = 500

function fakeLocalStorage() {
    const entries = new Map<string, string>()
    return {
        getItem: (k: string) => entries.get(k) ?? null,
        setItem: (k: string, v: string) => { entries.set(k, v) },
    } as Storage
}

const settle = async <T>(pending: Promise<T>): Promise<T> => {
    pending.catch(() => { })   // claim it before the clock moves
    await vi.advanceTimersByTimeAsync(LATENCY)
    return pending
}

const freshMemory = async () => {
    vi.resetModules()   // the notes live in module scope
    return new (await import("./memory-note-repository")).MockNoteRepository()
}

const freshLocal = async () => {
    vi.stubGlobal("localStorage", fakeLocalStorage())
    return new (await import("./local-note-repository")).LocalStorageRepository()
}

describe.each([
    { name: "MockNoteRepository", fresh: freshMemory },
    { name: "LocalStorageRepository", fresh: freshLocal },
])("$name", ({ fresh }) => {
    let repo: NoteRepository

    beforeEach(async () => {
        vi.useFakeTimers()
        repo = await fresh()
    })
    afterEach(() => { vi.useRealTimers() })

    it("keeps what it created, in the order it was created", async () => {
        const before = (await settle(repo.list())).map(n => n.id)
        const a = await settle(repo.create(draft({ text: "a" })))
        const b = await settle(repo.create(draft({ text: "b" })))

        // z order is array order, a repository that reshuffles restacks the board on reload
        await expect(settle(repo.list()).then(ns => ns.map(n => n.id)))
            .resolves.toEqual([...before, a.id, b.id])
    })

    it("does not reuse the id of a deleted note", async () => {
        const first = await settle(repo.create(draft()))
        await settle(repo.delete(first.id))
        const second = await settle(repo.create(draft()))
        expect(second.id).not.toBe(first.id)
    })

    it("assigns the id itself rather than trusting the draft", async () => {
        const created = await settle(repo.create({ ...draft(), id: -1 }))

        expect(created.id).toBeGreaterThan(0)
        await expect(settle(repo.list()).then(ns => ns.map(n => n.id))).resolves.not.toContain(-1)
    })

    it("picks a colour only for a draft that has none", async () => {
        const asked = await settle(repo.create(draft({ color: "lime" })))
        const colourless = await settle(repo.create({ text: "", x: 0, y: 0, w: 100, h: 100 }))

        expect(asked.color).toBe("lime")
        expect(NOTE_COLORS).toContain(colourless.color)
    })

    it("updates the fields it was given and nothing else", async () => {
        const a = await settle(repo.create(draft({ text: "keep me", w: 300 })))
        const b = await settle(repo.create(draft({ text: "b" })))

        const updated = await settle(repo.update(a.id, { x: 42 }))

        expect(updated).toMatchObject({ x: 42, text: "keep me", w: 300 })
        const notes = await settle(repo.list())
        expect(notes).toContainEqual(updated)
        expect(notes.find(n => n.id === b.id)).toMatchObject({ text: "b" })
    })

    it("refuses to move a note onto another note's id", async () => {
        const a = await settle(repo.create(draft({ text: "a" })))
        const b = await settle(repo.create(draft({ text: "b" })))
        await settle(repo.update(a.id, { id: b.id }))

        const notes = await settle(repo.list())
        expect(notes.filter(n => n.id === b.id)).toHaveLength(1)
    })

    it("rejects an update for a note that is not there", async () => {
        // silent success means the rollback never fires
        const created = await settle(repo.create(draft()))
        await settle(repo.delete(created.id))

        await expect(settle(repo.update(created.id, { x: 1 }))).rejects.toThrow()
        await expect(settle(repo.update(4242, { x: 1 }))).rejects.toThrow()
    })

    it("removes a deleted note and takes a second delete as done", async () => {
        const created = await settle(repo.create(draft()))
        await settle(repo.delete(created.id))

        await expect(settle(repo.list())).resolves.not.toContainEqual(created)
        await expect(settle(repo.delete(created.id))).resolves.toBeUndefined()
    })

    it("hands out a list that cannot be emptied from outside", async () => {
        const created = await settle(repo.create(draft()))

        const notes = await settle(repo.list())
        notes.length = 0

        await expect(settle(repo.list())).resolves.toContainEqual(created)
    })
})

describe("LocalStorageRepository", () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.stubGlobal("localStorage", fakeLocalStorage())
    })
    afterEach(() => { vi.useRealTimers() })

    const repo = async () => new (await import("./local-note-repository")).LocalStorageRepository()

    it("survives a reload, and does not reuse an id across one", async () => {
        const first = await settle((await repo()).create(draft({ text: "persisted" })))
        await expect(settle((await repo()).list())).resolves.toContainEqual(first)

        await settle((await repo()).delete(first.id))
        const second = await settle((await repo()).create(draft()))
        expect(second.id).toBeGreaterThan(first.id)
    })

    it("keeps clear of the ids of notes stored without a counter", async () => {
        // notes written before the id counter existed, the next id has to come from them
        localStorage.setItem("notes", JSON.stringify([note(4), note(11)]))

        await expect(settle((await repo()).create(draft())).then(n => n.id)).resolves.toBeGreaterThan(11)
    })

    it("starts from an empty board when the stored notes are unreadable", async () => {
        localStorage.setItem("notes", "{ not json")

        await expect(settle((await repo()).list())).resolves.toEqual([])
        const created = await settle((await repo()).create(draft({ text: "after the corruption" })))
        await expect(settle((await repo()).list())).resolves.toEqual([created])
    })
})
