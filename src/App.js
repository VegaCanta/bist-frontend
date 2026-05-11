import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const TF_LABELS = {
  '30': '30 Dakika', '120': '2 Saat', '240': '4 Saat',
  '1D': 'Günlük', '1W': 'Haftalık', '3M': '3 Aylık',
}
const TF_SHORT = {
  '30': '30dk', '120': '2S', '240': '4S',
  '1D': '1G', '1W': '1H', '3M': '3A',
}
const TF_PARAMS = {
  '30': { cci: 21, wma: 9 }, '120': { cci: 21, wma: 9 },
  '240': { cci: 13, wma: 9 }, '1D': { cci: 9, wma: 9 },
  '1W': { cci: 5, wma: 9 }, '3M': { cci: 5, wma: 9 },
}
const CRITERIA_LABELS = { ift_cci: 'IFT CCI' }
const CRITERIA_COLORS = { ift_cci: '#7c3aed' }

const TurkishFlag = () => (
  <svg width="28" height="19" viewBox="0 0 36 24" style={{ borderRadius: 3 }}>
    <rect width="36" height="24" fill="#E30A17" />
    <circle cx="15" cy="12" r="7" fill="white" />
    <circle cx="17.5" cy="12" r="5.5" fill="#E30A17" />
    <polygon points="22,12 24.5,8.5 25.5,12.5 22.2,10 25.8,10" fill="white" transform="rotate(18,24,10.5)" />
  </svg>
)

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000)
  if (diff < 60) return `${diff}dk`
  const hrs = Math.floor(diff / 60)
  if (hrs < 24) return `${hrs}s`
  return `${Math.floor(hrs / 24)}g`
}

function fmtPrice(n) {
  return Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/* ── GİRİŞ EKRANI ── */
function LoginPage({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email veya şifre hatalı')
    } else {
      onLogin()
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #E30A17 0%, #8B0000 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '40px 32px', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #E30A17, #c00812)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 20 }}>★</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', letterSpacing: -0.5 }}>BIST Tarayıcı</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>IFT CCI Sinyal Sistemi</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              type="email" placeholder="email@adresin.com"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Şifre</label>
            <input value={password} onChange={e => setPassword(e.target.value)}
              type="password" placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>{error}</div>}
          <button onClick={handleLogin} disabled={loading}
            style={{ background: loading ? '#94a3b8' : '#E30A17', border: 'none', color: 'white', padding: '14px', borderRadius: 10, cursor: loading ? 'default' : 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', marginTop: 4 }}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </div>

        <div style={{ marginTop: 24, padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
          <p style={{ fontSize: 11, color: '#92400e', lineHeight: 1.5, margin: 0 }}>
            ⚠️ Bu platform yatırım tavsiyesi içermez. Gösterilen sinyaller teknik analiz araçlarıdır ve yatırım kararı vermek için tek başına kullanılamaz.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── ANALİZ MODALİ ── */
function AnalysisModal({ ticker, signal, onClose }) {
  const [kapNews, setKapNews] = useState([])
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('teknik')

  useEffect(() => {
    async function go() {
      setLoading(true)
      const [newsRes, detailsRes] = await Promise.all([
        supabase.from('signal_news').select('*').eq('ticker', ticker).order('created_at', { ascending: false }).limit(5),
        supabase.from('signal_details').select('*').eq('ticker', ticker).maybeSingle(),
      ])
      setKapNews(newsRes.data || [])
      setDetails(detailsRes.data || null)
      setLoading(false)
    }
    go()
  }, [ticker])

  const tabs = [['teknik', 'Teknik'], ['finans', 'Finansal'], ['kap', 'KAP']]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, padding: '0' }}
      onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 600, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 20px 0', background: 'linear-gradient(135deg, #E30A17, #c00812)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>{ticker}</span>
                {signal && <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 11, padding: '2px 8px', borderRadius: 12 }}>IFT: {signal.ift_value?.toFixed(3)}</span>}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>
                {TF_LABELS[signal?.timeframe] || ''} · ₺{fmtPrice(signal?.price || 0)}
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {tabs.map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{ background: tab === key ? 'white' : 'transparent', border: 'none', color: tab === key ? '#E30A17' : 'rgba(255,255,255,0.8)', padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, borderRadius: '8px 8px 0 0' }}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
              <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTop: '3px solid #E30A17', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : (
            <>
              {tab === 'teknik' && signal && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                    {[
                      ['IFT CCI Değeri', signal.ift_value?.toFixed(4) || '—', '#7c3aed'],
                      ['Fiyat', '₺' + fmtPrice(signal.price), '#E30A17'],
                      ['Değişim', (signal.change >= 0 ? '+' : '') + Number(signal.change).toFixed(2) + '%', signal.change >= 0 ? '#059669' : '#dc2626'],
                      ['Zaman Dilimi', TF_LABELS[signal.timeframe] || signal.timeframe, '#2563eb'],
                    ].map(([l, v, c]) => (
                      <div key={l} style={{ background: 'white', border: '1px solid #e8edf5', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>{l}</div>
                        <div style={{ color: c, fontSize: 18, fontWeight: 800 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {TF_PARAMS[signal.timeframe] && (
                    <div style={{ background: '#f3f0ff', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>
                      CCI uzunluk: {TF_PARAMS[signal.timeframe].cci} · WMA smoothing: {TF_PARAMS[signal.timeframe].wma}
                    </div>
                  )}
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ fontSize: 11, color: '#92400e', margin: 0, lineHeight: 1.5 }}>⚠️ Bu sinyal yatırım tavsiyesi değildir. Kendi araştırmanızı yapınız.</p>
                  </div>
                </div>
              )}

              {tab === 'finans' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {details ? (
                    <>
                      {details.description && (
                        <div style={{ background: 'white', border: '1px solid #e8edf5', borderRadius: 12, padding: 16 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Şirket</div>
                          <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{details.description}</p>
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                        {[
                          ['Net Kar', details.net_profit ? (details.net_profit / 1e9).toFixed(1) + ' Mr ₺' : '—', '#059669'],
                          ['Gelir', details.revenue ? (details.revenue / 1e9).toFixed(1) + ' Mr ₺' : '—', '#2563eb'],
                          ['Toplam Varlık', details.total_assets ? (details.total_assets / 1e9).toFixed(1) + ' Mr ₺' : '—', '#7c3aed'],
                          ['Özkaynaklar', details.equity ? (details.equity / 1e9).toFixed(1) + ' Mr ₺' : '—', '#E30A17'],
                        ].map(([l, v, c]) => (
                          <div key={l} style={{ background: 'white', border: '1px solid #e8edf5', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>{l}</div>
                            <div style={{ color: c, fontSize: 16, fontWeight: 800 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ background: 'white', border: '1px solid #e8edf5', borderRadius: 12, padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>📊</div>
                      <p style={{ fontSize: 13 }}>Finansal veri henüz yüklenmedi</p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'kap' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {kapNews.length === 0 ? (
                    <div style={{ background: 'white', border: '1px solid #e8edf5', borderRadius: 12, padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>📋</div>
                      <p style={{ fontSize: 13 }}>KAP bildirimi bulunamadı</p>
                    </div>
                  ) : kapNews.map((n, i) => (
                    <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <div style={{ background: 'white', border: '1px solid #e8edf5', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ background: '#E30A17', color: 'white', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                        <div>
                          <p style={{ color: '#1e293b', fontSize: 13, fontWeight: 600, margin: 0, marginBottom: 3 }}>{n.title}</p>
                          <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>{n.date} · KAP →</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── TAKİBE EKLE MODALİ ── */
function AddWatchModal({ signal, onAdd, onClose }) {
  const [note, setNote] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 3000 }}
      onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 600, padding: '20px 20px 32px', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ color: '#1e293b', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>★ Takibe Al — {signal.ticker}</div>
        <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 16 }}>₺{fmtPrice(signal.price)} · {TF_LABELS[signal.timeframe] || signal.timeframe}</div>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} autoFocus
          placeholder="Not ekle... (hedef fiyat, stop loss vb.)"
          style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit', marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: '#f1f5f9', border: 'none', color: '#64748b', padding: 12, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>İptal</button>
          <button onClick={() => onAdd(note)} style={{ flex: 2, background: '#E30A17', border: 'none', color: 'white', padding: 12, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>★ Takibe Al</button>
        </div>
      </div>
    </div>
  )
}

/* ── TAKİP LİSTESİ ── */
function WatchlistPage({ watchlist, onRemove, onUpdateNote }) {
  const [editingId, setEditingId] = useState(null)
  const [noteVal, setNoteVal]     = useState('')
  const [sortBy, setSortBy]       = useState('date')

  const sorted = [...watchlist].sort((a, b) => {
    if (sortBy === 'date')   return new Date(b.added_at) - new Date(a.added_at)
    if (sortBy === 'change') return (b.change_pct || 0) - (a.change_pct || 0)
    return a.ticker.localeCompare(b.ticker)
  })

  const avgPct = watchlist.length
    ? (watchlist.reduce((s, w) => s + (w.change_pct || 0), 0) / watchlist.length).toFixed(2)
    : 0

  if (!watchlist.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 12 }}>
      <div style={{ fontSize: 48, opacity: 0.15 }}>★</div>
      <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center' }}>Takip listesi boş.<br />Sinyal tablosundan ☆ ile ekle.</p>
    </div>
  )

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      {/* Özet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          ['Takip', watchlist.length, '#1e293b'],
          ['Ort.', (avgPct > 0 ? '+' : '') + avgPct + '%', parseFloat(avgPct) >= 0 ? '#059669' : '#dc2626'],
          ['Kzn/Kbdn', watchlist.filter(w => (w.change_pct || 0) > 0).length + '/' + watchlist.filter(w => (w.change_pct || 0) < 0).length, '#7c3aed'],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: 'white', borderRadius: 12, padding: '12px 14px', border: '1px solid #e8edf5', textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{l}</div>
            <div style={{ color: c, fontSize: 18, fontWeight: 800 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Sıralama */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[['date', 'Tarih'], ['change', 'Getiri'], ['ticker', 'A-Z']].map(([k, l]) => (
          <button key={k} onClick={() => setSortBy(k)} style={{ background: sortBy === k ? '#E30A17' : 'white', border: '1px solid', borderColor: sortBy === k ? '#E30A17' : '#e2e8f0', color: sortBy === k ? 'white' : '#64748b', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>{l}</button>
        ))}
      </div>

      {/* Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map(item => (
          <div key={item.id} style={{ background: 'white', borderRadius: 14, border: '1px solid #e8edf5', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{item.ticker}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{new Date(item.added_at).toLocaleDateString('tr-TR')} · {TF_SHORT[item.timeframe] || item.timeframe}</div>
              </div>
              <button onClick={() => onRemove(item.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
              {[
                ['Giriş', '₺' + fmtPrice(item.entry_price), '#64748b'],
                ['Şu An', '₺' + fmtPrice(item.current_price || item.entry_price), '#1e293b'],
                ['Değişim', (item.change_pct || 0) >= 0 ? '+' + (item.change_pct || 0).toFixed(2) + '%' : (item.change_pct || 0).toFixed(2) + '%', (item.change_pct || 0) >= 0 ? '#059669' : '#dc2626'],
              ].map(([l, v, c]) => (
                <div key={l} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ color: '#94a3b8', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{l}</div>
                  <div style={{ color: c, fontSize: 13, fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ background: '#f0fdf4', color: '#059669', fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>↑ +{Math.abs(item.high_pct || 0).toFixed(2)}%</span>
              <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>↓ -{Math.abs(item.low_pct || 0).toFixed(2)}%</span>
            </div>

            {editingId === item.id ? (
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <textarea value={noteVal} onChange={e => setNoteVal(e.target.value)} rows={2} autoFocus
                  style={{ flex: 1, background: '#f8fafc', border: '1px solid #7c3aed', borderRadius: 8, padding: '8px 10px', fontSize: 12, outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button onClick={() => { onUpdateNote(item.id, noteVal); setEditingId(null) }} style={{ background: '#059669', border: 'none', color: 'white', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✓</button>
                  <button onClick={() => setEditingId(null)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✕</button>
                </div>
              </div>
            ) : (
              <div onClick={() => { setEditingId(item.id); setNoteVal(item.note || '') }}
                style={{ marginTop: 8, cursor: 'text', color: item.note ? '#475569' : '#cbd5e1', fontSize: 12, padding: '6px 8px', background: '#f8fafc', borderRadius: 8, minHeight: 32 }}>
                {item.note || 'Not ekle...'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── ANA UYGULAMA ── */
export default function App() {
  const [session, setSession]               = useState(null)
  const [authLoading, setAuthLoading]       = useState(true)
  const [page, setPage]                     = useState('signals')
  const [signals, setSignals]               = useState([])
  const [watchlist, setWatchlist]           = useState([])
  const [loading, setLoading]               = useState(true)
  const [filterTF, setFilterTF]             = useState('Tümü')
  const [selectedSignal, setSelectedSignal] = useState(null)
  const [addingSignal, setAddingSignal]     = useState(null)
  const [lastUpdate, setLastUpdate]         = useState(null)
  const [searchTerm, setSearchTerm]         = useState('')

  // Auth kontrolü
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchSignals() {
    const { data } = await supabase.from('signals').select('*').order('created_at', { ascending: false }).limit(500)
    if (data) { setSignals(data); setLastUpdate(new Date()) }
    setLoading(false)
  }
  async function fetchWatchlist() {
    const { data } = await supabase.from('watchlist').select('*').order('added_at', { ascending: false })
    if (data) setWatchlist(data)
  }

  useEffect(() => {
    if (!session) return
    fetchSignals(); fetchWatchlist()
    const i = setInterval(() => { fetchSignals(); fetchWatchlist() }, 60000)
    return () => clearInterval(i)
  }, [session])

  async function handleAddToWatch(note) {
    const s = addingSignal
    if (watchlist.find(w => w.ticker === s.ticker)) { setAddingSignal(null); return }
    const { data } = await supabase.from('watchlist').insert([{
      ticker: s.ticker, entry_price: s.price, current_price: s.price,
      high_price: s.price, low_price: s.price, note,
      timeframe: s.timeframe, criteria: s.criteria,
      added_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      change_pct: 0, high_pct: 0, low_pct: 0,
    }]).select().single()
    if (data) setWatchlist(prev => [data, ...prev])
    setAddingSignal(null)
  }
  async function handleRemoveWatch(id) {
    await supabase.from('watchlist').delete().eq('id', id)
    setWatchlist(prev => prev.filter(w => w.id !== id))
  }
  async function handleUpdateNote(id, note) {
    await supabase.from('watchlist').update({ note, updated_at: new Date().toISOString() }).eq('id', id)
    setWatchlist(prev => prev.map(w => w.id === id ? { ...w, note } : w))
  }

  const timeframes  = ['Tümü', ...new Set(signals.map(s => s.timeframe))]
  const filtered    = signals.filter(s => {
    if (filterTF !== 'Tümü' && s.timeframe !== filterTF) return false
    if (searchTerm && !s.ticker.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  if (authLoading) return (
    <div style={{ minHeight: '100vh', background: '#E30A17', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!session) return <LoginPage onLogin={() => {}} />

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
        button, input, textarea { font-family: inherit; }
      `}</style>

      {/* Yasal Uyarı Banner */}
      <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13 }}>⚠️</span>
        <p style={{ fontSize: 11, color: '#92400e', lineHeight: 1.4 }}>Bu platform yatırım tavsiyesi içermez. Gösterilen sinyaller teknik analiz amaçlıdır.</p>
      </div>

      {/* HEADER */}
      <header style={{ background: 'white', borderBottom: '1px solid #e8edf5', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #E30A17, #c00812)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 14 }}>★</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>BIST Tarayıcı</div>
            {lastUpdate && <div style={{ fontSize: 10, color: '#94a3b8' }}>{lastUpdate.toLocaleTimeString('tr-TR')}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TurkishFlag />
          <button onClick={() => supabase.auth.signOut()} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Çıkış</button>
        </div>
      </header>

      {/* İÇERİK */}
      {page === 'signals' && (
        <div style={{ padding: '16px 16px 80px' }}>
          {/* Arama + Filtre */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e8edf5', padding: '12px 14px', marginBottom: 14 }}>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="🔍 Hisse ara... (THYAO)"
              style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {timeframes.map(tf => (
                <button key={tf} onClick={() => setFilterTF(tf)} style={{ background: filterTF === tf ? '#E30A17' : '#f8fafc', color: filterTF === tf ? 'white' : '#64748b', border: `1px solid ${filterTF === tf ? '#E30A17' : '#e2e8f0'}`, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                  {tf === 'Tümü' ? 'Tümü' : TF_LABELS[tf] || tf}
                </button>
              ))}
            </div>
          </div>

          {/* İstatistik */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
            {[
              ['Toplam', signals.length, '#E30A17'],
              ['Bugün', signals.filter(s => Date.now() - new Date(s.created_at) < 86400000).length, '#2563eb'],
              ['Takip', watchlist.length, '#059669'],
            ].map(([l, v, c]) => (
              <div key={l} onClick={l === 'Takip' ? () => setPage('watchlist') : undefined}
                style={{ background: 'white', borderRadius: 12, padding: '12px 14px', border: '1px solid #e8edf5', textAlign: 'center', cursor: l === 'Takip' ? 'pointer' : 'default' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{l}</div>
                <div style={{ color: c, fontSize: 22, fontWeight: 800 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Sinyal Listesi */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
              <div style={{ width: 32, height: 32, border: '3px solid #f1f5f9', borderTop: '3px solid #E30A17', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e8edf5', padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>📊</div>
              <p style={{ fontSize: 14 }}>Sinyal bulunamadı</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(s => {
                const inWatch = watchlist.some(w => w.ticker === s.ticker)
                return (
                  <div key={s.id} style={{ background: 'white', borderRadius: 14, border: '1px solid #e8edf5', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div onClick={() => setSelectedSignal(s)} style={{ cursor: 'pointer', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 17, fontWeight: 800, color: '#1e293b' }}>{s.ticker}</span>
                          <span style={{ background: '#f3f0ff', color: '#7c3aed', fontSize: 10, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{TF_LABELS[s.timeframe] || s.timeframe}</span>
                          {TF_PARAMS[s.timeframe] && <span style={{ color: '#94a3b8', fontSize: 10 }}>CCI({TF_PARAMS[s.timeframe].cci})</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>₺{fmtPrice(s.price)}</span>
                          <span style={{ background: s.change >= 0 ? '#f0fdf4' : '#fef2f2', color: s.change >= 0 ? '#059669' : '#dc2626', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                            {s.change >= 0 ? '+' : ''}{Number(s.change).toFixed(2)}%
                          </span>
                          {s.ift_value != null && (
                            <span style={{ background: '#f3f0ff', color: '#7c3aed', fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                              IFT {Number(s.ift_value).toFixed(3)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span style={{ color: '#94a3b8', fontSize: 11 }}>{timeAgo(s.created_at)}</span>
                        <button onClick={() => !inWatch && setAddingSignal(s)}
                          style={{ background: inWatch ? '#fef2f2' : '#f8fafc', border: `1px solid ${inWatch ? '#fecaca' : '#e2e8f0'}`, color: inWatch ? '#E30A17' : '#94a3b8', width: 30, height: 30, borderRadius: 8, cursor: inWatch ? 'default' : 'pointer', fontSize: 14 }}>
                          {inWatch ? '★' : '☆'}
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      Detay için tıkla →
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {page === 'watchlist' && (
        <WatchlistPage watchlist={watchlist} onRemove={handleRemoveWatch} onUpdateNote={handleUpdateNote} />
      )}

      {/* ALT NAVİGASYON */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 600, background: 'white', borderTop: '1px solid #e8edf5', display: 'flex', boxShadow: '0 -4px 12px rgba(0,0,0,0.08)' }}>
        {[['signals', '📊', 'Sinyaller'], ['watchlist', '★', 'Takip']].map(([k, icon, label]) => (
          <button key={k} onClick={() => setPage(k)} style={{ flex: 1, background: 'none', border: 'none', padding: '12px 0', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: page === k ? '#E30A17' : '#94a3b8' }}>{label}</span>
            {page === k && <div style={{ width: 20, height: 2, background: '#E30A17', borderRadius: 1 }} />}
          </button>
        ))}
      </nav>

      {selectedSignal && <AnalysisModal ticker={selectedSignal.ticker} signal={selectedSignal} onClose={() => setSelectedSignal(null)} />}
      {addingSignal   && <AddWatchModal signal={addingSignal} onAdd={handleAddToWatch} onClose={() => setAddingSignal(null)} />}
    </div>
  )
}