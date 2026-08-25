// role alert announces it on its own, that is why it does not also go through `announcement`
export function ErrorToast({ message }: { message: string }) {
    return <div
        role="alert"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-20 bg-red-600 text-white font-medium px-3 py-1.5 rounded-full pointer-events-none"
    >
        {message}
    </div>
}
