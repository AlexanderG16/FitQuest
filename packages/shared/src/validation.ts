export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function clampPageSize(pageSize: number, max: number = 100): number {
  return Math.min(Math.max(1, pageSize), max);
}
