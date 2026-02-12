"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const formatDateTime = (timestamp?: number) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};


export default function PasswordResetAdminPage() {
    const router = useRouter();
    const user = useQuery(api.users.getCurrentUser, {});
    const requests = useQuery(api.users.listPasswordResetRequests, {});
    const issueToken = useMutation(api.users.issuePasswordResetToken);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (user && !user.isAdmin) {
            router.replace("/admin/login");
        }
    }, [user, router]);

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }
    if (!user.isAdmin) {
        return null;
    }

    const rows = useMemo(() => requests ?? [], [requests]);
    const filter = searchParams.get("filter") ?? "all";
    const filteredRows = rows.filter((row) => {
        if (filter === "sent") return row.status === "sent";
        if (filter === "pending") return row.status !== "sent";
        return true;
    });

    // ...existing code...
}
