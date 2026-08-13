import { useCallback, useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
    const [value, setValue] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            return item !== null ? (JSON.parse(item) as T) : initialValue
        } catch (error) {
            return initialValue
        }
    })


    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch (error) {
            console.warn("Error saving to local storage, key:", key, ": ", error)
        }
    }, [key, value])
    

    const removeValue = useCallback(() => {
        try {
            localStorage.removeItem(key)
            setValue(initialValue)
        } catch (error) {
            console.warn("Error removing from local storage", error)
        }
    }, [key, initialValue])

    return {value, setValue, removeValue}
}