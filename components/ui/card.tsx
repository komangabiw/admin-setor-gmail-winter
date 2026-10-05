import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "glass" | "bordered";
}

export function Card({
  children,
  className = "",
  variant = "default",
  ...props
}: CardProps) {
  const variants = {
    default: "bg-zinc-900/90 border border-zinc-800 shadow-sm rounded-xl",
    glass: "bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-xl",
    bordered: "bg-zinc-950 border border-zinc-800 rounded-xl",
  };

  return (
    <div className={`${variants[variant]} p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = "",
}: {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div>
        <h3 className="font-semibold text-zinc-100 text-base">{title}</h3>
        {subtitle && (
          <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
