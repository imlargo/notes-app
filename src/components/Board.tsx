import { useCallback, useRef } from "react";
import { StickyNote } from "./StickyNote";
import { Toolbar } from "./Toolbar";
import { useBoard } from "../hooks/useBoard";
import { StorageSelector } from "./StorageSelector";
import { SyncIndicator } from "./SyncIndicator";
import { DraftRect } from "./DraftRect";
import { ScreenReaderStatus } from "./ScreenReaderStatus";
import { AuthorLink } from "./AuthorLink";
import { TrashZone } from "./TrashZone";

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

    const handleDelete = useCallback((id: number) => {
        deleteNote(id)
        addButtonRef.current?.focus()
    }, [deleteNote])

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
            <ScreenReaderStatus announcement={announcement} />

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


            {draft && <DraftRect rect={draft} />}

            <div className="flex items-center justify-between fixed bottom-6 inset-x-0 pointer-events-none px-4">
                <AuthorLink />

                <Toolbar
                    ref={addButtonRef}
                    onAddNote={addNote}
                    color={toolbarColor}
                    colorLabel={activeNoteId !== null ? "Color of the selected note" : "Color for new notes"}
                    onSelectColor={selectColor}
                />

                <TrashZone ref={trashRef} />
            </div>
        </div>
    )
}