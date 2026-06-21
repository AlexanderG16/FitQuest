import type { CSSProperties } from "react";
import { C } from "./colors";

export const s: {card:CSSProperties; input:CSSProperties; btn:(bg:string,color:string,border?:string)=>CSSProperties} = {
    card: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: "12px",
      overflow: "hidden",
    },
    input: {
      width: "100%",
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: "8px",
      padding: "10px 12px",
      color: C.text,
      fontSize: "16px",
      outline: "none",
      boxSizing: "border-box",
    },
    btn: (bg, color, border) => ({
      background: bg,
      border: border ?? "none",
      borderRadius: "8px",
      color,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      fontWeight: "600",
      fontSize: "13px",
    }),
  };