import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/** Cadastro server-side: cria o usuário já com e-mail confirmado usando a
 *  service/secret key (nunca exposta ao cliente). Depois o frontend faz o
 *  signInWithPassword normalmente com a publishable key. */
export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!url || !secret) {
    return NextResponse.json({ error: 'Supabase não configurado no servidor.' }, { status: 500 })
  }

  let body: { email?: string; senha?: string; nome?: string; capital?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  const { email, senha, nome, capital } = body
  if (!email || !senha || !nome) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
  }
  if (senha.length < 4) {
    return NextResponse.json({ error: 'Senha muito curta.' }, { status: 400 })
  }

  const admin = createClient(url, secret, { auth: { persistSession: false } })

  const { error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: {
      nome: nome.trim(),
      capital: Number(capital) || 0,
      createdAt: new Date().toISOString(),
    },
  })

  if (error) {
    const jaExiste = /already|registered|exists|duplicate/i.test(error.message)
    return NextResponse.json(
      { error: jaExiste ? 'ja_existe' : error.message },
      { status: jaExiste ? 409 : 400 },
    )
  }

  return NextResponse.json({ ok: true })
}
