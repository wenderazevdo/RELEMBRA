export type Rating = 0 | 1 | 2 | 3 // Errei, Difícil, Bom, Fácil
export interface Deck { id: string; name: string }
export interface Sched { ease: number; intervalDays: number; reps: number; lapses: number; dueAt: number | null }
export interface Card extends Sched {
  id: string; deckId: string; question: string; answer: string
  subject?: string; topic?: string; tags: string[]; source?: string
  favorite: boolean; suspended: boolean
}
export interface ReviewLog { id: string; cardId: string; deckId: string; rating: Rating; reviewedAt: number; activeMs: number; topic: string; prev: Sched }
/** Contrato de armazenamento: as regras de estudo só conhecem esta interface. */
export interface Repo {
  listDecks(): Promise<Deck[]>
  saveDeck(d: Deck): Promise<void>
  deleteDeck(id: string): Promise<void>
  listCards(): Promise<Card[]>
  saveCards(c: Card[]): Promise<void>
  deleteCard(id: string): Promise<void>
  listReviews(): Promise<ReviewLog[]>
  /** Atômico e idempotente pelo id da revisão. */
  recordReview(log: ReviewLog, next: Card): Promise<void>
  undoReview(logId: string): Promise<void>
}
