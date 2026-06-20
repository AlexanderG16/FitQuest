import React, { useState, useCallback } from "react";
import type { CSSProperties, ReactNode, ChangeEvent, KeyboardEvent, Dispatch, SetStateAction, JSX } from "react";
import {
  Plus, Trash2, Dumbbell, History, TrendingUp,
  ChevronDown, ChevronUp, Check, X, Calendar
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SetEntry { id:string; weight:number; reps:number; }
interface Exercise { id:string; name:string; sets:SetEntry[]; }
interface Workout { exercises: Exercise[]; }
type WorkoutData = Record<string, Workout>;
interface SetForm { weight:string; reps:string; }
interface LogTabProps { today:string; todayWorkout:Workout; data:WorkoutData; update:(next:WorkoutData)=>void; }
interface HistoryTabProps { data:WorkoutData; today:string; }
interface ProgressTabProps { data:WorkoutData; }
interface ExerciseCardProps {
 exercise:Exercise; idx:number; isExpanded:boolean; isLogging:boolean;
 setForm:SetForm;
 onToggle:()=>void; onDelete:()=>void; onStartLog:()=>void; onCancelLog:()=>void;
 onFormChange: Dispatch<SetStateAction<SetForm>>;
 onSubmitSet:()=>void; onDeleteSet:(sid:string)=>void;
}
interface EmptyStateProps { icon:ReactNode; title:string; sub:string; }


// ─── Helpers ────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function todayKey() { return new Date().toISOString().split("T")[0]; }

function offsetKey(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function labelDate(key: string) {
  const today = todayKey();
  const yest  = offsetKey(-1);
  if (key === today) return "Today";
  if (key === yest)  return "Yesterday";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y as number, (m as number) - 1, d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

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

// ─── Design tokens (inline – works regardless of Tailwind purge config) ─────

const C = {
  bg:         "#0A0E1A",
  surface:    "#111827",
  raised:     "#1F2937",
  border:     "#1F2937",
  accent:     "#6366F1",
  accentSoft: "rgba(99,102,241,0.15)",
  accentHi:   "#818CF8",
  success:    "#10B981",
  successSoft:"rgba(16,185,129,0.12)",
  amber:      "#F59E0B",
  amberSoft:  "rgba(245,158,11,0.12)",
  danger:     "#EF4444",
  dangerSoft: "rgba(239,68,68,0.12)",
  text:       "#F9FAFB",
  muted:      "#9CA3AF",
  dim:        "#6B7280",
};

const s: {card:CSSProperties; input:CSSProperties; btn:(bg:string,color:string,border?:string)=>CSSProperties} = {
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

// ─── Quick-add exercise suggestions ─────────────────────────────────────────

const QUICK = ["Bench Press","Squat","Deadlift","Pull-up","Overhead Press","Barbell Row","Dumbbell Curl","Leg Press","Romanian Deadlift","Tricep Pushdown"];

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

// ════════════════════════════════════════════════════════════════════════════
// LOG TAB
// ════════════════════════════════════════════════════════════════════════════

function LogTab({ today, todayWorkout, data, update }: LogTabProps): JSX.Element {
  const [showAdd,   setShowAdd]   = useState(false);
  const [query,     setQuery]     = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [setForm, setSetForm] = useState<SetForm>({weight:"", reps:""});

  const totalSets   = todayWorkout.exercises.reduce((a, e) => a + e.sets.length, 0);
  const totalVolume = todayWorkout.exercises.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.weight * s.reps, 0), 0);

  function persist(exercises: Array<{ id: string; name: string; sets: Array<{ id: string; weight: number; reps: number }> }>) {
    update({ ...data, [today]: { exercises } });
  }

  function addExercise(name: string) {
    if (!name.trim()) return;
    const ex = { id: uid(), name: name.trim(), sets: [] };
    const next = [...todayWorkout.exercises, ex];
    persist(next);
    setExpanded(ex.id);
    setLoggingId(ex.id);
    setSetForm({ weight: "", reps: "" });
    setQuery("");
    setShowAdd(false);
  }

  function deleteExercise(id: string) {
    persist(todayWorkout.exercises.filter(e => e.id !== id));
    if (expanded  === id) setExpanded(null);
    if (loggingId === id) setLoggingId(null);
  }

  function addSet(exerciseId: string) {
    const reps   = parseInt(setForm.reps)    || 0;
    const weight = parseFloat(setForm.weight) || 0;
    if (!reps) return;
    const next = todayWorkout.exercises.map(e =>
      e.id === exerciseId ? { ...e, sets: [...e.sets, { id: uid(), weight, reps }] } : e
    );
    persist(next);
    setSetForm(f => ({ ...f, reps: "" }));
  }

  function deleteSet(exerciseId: string, setId: string) {
    const next = todayWorkout.exercises.map(e =>
      e.id === exerciseId ? { ...e, sets: e.sets.filter(s => s.id !== setId) } : e
    );
    persist(next);
  }

  const suggestions = query.length > 0
    ? QUICK.filter(n => n.toLowerCase().includes(query.toLowerCase()))
    : QUICK.slice(0, 5);

  return (
    <div style={{ padding: "20px 16px" }}>
      {/* date + title */}
      <div style={{ color: C.muted, fontSize: 13, marginBottom: 4 }}>
        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 20px" }}>
        Today's workout
      </h1>

      {/* stats strip */}
      {totalSets > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Exercises", value: todayWorkout.exercises.length, color: C.accent  },
            { label: "Sets",      value: totalSets,                     color: C.success },
            { label: "Volume",    value: totalVolume > 0 ? `${totalVolume} kg` : "BW", color: C.amber },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ flex: 1, ...s.card, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* empty state */}
      {todayWorkout.exercises.length === 0 && !showAdd && (
        <div style={{ textAlign: "center", padding: "50px 20px", color: C.muted }}>
          <div style={{ width: 60, height: 60, background: C.accentSoft, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Dumbbell size={26} color={C.accent} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px", color: C.text }}>No exercises yet</p>
          <p style={{ fontSize: 13, margin: 0 }}>Tap "Add exercise" to start logging</p>
        </div>
      )}

      {/* exercise cards */}
      {todayWorkout.exercises.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
          {todayWorkout.exercises.map((exercise, idx) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              idx={idx}
              isExpanded={expanded === exercise.id}
              isLogging={loggingId === exercise.id}
              setForm={setForm}
              onToggle={() => setExpanded(expanded === exercise.id ? null : exercise.id)}
              onDelete={() => deleteExercise(exercise.id)}
              onStartLog={() => { setLoggingId(exercise.id); setExpanded(exercise.id); setSetForm({ weight: "", reps: "" }); }}
              onCancelLog={() => setLoggingId(null)}
              onFormChange={setSetForm}
              onSubmitSet={() => addSet(exercise.id)}
              onDeleteSet={(sid) => deleteSet(exercise.id, sid)}
            />
          ))}
        </div>
      )}

      {/* add exercise panel */}
      {showAdd ? (
        <div style={{ ...s.card, border: `1px solid ${C.accent}`, padding: 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              autoFocus
              value={query}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addExercise(query)}
              placeholder="Exercise name…"
              style={s.input}
            />
            <button onClick={() => addExercise(query)} style={{ ...s.btn(C.accent, "#fff"), padding: "10px 16px" }}>Add</button>
            <button onClick={() => { setShowAdd(false); setQuery(""); }} style={{ ...s.btn(C.raised, C.muted), padding: "10px 12px" }}><X size={17} /></button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {suggestions.map(name => (
              <button key={name} onClick={() => addExercise(name)}
                style={{ ...s.btn(C.accentSoft, C.accentHi, `1px solid ${C.accent}`), padding: "5px 12px", borderRadius: 20, fontWeight: 500, fontSize: 12 }}>
                {name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          style={{ width: "100%", ...s.btn(C.accentSoft, C.accent, `1.5px dashed ${C.accent}`), padding: 16, borderRadius: 12, fontSize: 15 }}>
          <Plus size={20} /> Add exercise
        </button>
      )}
    </div>
  );
}

// ─── Exercise Card ───────────────────────────────────────────────────────────

function ExerciseCard({ exercise, idx, isExpanded, isLogging, setForm, onToggle, onDelete, onStartLog, onCancelLog, onFormChange, onSubmitSet, onDeleteSet }: ExerciseCardProps): JSX.Element {
  const vol = exercise.sets.reduce((a, s) => a + s.weight * s.reps, 0);

  return (
    <div style={{ ...s.card, border: `1px solid ${isExpanded ? C.accent : C.border}` }}>
      {/* header row */}
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
        <div style={{ width: 32, height: 32, background: C.accentSoft, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: C.accent, flexShrink: 0 }}>
          {idx + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{exercise.name}</div>
          <div style={{ color: C.muted, fontSize: 12 }}>
            {exercise.sets.length} {exercise.sets.length === 1 ? "set" : "sets"}
            {vol > 0 && ` · ${vol} kg volume`}
          </div>
        </div>
        {isExpanded ? <ChevronUp size={17} color={C.dim} /> : <ChevronDown size={17} color={C.dim} />}
      </div>

      {/* expanded body */}
      {isExpanded && (
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          {/* sets table */}
          {exercise.sets.length > 0 && (
            <div style={{ padding: "12px 16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 1fr 32px", gap: 8, color: C.dim, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6, padding: "0 4px" }}>
                <span>#</span><span>Weight</span><span>Reps</span><span></span>
              </div>
              {exercise.sets.map((set, si) => (
                <div key={set.id} style={{ display: "grid", gridTemplateColumns: "30px 1fr 1fr 32px", gap: 8, alignItems: "center", padding: "7px 4px", borderBottom: si < exercise.sets.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ color: C.accent, fontWeight: 800, fontSize: 13 }}>{si + 1}</span>
                  <span style={{ fontWeight: 600 }}>{set.weight === 0 ? "BW" : `${set.weight} kg`}</span>
                  <span style={{ fontWeight: 600 }}>{set.reps}</span>
                  <button onClick={() => onDeleteSet(set.id)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* log set form */}
          {isLogging ? (
            <div style={{ padding: "12px 16px", borderTop: exercise.sets.length > 0 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.dim, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Weight (kg)</div>
                  <input type="number" value={setForm.weight} onChange={(e: ChangeEvent<HTMLInputElement>) => onFormChange(f => ({ ...f, weight: e.target.value }))} placeholder="0" style={s.input} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.dim, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Reps</div>
                  <input autoFocus type="number" value={setForm.reps} onChange={(e: ChangeEvent<HTMLInputElement>) => onFormChange(f => ({ ...f, reps: e.target.value }))} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && onSubmitSet()} placeholder="0" style={s.input} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 22 }}>
                  <button onClick={onSubmitSet} style={{ ...s.btn(C.success, "#fff"), padding: "10px 12px" }}><Check size={17} /></button>
                  <button onClick={onCancelLog} style={{ ...s.btn(C.raised, C.muted), padding: "10px 12px" }}><X size={17} /></button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: exercise.sets.length > 0 ? `1px solid ${C.border}` : "none" }}>
              <button onClick={onStartLog} style={{ flex: 1, ...s.btn(C.successSoft, C.success, `1px solid ${C.success}`), padding: 10, borderRadius: 8 }}>
                <Plus size={15} /> Add set
              </button>
              <button onClick={onDelete} style={{ ...s.btn(C.dangerSoft, C.danger, `1px solid ${C.danger}`), padding: "10px 14px", borderRadius: 8 }}>
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// HISTORY TAB
// ════════════════════════════════════════════════════════════════════════════

function HistoryTab({ data }: HistoryTabProps): JSX.Element {
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

// ════════════════════════════════════════════════════════════════════════════
// PROGRESS TAB
// ════════════════════════════════════════════════════════════════════════════

function ProgressTab({ data }: ProgressTabProps): JSX.Element {
  const days      = Object.keys(data).filter(d => (data[d] as Workout).exercises.length > 0);
  const totalWkts = days.length;
  const totalSets = days.reduce((a, d) => a + (data[d] as Workout).exercises.reduce((b, e) => b + e.sets.length, 0), 0);
  const totalVol  = days.reduce((a, d) => a + (data[d] as Workout).exercises.reduce((b, e) => b + e.sets.reduce((c, s) => c + s.weight * s.reps, 0), 0), 0);

  const freq: Record<string,number> = {};
  days.forEach(d => (data[d] as Workout).exercises.forEach(e => { freq[e.name] = (freq[e.name] || 0) + 1; }));
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const chartData = days.sort().slice(-8).map(d => ({
    date: (() => { const [yr,mo,da] = d.split("-").map(Number); return new Date(yr as number, (mo as number)-1, da).toLocaleDateString("en-US", { month: "short", day: "numeric" }); })(),
    vol:  (data[d] as Workout).exercises.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.weight * s.reps, 0), 0),
    sets: (data[d] as Workout).exercises.reduce((a, e) => a + e.sets.length, 0),
  }));

  if (totalWkts === 0) return <EmptyState icon={<TrendingUp size={28} color={C.accent} />} title="No data yet" sub="Start logging workouts to track progress" />;

  return (
    <div style={{ padding: "20px 16px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 20px" }}>Progress</h2>

      {/* summary grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Workouts",  value: totalWkts,               color: C.accent  },
          { label: "Total sets",value: totalSets,               color: C.success },
          { label: "Volume",    value: `${totalVol.toLocaleString()} kg`, color: C.amber  },
          { label: "Exercises", value: Object.keys(freq).length, color: "#A78BFA" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...s.card, padding: "16px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* chart */}
      {chartData.length > 1 && (
        <div style={{ ...s.card, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Volume per session</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fill: C.dim, fontSize: 10 }} />
              <YAxis tick={{ fill: C.dim, fontSize: 10 }} width={40} />
              <Tooltip
                contentStyle={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8 }}
                labelStyle={{ color: C.text }}
                itemStyle={{ color: C.accent }}
                formatter={(value, name): [string, string] => [
                    `${value ?? 0} kg`,
                    name === "vol" ? "Volume" : String(name),
                  ]}
              />
              <Line
                type="monotone"
                dataKey="vol"
                stroke={C.accent}
                strokeWidth={2}
                dot={{ fill: C.accent, r: 4 }}
                activeDot={{ r: 6 }}
                name="Volume"
                unit=" kg"
              />
        
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* top exercises */}
      {top.length > 0 && (
        <div style={{ ...s.card, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Top exercises</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {top.map(([name, count], i) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 24, height: 24, background: i === 0 ? C.amberSoft : C.accentSoft, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: i === 0 ? C.amber : C.accent }}>
                  {i + 1}
                </div>
                <span style={{ flex: 1, fontSize: 14 }}>{name}</span>
                <span style={{ background: C.raised, color: C.muted, fontSize: 12, padding: "3px 9px", borderRadius: 10 }}>{count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared empty state ──────────────────────────────────────────────────────

function EmptyState({ icon, title, sub }: EmptyStateProps): JSX.Element {
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
