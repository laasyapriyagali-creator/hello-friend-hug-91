import { ReactNode } from "react";

export default function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between mb-6">
      <div>
        {subtitle && (
          <p className="text-xs uppercase tracking-widest text-primary-deep/70 font-semibold mb-1">
            {subtitle}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      {right}
    </header>
  );
}
