import React from "react";

type MetricSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function MetricSection({ title, children }: MetricSectionProps) {
  return (
    <div className="metric-section">
      <h4>{title}</h4>
      <div className="metrics-group">
        {children}
      </div>
    </div>
  );
}
