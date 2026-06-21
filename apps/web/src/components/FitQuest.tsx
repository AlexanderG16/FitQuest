import React, { useState, useCallback } from "react";
import type { JSX } from "react";
import {
  Dumbbell, History, TrendingUp
} from "lucide-react";
import { C } from "@/constants/colors";
import LogTab from "./log/tab";
import HistoryTab from "./history/tab";
import ProgressTab from "./progress/tab";
import { offsetKey, todayKey, uid } from "@/utils/helper";

interface SetEntry { id:string; weight:number; reps:number; }
interface Activity { id:string; name:string; sets:SetEntry[]; }
interface Workout { exercises: Activity[]; }
type WorkoutData = Record<string, Workout>;

// ─── Seed data (replaces localStorage for this prototype) ───────────────────
// In your real project: initialise from localStorage.getItem("fitquest") instead.

function seedData(): WorkoutData {
  const d: WorkoutData = {};

  d[offsetKey(-1) as string] = {
    exercises: [
      { id: uid(), name: "Bench Press",    sets: [{ id: uid(), weight: 80, reps: 8 }, { id: uid(), weight: 80, reps: 7 }, { id: uid(), weight: 85, reps: 6 }] },
      { id: uid(), name: "Pull-up",        sets: [{ id: uid(), weight: 0, reps: 10 }, { id: uid(), weight: 0, reps: 9 }, { id: uid(), weight: 0, reps: 8 }] },
      { id: uid(), name: "Overhead Press", sets: [{ id: uid(), weight: 50, reps: 8 }, { id: uid(), weight: 52, reps: 6 }] },
    ],
  };

  d[offsetKey(-3) as string] = {
    exercises: [
      { id: uid(), name: "Squat",              sets: [{ id: uid(), weight: 100, reps: 5 }, { id: uid(), weight: 100, reps: 5 }, { id: uid(), weight: 105, reps: 4 }] },
      { id: uid(), name: "Romanian Deadlift",  sets: [{ id: uid(), weight: 80, reps: 8 }, { id: uid(), weight: 80, reps: 8 }] },
    ],
  };

  d[offsetKey(-5) as string] = {
    exercises: [
      { id: uid(), name: "Deadlift",      sets: [{ id: uid(), weight: 130, reps: 3 }, { id: uid(), weight: 135, reps: 3 }, { id: uid(), weight: 140, reps: 2 }] },
      { id: uid(), name: "Barbell Row",   sets: [{ id: uid(), weight: 70, reps: 8 }, { id: uid(), weight: 70, reps: 8 }, { id: uid(), weight: 72, reps: 7 }] },
    ],
  };

  d[offsetKey(-7) as string] = {
    exercises: [
      { id: uid(), name: "Bench Press",   sets: [{ id: uid(), weight: 77, reps: 8 }, { id: uid(), weight: 80, reps: 7 }, { id: uid(), weight: 80, reps: 6 }] },
      { id: uid(), name: "Dumbbell Curl", sets: [{ id: uid(), weight: 16, reps: 12 }, { id: uid(), weight: 16, reps: 10 }] },
    ],
  };

  return d;
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════════════════

export default function FitQuest(): JSX.Element {
  const [tab, setTab] = useState<"log"|"history"|"progress">("log");
  // NOTE: swap `seedData()` for `JSON.parse(localStorage.getItem("fitquest") || "{}")` in production
  const [data, setData] = useState<WorkoutData>(seedData);

  const update = useCallback((next: WorkoutData): void => {
    setData(next);
    // NOTE: uncomment in production → localStorage.setItem("fitquest", JSON.stringify(next));
  }, []);

  const today        = todayKey();
  const todayWorkout = data[today as string] || { exercises: [] };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Inter, system-ui, sans-serif", display: "flex", flexDirection: "column", maxWidth: "480px", margin: "0 auto", position: "relative" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, background: C.accent, borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Dumbbell size={18} color="#fff" />
        </div>
        <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px" }}>
          Fit<span style={{ color: C.accentHi }}>Quest</span>
        </span>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "80px" }}>
        {tab === "log"      && <LogTab      today={today as string} todayWorkout={todayWorkout} data={data} update={update} />}
        {tab === "history"  && <HistoryTab  data={data} today={today as string} />}
        {tab === "progress" && <ProgressTab data={data} />}
      </div>

      {/* ── Bottom Nav ─────────────────────────────────────────────────── */}
      <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
        {[
          { id: "log",      Icon: Dumbbell,   label: "Log"      },
          { id: "history",  Icon: History,    label: "History"  },
          { id: "progress", Icon: TrendingUp, label: "Progress" },
        ].map(({ id, Icon, label }) => (
          <button
            key={String(id)}
            id={`fitquest-nav-${id}`}
            onClick={() => setTab(id as "log" | "history" | "progress")}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              color: tab === id ? C.accent : C.dim,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: "10px 0",
              cursor: "pointer",
            }}
          >
            <Icon size={21} />
            <span style={{ fontSize: "11px", fontWeight: tab === id ? 700 : 400 }}>{label}</span>
          </button>
     
        ))}
      </nav>
    </div>
  );
}