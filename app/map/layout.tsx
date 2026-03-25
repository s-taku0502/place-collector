import Link from "next/link";

export const metadata = {
  title: "Map",
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <section>{children}</section>
      </div>
    </div>
  );
}
