import type {ReviewLog} from './types'
export const dayKey = (ms: number, tz?: string) => new Date(ms).toLocaleDateString('sv', {timeZone: tz})
export function heatmap(logs: ReviewLog[], tz?: string) {
  const m = new Map<string, {n: number; cards: Set<string>; ms: number}>()
  for (const l of logs) { const k = dayKey(l.reviewedAt, tz), o = m.get(k) ?? {n: 0, cards: new Set<string>(), ms: 0}; o.n++; o.cards.add(l.cardId); o.ms += l.activeMs; m.set(k, o) }
  return m
}
/** Se não estudou hoje, a sequência continua contando a partir de ontem. */
export function streak(days: Set<string>, tz?: string) {
  const d = new Date(); d.setHours(12, 0, 0, 0); let t = d.getTime(), cur = 0
  if (!days.has(dayKey(t, tz))) t -= 864e5
  while (days.has(dayKey(t, tz))) { cur++; t -= 864e5 }
  return cur
}
