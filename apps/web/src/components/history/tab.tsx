import { C } from "@/constants/colors";
import { s } from "@/constants/properties";
import { labelDate } from "@/utils/helper";
import { Calendar } from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";
import EmptyState from "../_components/emptyState";

interface SetEntry { id:string; weight:number; reps:number; }
interface Activity { id:string; name:string; sets:SetEntry[]; }
interface Workout { exercises: Activity[]; }
type WorkoutData = Record<string, Workout>;
interface HistoryTabProps { data:WorkoutData; today:string; }

export default function HistoryTab({ data }: HistoryTabProps): JSX.Element {
    const [selected, setSelected] = useState<string | null>(null);
  
    const days = Object.keys(data)
      .filter((d) => data[d] && Array.isArray(data[d].exercises) && data[d].exercises.length > 0)
      .sort((a, b) => b.localeCompare(a));
  
    if (selected && data[selected]) {
      const w = data[selected];
      const sets = w.exercises.reduce((a, e) => a + (e.sets ? e.sets.length : 0), 0);
      const vol = w.exercises.reduce(
        (a, e) =>
          a +
          (Array.isArray(e.sets)
            ? e.sets.reduce((b, s) => b + (typeof s.weight === "number" && typeof s.reps === "number" ? s.weight * s.reps : 0), 0)
            : 0),
        0
      );
      return (
        <div style={{ padding: "20px 16px" }}>
          <button
            onClick={() => setSelected(null)}
            style={{
              background: "none",
              border: "none",
              color: C.accent,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              padding: "0 0 16px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ← Back
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>
            {labelDate(selected)}
          </h2>
          <p style={{ color: C.muted, fontSize: 13, margin: "0 0 20px" }}>
            {w.exercises.length} exercises · {sets} sets
            {vol > 0 ? ` · ${vol} kg volume` : ""}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {w.exercises.map((ex, i) => (
              <div key={ex.id || i} style={{ ...s.card, padding: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      background: C.accentSoft,
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 800,
                      color: C.accent,
                    }}
                  >
                    {i + 1}
                  </div>
                  <span style={{ fontWeight: 700 }}>{ex.name}</span>
                </div>
                {Array.isArray(ex.sets) &&
                  ex.sets.map((set, si) => (
                    <div
                      key={set.id || si}
                      style={{
                        display: "flex",
                        gap: 16,
                        fontSize: 13,
                        padding: "4px 0",
                        borderBottom:
                          si < ex.sets.length - 1
                            ? `1px solid ${C.border}`
                            : "none",
                      }}
                    >
                      <span style={{ color: C.dim, width: 45 }}>
                        Set {si + 1}
                      </span>
                      <span style={{ color: C.text, fontWeight: 600 }}>
                        {set.weight === 0
                          ? "BW"
                          : `${set.weight} kg`}{" "}
                        × {set.reps} reps
                      </span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      );
    }
  
    if (days.length === 0) return <EmptyState icon={<Calendar size={28} color={C.accent} />} title="No workouts yet" sub="Complete your first session to see history" />;
  
    return (
      <div style={{ padding: "20px 16px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 20px" }}>History</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {days.map(day => {
            const w = data[day] as Workout;
            const sets = w.exercises.reduce((a, e) => a + e.sets.length, 0);
            const [yr, mo, da] = day.split("-").map(Number);
            return (
              <button key={day} onClick={() => setSelected(day)} style={{ ...s.card, border: `1px solid ${C.border}`, padding: 16, textAlign: "left", cursor: "pointer", color: C.text, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, background: C.accentSoft, borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: C.accent }}>{da}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.accentHi, textTransform: "uppercase" }}>
                    {new Date(yr as number, (mo as number) - 1, da).toLocaleDateString("en-US", { month: "short" })}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{labelDate(day)}</div>
                  <div style={{ color: C.muted, fontSize: 12 }}>{w.exercises.length} exercises · {sets} sets</div>
                </div>
                <span style={{ color: C.dim, fontSize: 18 }}>›</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }