'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { user, login, cadastrar } = useAuth()
  const router = useRouter()
  const [modo, setModo] = useState<'login' | 'cadastro'>('login')
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [capital, setCapital] = useState('10000')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) router.replace('/painel')
  }, [user, router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    if (modo === 'cadastro') {
      if (!nome.trim() || !senha) { setErro('Preencha todos os campos.'); return }
      if (senha.length < 4) { setErro('Senha deve ter pelo menos 4 caracteres.'); return }
      const cap = parseFloat(capital.replace(',', '.'))
      if (isNaN(cap) || cap < 100) { setErro('Capital deve ser pelo menos R$ 100.'); return }
    }

    setLoading(true)
    try {
      if (modo === 'login') {
        const r = await login(nome, senha)
        if (r === 'ok') router.replace('/painel')
        else if (r === 'nao_encontrado') setErro('Usuário não encontrado. Crie uma conta.')
        else setErro('Usuário ou senha incorretos.')
      } else {
        const cap = parseFloat(capital.replace(',', '.'))
        const r = await cadastrar(nome, senha, cap)
        if (r === 'ok') router.replace('/painel')
        else if (r === 'ja_existe') setErro('Nome de usuário já existe. Escolha outro.')
        else setErro('Não foi possível criar a conta. Tente novamente.')
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background de Vídeo */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, overflow: 'hidden', background: '#0a0e14' }}>
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'translate(-50%, -50%)',
            opacity: 0.18,
            filter: 'blur(2px) grayscale(30%)'
          }}
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
        {/* Overlay escuro com gradiente para não ficar tão em evidência */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13, 26, 16, 0.75), rgba(7, 16, 10, 0.95))' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icone-pequi.png" alt="Caryo Map" width={64} height={64} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 14px rgba(240,180,41,0.5))' }} />
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#e8edf5', letterSpacing: '-0.03em', marginTop: '0.75rem' }}>
            Caryo <span style={{ color: '#f0b429' }}>Map</span>
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', marginTop: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#d4920a', background: '#d4920a20', border: '1px solid #d4920a40', borderRadius: 4, padding: '0.2rem 0.6rem', fontWeight: 700, letterSpacing: '0.1em' }}>
              PEQUI ESTÚDIO
            </span>
            <span style={{ fontSize: '0.72rem', color: '#34d17e', background: '#34d17e20', border: '1px solid #34d17e40', borderRadius: 4, padding: '0.2rem 0.6rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              INTELIGÊNCIA ARTIFICIAL ✨
            </span>
          </div>
          <p style={{ color: '#4d5f7a', fontSize: '0.85rem', marginTop: '0.75rem' }}>
            Descascamos o mercado · Mapeamos o ouro
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#0f1520', border: '1px solid #1c2538', borderRadius: 16, padding: '2rem' }}>

          {/* Toggle */}
          <div style={{ display: 'flex', background: '#0a0e14', border: '1px solid #1c2538', borderRadius: 10, padding: '0.25rem', marginBottom: '1.75rem' }}>
            {(['login', 'cadastro'] as const).map(m => (
              <button key={m} onClick={() => { setModo(m); setErro('') }} style={{
                flex: 1, padding: '0.55rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.15s',
                background: modo === m ? '#00a63c' : 'transparent',
                color: modo === m ? '#fff' : '#4d5f7a',
              }}>
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>
                Nome de usuário
              </label>
              <input
                value={nome} onChange={e => setNome(e.target.value)}
                placeholder="ex: isadora"
                autoComplete="username"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>
                Senha
              </label>
              <input
                type="password" value={senha} onChange={e => setSenha(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                style={inputStyle}
                required
              />
            </div>

            {modo === 'cadastro' && (
              <div>
                <label style={{ fontSize: '0.75rem', color: '#4d5f7a', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>
                  Capital para investir (R$)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#4d5f7a', fontSize: '0.88rem' }}>R$</span>
                  <input
                    type="number" value={capital} onChange={e => setCapital(e.target.value)}
                    min="100" step="100"
                    style={{ ...inputStyle, paddingLeft: '2.25rem' }}
                  />
                </div>
                <p style={{ color: '#4d5f7a', fontSize: '0.72rem', marginTop: '0.35rem' }}>
                  Você pode alterar isso depois no perfil.
                </p>
              </div>
            )}

            {erro && (
              <div style={{ background: '#e5355515', border: '1px solid #b02a4540', borderRadius: 8, padding: '0.65rem 0.9rem', color: '#e53555', fontSize: '0.83rem' }}>
                {erro}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop: '0.5rem',
              background: loading ? '#1c2538' : '#00a63c',
              color: loading ? '#4d5f7a' : '#fff',
              border: 'none', borderRadius: 10, padding: '0.85rem',
              fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}>
              {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#4d5f7a', fontSize: '0.75rem', marginTop: '1.5rem', lineHeight: 1.6 }}>
          Ao continuar, você concorda com os{' '}
          <a href="/termos" style={{ color: '#d4920a', textDecoration: 'underline' }}>Termos &amp; Avisos</a>.<br/>
          Ferramenta educacional · Não é recomendação de investimento · Pequi Estúdio © 2026
        </p>
      </div>
    </main>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0a0e14',
  border: '1px solid #1c2538',
  borderRadius: 8,
  padding: '0.7rem 0.9rem',
  color: '#e8edf5',
  fontSize: '0.92rem',
  outline: 'none',
  boxSizing: 'border-box',
}
