import Link from "next/link";

export const metadata = {
  title: "Map",
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-6">
          <nav className="flex gap-3">
            <Link href="/map" className="px-4 py-2 rounded-lg bg-blue-600 text-white">すべて</Link>
            <Link href="/map/visited" className="px-4 py-2 rounded-lg bg-green-500 text-white">行った場所</Link>
            <Link href="/map/unvisited" className="px-4 py-2 rounded-lg bg-gray-200">まだ行ってない</Link>
          </nav>
        </header>
        <section>{children}</section>
      </div>
    </div>
  );
}
