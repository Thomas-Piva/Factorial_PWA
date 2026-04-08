import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
        {title}
      </h1>
      {children}
    </div>
  );
}
