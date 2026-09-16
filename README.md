# Sticky Notes

Single page sticky notes board. React, TypeScript and Vite, no component or drag libraries.

## Running it

```bash
npm install
npm run dev
```

Run the tests

```bash
npm test
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
* Notes are saved through an async repository, in-memory by default with a localStorage backend you can switch to from the top right corner, and the board comes back on the backend you left it on
* Colour, an explicit picker in the toolbar. With a note selected it recolours that one, otherwise it sets the colour the next one gets

Everything also works from the keyboard. Tab moves between notes, arrows move the focused one, hold shift for a bigger step and alt to resize instead, enter edits, escape leaves the text or clears the selection, delete removes it. The colour picker is reachable by tabbing on to the toolbar, the selection survives leaving the note.

Notes are clamped to the board, so shrinking the window brings them back inside instead of leaving
them off screen.

## Layout

```
domain/      model and geometry, pure functions, no React
services/    NoteRepository, its two implementations and the factory that picks one
state/       notes reducer
hooks/       useNotes (data and persistence), useBoardGestures (pointers),
             useBoardBounds (the board rect), useBoard (composes them and owns the UI state)
components/  Board and the pieces it composes
```

The architecture and the reasoning behind it are in [ARCHITECTURE.md](./ARCHITECTURE.md).

## What I'd do next

Tests that render the board. The pure layers and the repository contract are covered, but the gestures
and the keyboard commands are not, and those are the features the brief is about.
A failed write is announced but not retried, offering a retry on the toast would close that loop.

