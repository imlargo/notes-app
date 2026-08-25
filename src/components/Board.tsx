import { useRef } from "react";
import { StickyNote } from "./StickyNote";
import { Toolbar } from "./Toolbar";
import { Trash } from "lucide-react";
import { useBoard } from "../hooks/useBoard";
import { StorageSelector } from "./StorageSelector";
import { SyncIndicator } from "./SyncIndicator";

export function Board() {
    const {
        notes,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        cancelGesture,
        onDoubleClick,
        editingId,
        overTrash,
        editNote,
        stopEditing,
        draft,
        boardRef,
        trashRef,
        draggingId,
        addNote,
        moveNoteBy,
        resizeNoteBy,
        deleteNote,
        startEditing,
        announcement,
        isLoading,
        storageType,
        changeStorage,
        activeNoteId,
        activateNote,
        deactivateNote,
        toolbarColor,
        selectColor,
    } = useBoard();

    const addButtonRef = useRef<HTMLButtonElement>(null)

    const handleDelete = (id: number) => {
        deleteNote(id)
        addButtonRef.current?.focus()
    }

    return (
        <div className="board canvas-grid w-full h-full relative select-none"
            ref={boardRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={cancelGesture}
            onLostPointerCapture={cancelGesture}
            onDoubleClick={onDoubleClick}
        >
            <p id="board-instructions" className="sr-only">
                Arrow keys move the focused note, hold shift to move further, hold alt to resize instead, enter opens it for editing, delete removes it, escape deselects it.
            </p>

            <div aria-live="polite" className="sr-only">{announcement}</div>

            <StorageSelector value={storageType} onChange={changeStorage} />

            {isLoading && <SyncIndicator />}

            {notes.map((note) => (
                <StickyNote
                    fading={overTrash && draggingId === note.id}
                    editing={editingId === note.id}
                    onChange={editNote}
                    onStopEditing={stopEditing}
                    onMove={moveNoteBy}
                    onResize={resizeNoteBy}
                    onDelete={handleDelete}
                    onStartEditing={startEditing}
                    active={activeNoteId === note.id}
                    onActivate={activateNote}
                    onDeactivate={deactivateNote}

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
                <a
                    href="https://github.com/imlargo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pointer-events-auto flex items-center gap-x-2 px-3 py-2 rounded-full bg-white border text-sm font-medium"
                >
                    <span className="text-neutral-400">by</span>
                    <span>imlargo.dev</span>
                </a>

                <Toolbar
                    ref={addButtonRef}
                    onAddNote={addNote}
                    color={toolbarColor}
                    colorLabel={activeNoteId !== null ? "Color of the selected note" : "Color for new notes"}
                    onSelectColor={selectColor}
                />

                {/* no pointer events, useBoard just reads its position through trashRef */}
                <div aria-hidden="true" className="trash aspect-square p-4 border border-red-800 bg-red-600/30 rounded-xl flex items-center justify-center pointer-events-none" ref={trashRef}>
                    <Trash className="size-5 text-red-800"></Trash>
                </div>
            </div>
        </div>
    )
}