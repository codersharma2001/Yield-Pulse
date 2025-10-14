import type { ReactNode } from "react";

export interface PillProps {
  intent?: "default" | "success" | "warning" | "danger";
  children: ReactNode;
}

const INTENT_TO_COLOR: Record<NonNullable<PillProps["intent"]>, string> = {
  default: "#1e293b",
  success: "#047857",
  warning: "#b45309",
  danger: "#b91c1c"
};

export const Pill = ({ intent = "default", children }: PillProps) => {
  const background = INTENT_TO_COLOR[intent];

  return (
    <span
      style={{
        backgroundColor: background,
        color: "#f8fafc",
        fontSize: "0.75rem",
        letterSpacing: "0.05em",
        padding: "0.25rem 0.75rem",
        borderRadius: "9999px",
        textTransform: "uppercase"
      }}
    >
      {children}
    </span>
  );
};
