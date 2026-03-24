"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  // eslint-disable-next-line no-console
  console.warn(
    "NEXT_PUBLIC_CONVEX_URL is not set. Convex client will be created with empty URL and may fail in runtime."
  );
}
const convex = new ConvexReactClient(convexUrl ?? "");

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
