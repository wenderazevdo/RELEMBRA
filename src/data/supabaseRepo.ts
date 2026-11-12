import {supabase} from '../lib/supabase'
import type {Card, Deck, Repo, ReviewLog} from '../domain/types'
const sb = () => { if (!supabase) throw new Error('Supabase não configurado'); return supabase }
const ok = <T,>(r: {data: T | null; error: {message: string} | null}) => { if (r.error) throw new Error(r.error.message); return r.data as T }
const iso = (n: number | null) => (n == null ? null : new Date(n).toISOString())
const toCard = (r: any): Card => ({id: r.id, deckId: r.deck_id, question: r.question, answer: r.answer, subject: r.subject ?? undefined, topic: r.topic ?? undefined, tags: r.tags ?? [], source: r.source ?? undefined, favorite: r.favorite, suspended: r.suspended, dueAt: r.due_at ? Date.parse(r.due_at) : null, ease: r.ease, intervalDays: r.interval_days, reps: r.reps, lapses: r.lapses})
const fromCard = (c: Card) => ({id: c.id, deck_id: c.deckId, question: c.question, answer: c.answer, subject: c.subject ?? null, topic: c.topic ?? null, tags: c.tags, source: c.source ?? null, favorite: c.favorite, suspended: c.suspended, due_at: iso(c.dueAt), ease: c.ease, interval_days: c.intervalDays, reps: c.reps, lapses: c.lapses})
export const supabaseRepo: Repo = {
  listDecks: async () => ok<Deck[]>(await sb().from('decks').select('id,name').order('created_at')),
  saveDeck: async d => { ok(await sb().from('decks').upsert(d)) },
  deleteDeck: async id => { ok(await sb().from('decks').delete().eq('id', id)) },
  listCards: async () => ok<any[]>(await sb().from('cards').select('*')).map(toCard),
  saveCards: async cs => { ok(await sb().from('cards').upsert(cs.map(fromCard))) },
  deleteCard: async id => { ok(await sb().from('cards').delete().eq('id', id)) },
  listReviews: async () => ok<any[]>(await sb().from('reviews').select('*').order('reviewed_at')).map((r): ReviewLog => ({id: r.id, cardId: r.card_id, deckId: r.deck_id, rating: r.rating, reviewedAt: Date.parse(r.reviewed_at), activeMs: r.active_ms, topic: r.topic ?? '', prev: {ease: r.prev?.ease ?? 2.5, intervalDays: r.prev?.ivl ?? 0, reps: r.prev?.reps ?? 0, lapses: r.prev?.lapses ?? 0, dueAt: r.prev?.due ? Date.parse(r.prev.due) : null}})),
  recordReview: async (l, n) => { ok(await sb().rpc('registrar_revisao', {p_id: l.id, p_card: l.cardId, p_rating: l.rating, p_at: iso(l.reviewedAt), p_ms: l.activeMs, p_ease: n.ease, p_ivl: n.intervalDays, p_reps: n.reps, p_lapses: n.lapses, p_due: iso(n.dueAt)})) },
  undoReview: async id => { ok(await sb().rpc('desfazer_revisao', {p_id: id})) },
}
