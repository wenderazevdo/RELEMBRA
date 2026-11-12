import {useEffect, useState} from 'react'
import type {Deck} from './domain/types'
import {supabase} from './lib/supabase'
import {localRepo} from './data/localRepo'
import {supabaseRepo} from './data/supabaseRepo'
export default function App() {
  const [logged, setLogged] = useState(false), [decks, setDecks] = useState<Deck[]>([]), [name, setName] = useState('')
  const [em, setEm] = useState(''), [pw, setPw] = useState(''), [msg, setMsg] = useState('')
  const repo = logged ? supabaseRepo : localRepo
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(r => setLogged(!!r.data.session))
    const s = supabase.auth.onAuthStateChange((_e, ss) => setLogged(!!ss)); return () => s.data.subscription.unsubscribe()
  }, [])
  useEffect(() => { repo.listDecks().then(setDecks).catch(e => setMsg(String(e.message))) }, [logged])
  const add = async () => { if (!name.trim()) return; const d = {id: crypto.randomUUID(), name: name.trim()}; await repo.saveDeck(d); setDecks([...decks, d]); setName('') }
  const auth = async (up: boolean) => { const r = up ? await supabase!.auth.signUp({email: em, password: pw}) : await supabase!.auth.signInWithPassword({email: em, password: pw}); setMsg(r.error?.message ?? (up ? 'Confira seu e-mail, se a confirmação estiver ativa.' : '')) }
  return <main style={{maxWidth: 560, margin: '0 auto', padding: 16, fontFamily: 'system-ui'}}>
    <h1>Relembra</h1>
    <p>{logged ? 'Modo nuvem (Supabase)' : 'Modo local (neste aparelho)'}</p>
    {supabase && !logged && <div><input value={em} onChange={e => setEm(e.target.value)} placeholder="E-mail" /><input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Senha" /><button onClick={() => auth(false)}>Entrar</button><button onClick={() => auth(true)}>Criar conta</button></div>}
    {logged && <button onClick={() => supabase!.auth.signOut()}>Sair</button>}
    {msg && <p role="alert">{msg}</p>}
    <input value={name} onChange={e => setName(e.target.value)} placeholder="Novo baralho" /><button onClick={add}>Criar</button>
    <ul>{decks.map(d => <li key={d.id}>{d.name}</li>)}</ul>
  </main>
}
