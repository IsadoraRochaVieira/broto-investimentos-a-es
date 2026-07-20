import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** Cliente do navegador — usa a chave publishable (segura para o frontend).
 *  Se as variáveis não estiverem configuradas, expõe `null` para que o
 *  AuthContext caia no modo local sem quebrar o build/preview. */
export const supabase =
  url && anon
    ? createClient(url, anon, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null

export const supabaseConfigurado = Boolean(url && anon)

/** Username → e-mail sintético estável. O Supabase Auth exige e-mail;
 *  mantemos a UX de "nome de usuário" mapeando para um domínio interno. */
export function emailDoUsuario(nome: string): string {
  const slug = nome.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${slug}@caryomap.app`
}
