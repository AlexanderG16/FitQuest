import type { JSX } from "react";
import EmptyState from "../_components/emptyState";
import { TrendingUp } from "lucide-react";
import { C } from "@/constants/colors";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { s } from "@/constants/properties";

interface SetEntry { id:string; weight:number; reps:number; }
interface Activity { id:string; name:string; sets:SetEntry[]; }
interface Workout { exercises: Activity[]; }
type WorkoutData = Record<string, Workout>;
interface ProgressTabProps { data:WorkoutData; }

export default function ProgressTab({ data }: ProgressTabProps): JSX.Element {
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
            { label: "Activitys", value: Object.keys(freq).length, color: "#A78BFA" },
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