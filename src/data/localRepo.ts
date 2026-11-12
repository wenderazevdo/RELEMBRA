import {openDB} from 'idb'
import type {Card, Repo, ReviewLog} from '../domain/types'
const db = openDB('relembra-v2', 1, {upgrade(d) { for (const s of ['decks', 'cards', 'reviews']) d.createObjectStore(s, {keyPath: 'id'}) }})
export const localRepo: Repo = {
  listDecks: async () => (await db).getAll('decks'),
  saveDeck: async d => { await (await db).put('decks', d) },
  deleteDeck: async id => {
    const x = await db, t = x.transaction(['decks', 'cards'], 'readwrite')
    for (const c of (await t.objectStore('cards').getAll()) as Card[]) if (c.deckId === id) await t.objectStore('cards').delete(c.id)
    await t.objectStore('decks').delete(id); await t.done
  },
  listCards: async () => (await db).getAll('cards'),
  saveCards: async cs => { const t = (await db).transaction('cards', 'readwrite'); await Promise.all([...cs.map(c => t.store.put(c)), t.done]) },
  deleteCard: async id => { await (await db).delete('cards', id) },
  listReviews: async () => (await db).getAll('reviews'),
  recordReview: async (log, next) => { // uma transação: revisão e card juntos
    const t = (await db).transaction(['cards', 'reviews'], 'readwrite')
    if (!(await t.objectStore('reviews').get(log.id))) { await t.objectStore('reviews').put(log); await t.objectStore('cards').put(next) }
    await t.done
  },
  undoReview: async id => {
    const t = (await db).transaction(['cards', 'reviews'], 'readwrite'), l = (await t.objectStore('reviews').get(id)) as ReviewLog | undefined
    if (l) { const c = (await t.objectStore('cards').get(l.cardId)) as Card | undefined; if (c) await t.objectStore('cards').put({...c, ...l.prev}); await t.objectStore('reviews').delete(id) }
    await t.done
  },
}
