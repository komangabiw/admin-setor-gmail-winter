import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const sizes = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-5 py-2.5 gap-2.5",
  };

  const variants = {
    primary:
      "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950/20 focus:ring-2 focus:ring-emerald-500 focus:outline-none",
    secondary:
      "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 focus:ring-2 focus:ring-zinc-600 focus:outline-none",
    danger:
      "bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-950/20 focus:ring-2 focus:ring-rose-500 focus:outline-none",
    ghost:
      "bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-white focus:outline-none",
    outline:
      "bg-transparent border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white focus:outline-none",
    success:
      "bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : null}
      {children}
    </button>
  );
}
