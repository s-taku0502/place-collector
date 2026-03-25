"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import MapView from "./MapView";

export default function MapAllPage() {
  const places = useQuery(api.places.list, {});
  return <MapView title="すべての場所" places={places ?? []} />;
}
