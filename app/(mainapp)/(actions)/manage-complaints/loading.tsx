export default function Loading() {
    return (
        <div className="w-full h-screen p-4 flex flex-col gap-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="flex-1 bg-gray-100 rounded-lg"></div>
        </div>
    );
}
