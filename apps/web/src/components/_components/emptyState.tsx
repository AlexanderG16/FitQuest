import { C } from "@/constants/colors";
import type { JSX, ReactNode } from "react";

interface EmptyStateProps { icon:ReactNode; title:string; sub:string; }

export default function EmptyState({ icon, title, sub }: EmptyStateProps): JSX.Element {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
        <div style={{ width: 60, height: 60, background: C.accentSoft, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          {icon}
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px", color: C.text }}>{title}</p>
        <p style={{ fontSize: 13, margin: 0 }}>{sub}</p>
      </div>
    );
  }