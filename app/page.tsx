"use client";
import { useQuery, useMutation } from "convex/react";
import { redirect, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  
  const places = useQuery(api.places.list, {});
  const toggleVisited = useMutation(api.places.toggleStatus); // 行った・行ってないを切り替える

  return (
    redirect("/place")
  );
}
