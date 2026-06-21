import { C } from "@/constants/colors";
import { s } from "@/constants/properties";
import { Check, ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import type { JSX, Dispatch, SetStateAction, ChangeEvent, KeyboardEvent } from "react";

interface SetEntry { id:string; weight:number; reps:number; }
interface Activity { id:string; name:string; sets:SetEntry[]; }
interface SetForm { weight:string; reps:string; }
interface ActivityCardProps {
    exercise:Activity; idx:number; isExpanded:boolean; isLogging:boolean;
    setForm:SetForm;
    onToggle:()=>void; onDelete:()=>void; onStartLog:()=>void; onCancelLog:()=>void;
    onFormChange: Dispatch<SetStateAction<SetForm>>;
    onSubmitSet:()=>void; onDeleteSet:(sid:string)=>void;
   }

export default function ActivityCard({ exercise, idx, isExpanded, isLogging, setForm, onToggle, onDelete, onStartLog, onCancelLog, onFormChange, onSubmitSet, onDeleteSet }: ActivityCardProps): JSX.Element {
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