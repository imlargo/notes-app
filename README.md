# Sticky Notes

Single-page sticky notes board

## Getting started

Install the dependencies and start the dev server:
```bash
npm install
npm run dev
```

## Features

The four required ones are there:

* Create a note by dragging on empty canvas
* Resize by dragging the corner handle
* Move by dragging
* Delete by dragging onto the trash

Bonus:

* Edit text in place (double click)
* Bring to front on interaction
* localStorage persistence, restored on load
* Note colors, cycled from the toolbar
* Async repository layer with mocked latency, ready to swap for a real API

there is also a runtime switch between the two backends, a loading indicator, keyboard/accessibility support, in-emory is the default backend so notes reset on reload until you switch it

## Structure

domain/
types and geometry, no React

services/
NoteRepository interface, in-memory and localStorage

state/
notesReducer

hooks/
useBoard

components/
Board, StickyNote, Toolbar

## Architecture

layers only depend on the one below, `domain/` is types and math with no React and no side effects, so the geometry is testable on its own, `services/` puts persistence behind a `NoteRepository` interface with two async implementations, integrating real api is just one more class implementation.

dragging runs off one pointerdown/move/up handler on the board instead of listeners per note, a `Gesture` union in a ref tracks the current drag and pointerdown hit tests what you grabbed, resize handle first since it overlaps the note, then the body, then empty canvas, it lives in a ref because it changes on every pointermove and nothing renders off it `StickyNote` just renders and forwards events up

`notesReducer` owns the list and the array order is the z order, so bring to front is a move to the end Writes are split in two: `patchNote` updates locally on every frame to keep dragging smooth, and the repository only gets written once the gesture ends A pending counter wraps every async call and feeds the loading indicator

## Trade-offs

Kept simple on purpose given the time

* No tests `domain/` and the reducer are pure and were written to be testable, first thing I'd add
* `useBoard` does too much, pulling the data side into its own hook is the obvious next step
* Notes can be dropped mostly off screen, nothing clamps them
* Optimistic writes never roll back and there's no error UI
* Text saves on blur, not per keystroke
* Desktop only, no touch tuning
