import React from "react";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-zinc-800 text-zinc-200 border-zinc-700",
    primary: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    info: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    neutral: "bg-zinc-700/30 text-zinc-300 border-zinc-700/50",
    outline: "bg-transparent text-zinc-300 border-zinc-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase().trim();

  if (s === "success" || s === "selesai" || s === "resolved" || s === "completed") {
    return <Badge variant="success">Selesai</Badge>;
  }
  if (s === "pending" || s === "proses" || s === "in_progress") {
    return <Badge variant="warning">Sedang Diproses</Badge>;
  }
  if (s === "baru" || s === "open") {
    return <Badge variant="info">Baru</Badge>;
  }
  if (s === "failed" || s === "gagal" || s === "ditolak" || s === "closed" || s === "rejected") {
    return <Badge variant="danger">Ditolak</Badge>;
  }
  if (s === "admin") {
    return <Badge variant="primary">Admin</Badge>;
  }
  if (s === "user") {
    return <Badge variant="neutral">Pengguna</Badge>;
  }
  return <Badge variant="default">{status}</Badge>;
}
