# Sticky Notes

Single page sticky notes board. React, TypeScript and Vite, no component or drag libraries.

## Running it

```bash
npm install
npm run dev
```

Build and preview the production bundle

```bash
npm run build
npm run preview
```

## What it does

All four of the required features are there

* Drag on empty canvas to create a note the size of what you dragged
* Drag a note to move it
* Drag the corner handle to resize
* Drop a note on the trash to delete it

And the optional ones

* Double click a note to edit its text
* Notes come to front when you touch them
* Notes are saved through an async repository, in-memory by default with a localStorage backend you can switch to from the top right corner
* Colors, an explicit picker in the toolbar. With a note selected it recolors that one, otherwise it sets the colour the next one gets

Everything also works from the keyboard. Tab moves between notes, arrows move the focused one, hold shift for a bigger step and alt to resize instead, enter edits, escape leaves the text or clears the selection, delete removes it. The colour picker is reachable by tabbing on to the toolbar, the selection survives leaving the note.

## Layout

```
domain/      model and geometry, pure functions, no React
services/    NoteRepository, its two implementations and the factory that picks one
state/       notes reducer
hooks/       useNotes (data and persistence), useBoardGestures (pointers),
             useBoardBounds (the board rect), useBoard (composes them and owns the UI state)
components/  Board and the pieces it composes
```

Writes are optimistic everywhere: the screen updates first, the repository after, and a failure
puts the previous value back and says why. Only the changed fields are sent, and the response is
ignored on purpose so a slow write cannot overwrite something typed while it was in flight.

The architecture and the reasoning behind it are in [ARCHITECTURE.md](./ARCHITECTURE.md).

## What I'd do next

Tests first, domain/, the reducer and the gesture maths are pure and were written with that in mind.
After that re-clamping on resize, notes come back inside the board the next time you move them but
not when the window shrinks under them. And a failed write is announced but not retried, offering a
retry on the toast would close that loop.

