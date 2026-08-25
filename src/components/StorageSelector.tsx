import type { StorageType } from "../hooks/useBoard"

interface StorageSelectorProps {
    value: StorageType
    onChange: (type: StorageType) => void
}

export function StorageSelector({ value, onChange }: StorageSelectorProps) {
    return <select
        value={value}
        onChange={(e) => onChange(e.target.value as StorageType)}
        aria-label="Storage backend"
        className="fixed top-4 right-4 z-20 pointer-events-auto border rounded-full bg-white px-4 py-2"
    >
        <option value="memory">Memory (resets on reload)</option>
        <option value="local">Local storage (persists)</option>
    </select>
}
