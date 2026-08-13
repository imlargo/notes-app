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
* Colors, the toolbar button changes the color of the focused note or picks the color for the next one

Everything also works from the keyboard. Tab moves between notes, arrows move the focused one, hold shift for a bigger step and alt to resize instead, enter edits, escape leaves the text, delete removes it.

## Layout

```
domain/      model and geometry, no React
services/    NoteRepository and its implementations
state/       notes reducer
hooks/       useBoard
components/  Board, StickyNote, Toolbar
```

The architecture and the reasoning behind it are in [ARCHITECTURE.md](./ARCHITECTURE.md).

## What I'd do next

Tests first, domain/ and the reducer are pure and were written with that in mind. After that split useBoard, it handles gestures and data access and only the first one is really its job. Optimistic writes have no rollback and there's no error UI. Notes can also be dropped mostly off screen since nothing clamps them.

## Architecture descripcion (requested)

The app is layered so the logic and the persistence don't depend on React. domain/ is the model and the geometry, pure functions I can test without mounting anything. services/ hides persistence behind an async NoteRepository with two implementations, in-memory and localStorage. Both have fake latency on purpose so the UI is written against real async I/O. A REST backend would be one more class and nothing above it changes. state/ is a reducer and components/ only render.

The main decision on the interaction side was to drag with one set of pointer handlers on the board instead of wiring listeners per note. Hit testing happens on pointerdown and the current gesture is a union kept in a ref since it changes every frame and nothing renders from it. The repository only gets written when the gesture ends. That keeps dragging at frame rate and keeps the async layer out of the hot path

Accessibility wasn't an afterthought, it shaped the component API. A drag only interface is invisible to a keyboard so every note is focusable and can be moved, resized, edited and deleted without a mouse. Focus goes somewhere sensible after a note disappears and changes get announced. Types work the same way, the gesture is a union instead of a pile of flags so the wrong state doesn't compile. That part matters more to me than squeezing in every feature-