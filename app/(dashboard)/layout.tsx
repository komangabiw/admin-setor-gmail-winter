"use client";

import React from "react";
import { AdminGuard } from "@/components/layout/admin-guard";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        {/* Top Header with Status Integrasi & Tautan Cepat */}
        <Header />

        {/* Content area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-10">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
