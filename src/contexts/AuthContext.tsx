'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, supabaseConfigurado, emailDoUsuario } from '@/lib/supabaseClient'

export type User = {
  nome: string
  capital: number
  createdAt: string
  plano: 'gratuito' | 'anual' | 'mensal'
  assinanteAte: string | null   // ISO date; null = sem assinatura
}

type LoginResult = 'ok' | 'senha_errada' | 'nao_encontrado'
type CadastroResult = 'ok' | 'ja_existe' | 'erro'

type AuthCtx = {
  user: User | null
  assinante: boolean
  carregando: boolean
  login: (nome: string, senha: string) => Promise<LoginResult>
  cadastrar: (nome: string, senha: string, capital: number) => Promise<CadastroResult>
  logout: () => Promise<void>
  atualizarCapital: (capital: number) => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

/* ─────────────────────────────────────────────
   Fallback localStorage (quando Supabase não está configurado)
   ───────────────────────────────────────────── */
const KEY_USERS = 'b3radar_users'
const KEY_SESSION = 'b3radar_session'
type StoredUser = User & { senha: string }
function getUsers(): Record<string, StoredUser> {
  try { return JSON.parse(localStorage.getItem(KEY_USERS) || '{}') } catch { return {} }
}
function setUsers(u: Record<string, StoredUser>) {
  localStorage.setItem(KEY_USERS, JSON.stringify(u))
}

/* Mapeia a sessão do Supabase para o nosso User */
function userDaSessao(meta: Record<string, unknown> | undefined, email: string | undefined): User {
  return {
    nome: (meta?.nome as string) ?? email ?? 'usuário',
    capital: Number(meta?.capital) || 0,
    createdAt: (meta?.createdAt as string) ?? new Date().toISOString(),
    plano: (meta?.plano as User['plano']) ?? 'gratuito',
    assinanteAte: (meta?.assinante_ate as string) ?? null,
  }
}

function calcAssinante(u: User | null): boolean {
  if (!u || u.plano === 'gratuito' || !u.assinanteAte) return false
  return new Date(u.assinanteAte).getTime() > Date.now()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (supabaseConfigurado && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setUser(userDaSessao(data.session.user.user_metadata, data.session.user.email))
        setCarregando(false)
      })
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        setUser(session ? userDaSessao(session.user.user_metadata, session.user.email) : null)
      })
      return () => sub.subscription.unsubscribe()
    }
    // Fallback local
    const s = localStorage.getItem(KEY_SESSION)
    if (s) { try { setUser(JSON.parse(s) as User) } catch { localStorage.removeItem(KEY_SESSION) } }
    setCarregando(false)
  }, [])

  const login = async (nome: string, senha: string): Promise<LoginResult> => {
    if (supabaseConfigurado && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email: emailDoUsuario(nome), password: senha })
      if (error) return 'senha_errada' // Supabase não distingue "não existe" de "senha errada"
      return 'ok'
    }
    const users = getUsers()
    const stored = users[nome.trim().toLowerCase()]
    if (!stored) return 'nao_encontrado'
    if (stored.senha !== senha) return 'senha_errada'
    const u: User = { nome: stored.nome, capital: stored.capital, createdAt: stored.createdAt, plano: 'gratuito', assinanteAte: null }
    setUser(u); localStorage.setItem(KEY_SESSION, JSON.stringify(u))
    return 'ok'
  }

  const cadastrar = async (nome: string, senha: string, capital: number): Promise<CadastroResult> => {
    if (supabaseConfigurado && supabase) {
      const resp = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailDoUsuario(nome), senha, nome, capital }),
      })
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}))
        return j.error === 'ja_existe' ? 'ja_existe' : 'erro'
      }
      const { error } = await supabase.auth.signInWithPassword({ email: emailDoUsuario(nome), password: senha })
      return error ? 'erro' : 'ok'
    }
    const users = getUsers()
    const key = nome.trim().toLowerCase()
    if (users[key]) return 'ja_existe'
    const u: StoredUser = { nome: nome.trim(), senha, capital, createdAt: new Date().toISOString(), plano: 'gratuito', assinanteAte: null }
    users[key] = u; setUsers(users)
    const session: User = { nome: u.nome, capital: u.capital, createdAt: u.createdAt, plano: 'gratuito', assinanteAte: null }
    setUser(session); localStorage.setItem(KEY_SESSION, JSON.stringify(session))
    return 'ok'
  }

  const logout = async () => {
    if (supabaseConfigurado && supabase) { await supabase.auth.signOut(); setUser(null); return }
    setUser(null); localStorage.removeItem(KEY_SESSION)
  }

  const atualizarCapital = async (capital: number) => {
    if (!user) return
    if (supabaseConfigurado && supabase) {
      await supabase.auth.updateUser({ data: { capital } })
      setUser({ ...user, capital })
      return
    }
    const users = getUsers()
    const key = user.nome.trim().toLowerCase()
    if (users[key]) { users[key].capital = capital; setUsers(users) }
    const updated = { ...user, capital }
    setUser(updated); localStorage.setItem(KEY_SESSION, JSON.stringify(updated))
  }

  return (
    <Ctx.Provider value={{ user, assinante: calcAssinante(user), carregando, login, cadastrar, logout, atualizarCapital }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
