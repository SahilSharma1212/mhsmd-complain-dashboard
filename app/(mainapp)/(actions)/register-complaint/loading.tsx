export default function Loading() {
    return (
        <div className="w-full h-screen p-4 flex flex-col gap-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-3 gap-4">
                <div className="h-20 bg-gray-100 rounded"></div>
                <div className="h-20 bg-gray-100 rounded"></div>
                <div className="h-20 bg-gray-100 rounded"></div>
            </div>
            <div className="h-40 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
        </div>
    );
}
