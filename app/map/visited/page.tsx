"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import MapView from "../MapView";
import { STATUSES } from "@/lib/constants";

export default function MapVisitedPage() {
  const places = useQuery(api.places.list, {});
  const data = (places ?? []).filter((p: any) => p.status === STATUSES[2] || p.status === STATUSES[3]);
  return <MapView title="行った場所（1回以上）" places={data} />;
}
