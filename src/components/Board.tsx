import { useRef } from "react";
import { StickyNote } from "./StickyNote";
import { Toolbar } from "./Toolbar";
import { Trash } from "lucide-react";
import { useBoard } from "../hooks/useBoard";

export function Board() {
    const {
        notes,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onDoubleClick,
        editingId,
        overTrash,
        patchNote,
        stopEditing,
        draft,
        trashRef,
        draggingId,
        addNote,
        moveNoteBy,
        resizeNoteBy,
        deleteNote,
        startEditing,
        announcement,
    } = useBoard();

    const addButtonRef = useRef<HTMLButtonElement>(null)

    const handleDelete = (id: number) => {
        deleteNote(id)
        addButtonRef.current?.focus()
    }

    return (
        <div className="board canvas-grid w-full h-full relative select-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onDoubleClick={onDoubleClick}
        >
            <p id="board-instructions" className="sr-only">
                Arrow keys move the focused note, hold shift to move further, hold alt to resize instead, enter opens it for editing, delete removes it.
            </p>

            <div aria-live="polite" className="sr-only">{announcement}</div>

            {notes.map((note) => (
                <StickyNote
                    fading={overTrash && draggingId === note.id}
                    editing={editingId === note.id}
                    onChange={patchNote}
                    onStopEditing={stopEditing}
                    onMove={moveNoteBy}
                    onResize={resizeNoteBy}
                    onDelete={handleDelete}
                    onStartEditing={startEditing}

                    key={note.id} note={note} ></StickyNote>
            ))}


            {draft && (<div
                style={{
                    transform: `translate(${draft.x}px, ${draft.y}px)`,
                    width: draft.w,
                    height: draft.h,
                }}
                className={`cursor-grab flex flex-col absolute top-0 left-0 border overflow-hidden border-dashed bg-neutral-50 opacity-80 pointer-events-none`}
            >


            </div>)}

            <div className="flex items-center justify-between fixed bottom-6 inset-x-0 pointer-events-none px-4">
                <div></div>

                <Toolbar ref={addButtonRef} onAddNote={addNote} />

                {/* no pointer events, useBoard just reads its position through trashRef */}
                <div aria-hidden="true" className="trash aspect-square p-4 border border-red-800 bg-red-600/30 rounded-xl flex items-center justify-center pointer-events-none" ref={trashRef}>
                    <Trash className="size-5 text-red-800"></Trash>
                </div>
            </div>
        </div>
    )
}