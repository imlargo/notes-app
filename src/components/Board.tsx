import { Toolbar } from "./Toolbar";
import { randomColor, type Note } from "../domain/note";
import { StickyNote } from "./StickyNote";
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
        draggingId
    } = useBoard();

    return (
        <div className="board canvas-grid w-full h-full relative select-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onDoubleClick={onDoubleClick}
        >

            {notes.map((note) => (
                <StickyNote
                    fading={overTrash && draggingId === note.id}
                    editing={editingId === note.id}
                    onChange={patchNote}
                    onStopEditing={stopEditing}

                    key={note.id} note={note} ></StickyNote>
            ))}


            {draft && (<StickyNote className="pointer-events-none" note={{ ...draft} as Note} ></StickyNote>)}

            <div className="flex items-center justify-between fixed bottom-6 inset-x-0 pointer-events-none px-4">
                <div></div>
                <Toolbar></Toolbar>

                <div className="trash aspect-square p-4 border border-red-800 bg-red-600/30 rounded-xl flex items-center justify-center pointer-events-none" ref={trashRef}>
                    <Trash className="size-5 text-red-800"></Trash>
                </div>
            </div>
        </div>
    )
}