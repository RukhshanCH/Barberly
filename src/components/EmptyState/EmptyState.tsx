import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
}

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {children}
    </div>
  );
}
