import type {Card, Rating, Sched} from './types'
const DAY = 864e5
/** Agendamento simples inspirado no SM-2. NÃO é FSRS. */
export function schedule(c: Sched, r: Rating, now = Date.now()): Sched {
  let {ease, intervalDays: iv, reps, lapses} = c
  if (r === 0) return {ease: Math.max(1.3, ease - .2), intervalDays: 0, reps: 0, lapses: lapses + 1, dueAt: now + 10 * 60e3}
  if (r === 1) { ease = Math.max(1.3, ease - .15); iv = Math.max(1, Math.round(iv * 1.2)) }
  else if (r === 2) iv = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(iv * ease)
  else { ease += .15; iv = reps === 0 ? 3 : reps === 1 ? 5 : Math.round(iv * ease * 1.3) }
  return {ease, intervalDays: iv, reps: reps + 1, lapses, dueAt: now + iv * DAY}
}
export const pick = (c: Card): Sched => ({ease: c.ease, intervalDays: c.intervalDays, reps: c.reps, lapses: c.lapses, dueAt: c.dueAt})
