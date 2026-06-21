import { C } from "@/constants/colors";
import { QUICK } from "@/constants/dummyExercise";
import { uid } from "@/utils/helper";
import type { ChangeEvent, JSX, KeyboardEvent } from "react";
import { useState } from "react";
import {
    Plus, Dumbbell, X
  } from "lucide-react";
import { s } from "@/constants/properties";
import ActivityCard from "../_components/activityCard";

interface SetForm { weight:string; reps:string; }
type WorkoutData = Record<string, Workout>;
interface SetEntry { id:string; weight:number; reps:number; }
interface Activity { id:string; name:string; sets:SetEntry[]; }
interface Workout { exercises: Activity[]; }
interface LogTabProps { today:string; todayWorkout:Workout; data:WorkoutData; update:(next:WorkoutData)=>void; }

export default function LogTab({ today, todayWorkout, data, update }: LogTabProps): JSX.Element {
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
  
    function addActivity(name: string) {
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
  
    function deleteActivity(id: string) {
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
              { label: "Activitys", value: todayWorkout.exercises.length, color: C.accent  },
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
              <ActivityCard
                key={exercise.id}
                exercise={exercise}
                idx={idx}
                isExpanded={expanded === exercise.id}
                isLogging={loggingId === exercise.id}
                setForm={setForm}
                onToggle={() => setExpanded(expanded === exercise.id ? null : exercise.id)}
                onDelete={() => deleteActivity(exercise.id)}
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
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addActivity(query)}
                placeholder="Activity name…"
                style={s.input}
              />
              <button onClick={() => addActivity(query)} style={{ ...s.btn(C.accent, "#fff"), padding: "10px 16px" }}>Add</button>
              <button onClick={() => { setShowAdd(false); setQuery(""); }} style={{ ...s.btn(C.raised, C.muted), padding: "10px 12px" }}><X size={17} /></button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {suggestions.map(name => (
                <button key={name} onClick={() => addActivity(name)}
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