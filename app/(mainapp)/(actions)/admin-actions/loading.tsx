export default function Loading() {
    return (
        <div className="w-full h-screen p-4 flex flex-col gap-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-3 gap-6">
                <div className="h-64 bg-gray-100 rounded-lg"></div>
                <div className="h-64 bg-gray-100 rounded-lg"></div>
                <div className="h-64 bg-gray-100 rounded-lg"></div>
            </div>
        </div>
    );
}
