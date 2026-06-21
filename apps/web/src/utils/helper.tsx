export function uid() { return Math.random().toString(36).slice(2, 9); }

export function todayKey() { return new Date().toISOString().split("T")[0]; }

export function offsetKey(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function labelDate(key: string) {
  const today = todayKey();
  const yest  = offsetKey(-1);
  if (key === today) return "Today";
  if (key === yest)  return "Yesterday";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y as number, (m as number) - 1, d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}