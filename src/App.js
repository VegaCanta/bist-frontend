import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// ── Gemini API Key — buraya kendi key'ini yaz ──
const GEMINI_KEY = 'AIzaSyA5bzNCmBhGYMzC7gnnTdXnI-8XJ3SxZAY'

const CRITERIA_LABELS = { ift_cci: 'IFT CCI' }
const CRITERIA_COLORS = { ift_cci: '#7c3aed' }

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

const TurkishFlag = () => (
  <svg width="36" height="24" viewBox="0 0 36 24" style={{ borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
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

function Badge({ label, color }) {
  return (
    <span style={{ background: color + '15', color, border: `1px solid ${color}30`, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{label}</span>
  )
}

function StatCard({ label, value, color, sub, onClick }) {
  return (
    <div onClick={onClick} style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)')}>
      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

/* ── AI ANALİZ MODALİ ── */
function AnalysisModal({ ticker, signal, onClose }) {
  const [analysis, setAnalysis] = useState(null)
  const [kapNews, setKapNews]   = useState([])
  const [details, setDetails]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('temel')

  useEffect(() => {
    async function go() {
  setLoading(true)
  try {
    const [newsRes, detailsRes] = await Promise.all([
      supabase.from('signal_news').select('*').eq('ticker', ticker).order('created_at', { ascending: false }).limit(5),
      supabase.from('signal_details').select('*').eq('ticker', ticker).maybeSingle(),
    ])
    setKapNews(newsRes.data || [])
    setDetails(detailsRes.data || null)
    setAnalysis({ _loaded: true })
  } catch(e) {
    console.error(e)
    setAnalysis({ error: 'Veri yüklenemedi: ' + e.message })
  }
  setLoading(false)
  }
    go()
  }, [ticker])

  const riskColor = { 'Düşük': '#059669', 'Orta': '#d97706', 'Yüksek': '#dc2626' }
  const tabs = [['temel','Temel Analiz'],['bilanco','Bilanço'],['teknik','Teknik'],['kap','KAP Haberleri']]

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20 }} onClick={onClose}>
      <div style={{ background:'white',borderRadius:20,width:'min(720px,100%)',maxHeight:'88vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'24px 28px 0',background:'linear-gradient(135deg,#E30A17,#c00812)' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
            <div>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <span style={{ fontSize:28,fontWeight:800,color:'white',letterSpacing:-1 }}>{ticker}</span>
                {analysis?.sektor && <span style={{ background:'rgba(255,255,255,0.2)',color:'white',fontSize:11,padding:'3px 10px',borderRadius:20 }}>{analysis.sektor}</span>}
                {analysis?.risk_seviyesi && <span style={{ background:'rgba(255,255,255,0.2)',color:'white',fontSize:11,padding:'3px 10px',borderRadius:20 }}>Risk: {analysis.risk_seviyesi}</span>}
                {signal && <span style={{ background:'rgba(255,255,255,0.15)',color:'white',fontSize:11,padding:'3px 10px',borderRadius:20 }}>IFT: {signal.ift_value?.toFixed(3)}</span>}
              </div>
              <p style={{ color:'rgba(255,255,255,0.7)',fontSize:12,marginTop:2 }}>Gemini AI — Temel & Teknik Analiz</p>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)',border:'none',color:'white',cursor:'pointer',fontSize:18,width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
          </div>
          <div style={{ display:'flex',gap:2 }}>
            {tabs.map(([key,label]) => (
              <button key={key} onClick={()=>setTab(key)} style={{ background:tab===key?'white':'transparent',border:'none',color:tab===key?'#E30A17':'rgba(255,255,255,0.8)',padding:'7px 16px',cursor:'pointer',fontSize:12,fontWeight:600,borderRadius:'8px 8px 0 0',transition:'all 0.15s' }}>{label}</button>
            ))}
          </div>
        </div>

        {/* İçerik */}
        <div style={{ padding:28,overflowY:'auto',flex:1,background:'#f8fafc' }}>
          {loading ? (
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:'40px 0' }}>
              <div style={{ width:40,height:40,border:'3px solid #e2e8f0',borderTop:'3px solid #E30A17',borderRadius:'50%',animation:'spin 1s linear infinite' }} />
              <p style={{ color:'#94a3b8',fontSize:13 }}>Gemini analiz yapıyor...</p>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : analysis?.error ? (
            <div style={{ background:'#fef2f2',border:'1px solid #fecaca',borderRadius:12,padding:16,color:'#dc2626' }}>{analysis.error}</div>
          ) : (
            <>
              {/* TEMEL ANALİZ */}
              {tab==='temel' && (
  <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
    <div style={{ background:'white',border:'1px solid #e8edf5',borderRadius:14,padding:20 }}>
      <div style={{ fontSize:11,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:0.5,marginBottom:12 }}>Şirket Bilgisi</div>
      <p style={{ color:'#475569',fontSize:14,lineHeight:1.7 }}>{details?.description || ticker + ' — finansal veri bekleniyor'}</p>
    </div>
    {details && (
      <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12 }}>
        {[
          ['Net Kar', details.net_profit ? (details.net_profit/1e9).toFixed(1)+' Milyar ₺' : '—', '#059669'],
          ['Gelir', details.revenue ? (details.revenue/1e9).toFixed(1)+' Milyar ₺' : '—', '#2563eb'],
          ['Toplam Varlık', details.total_assets ? (details.total_assets/1e9).toFixed(1)+' Milyar ₺' : '—', '#7c3aed'],
          ['Özkaynaklar', details.equity ? (details.equity/1e9).toFixed(1)+' Milyar ₺' : '—', '#E30A17'],
        ].map(([l,v,c])=>(
          <div key={l} style={{ background:'white',border:'1px solid #e8edf5',borderRadius:14,padding:20,textAlign:'center' }}>
            <div style={{ color:'#94a3b8',fontSize:11,fontWeight:600,marginBottom:8,textTransform:'uppercase',letterSpacing:0.5 }}>{l}</div>
            <div style={{ color:c,fontSize:22,fontWeight:800 }}>{v}</div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

              {/* BİLANÇO */}
              {tab==='bilanco' && (
                <div style={{ background:'white',border:'1px solid #e8edf5',borderRadius:14,padding:20 }}>
                  <div style={{ fontSize:11,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:0.5,marginBottom:12 }}>Bilanço & Sektör</div>
                  <p style={{ color:'#475569',fontSize:14,lineHeight:1.8,marginBottom:16 }}>{analysis.bilanco_ozeti}</p>
                  <div style={{ borderTop:'1px solid #f1f5f9',paddingTop:16 }}>
                    <div style={{ fontSize:11,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:0.5,marginBottom:10 }}>Sektör Karşılaştırma</div>
                    <p style={{ color:'#475569',fontSize:14,lineHeight:1.8 }}>{analysis.sektor_karsilastirma}</p>
                  </div>
                </div>
              )}

              {/* TEKNİK */}
              {tab==='teknik' && (
                <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                  {signal && (
                    <div style={{ background:'white',border:'1px solid #e8edf5',borderRadius:14,padding:20 }}>
                      <div style={{ fontSize:11,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:0.5,marginBottom:14 }}>Sinyal Detayı</div>
                      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10 }}>
                        {[
                          ['Zaman Dilimi', TF_LABELS[signal.timeframe]||signal.timeframe, '#7c3aed'],
                          ['IFT CCI', signal.ift_value?.toFixed(4)||'—', '#059669'],
                          ['Fiyat', '₺'+fmtPrice(signal.price), '#E30A17'],
                        ].map(([l,v,c]) => (
                          <div key={l} style={{ background:'#f8fafc',borderRadius:10,padding:'12px 14px',textAlign:'center' }}>
                            <div style={{ color:'#94a3b8',fontSize:10,fontWeight:600,marginBottom:6,textTransform:'uppercase' }}>{l}</div>
                            <div style={{ color:c,fontSize:16,fontWeight:800 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      {TF_PARAMS[signal.timeframe] && (
                        <div style={{ marginTop:12,background:'#f3f0ff',borderRadius:10,padding:'10px 14px',fontSize:12,color:'#7c3aed',fontWeight:600 }}>
                          IFT CCI hesabı: CCI uzunluk = {TF_PARAMS[signal.timeframe].cci} · WMA smoothing = {TF_PARAMS[signal.timeframe].wma}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ background:'white',border:'1px solid #e8edf5',borderRadius:14,padding:20 }}>
                    <div style={{ fontSize:11,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:0.5,marginBottom:12 }}>Teknik Yorum</div>
                    <p style={{ color:'#475569',fontSize:14,lineHeight:1.8 }}>{analysis.teknik_yorum}</p>
                  </div>
                </div>
              )}

              {/* KAP HABERLERİ */}
              {tab==='kap' && (
                <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                  {kapNews.length === 0 ? (
                    <div style={{ background:'white',border:'1px solid #e8edf5',borderRadius:14,padding:40,textAlign:'center',color:'#94a3b8' }}>
                      <div style={{ fontSize:32,marginBottom:8,opacity:0.3 }}>📋</div>
                      <p>Bu hisse için KAP bildirimi bulunamadı</p>
                    </div>
                  ) : kapNews.map((n,i) => (
                    <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                      <div style={{ background:'white',border:'1px solid #e8edf5',borderRadius:12,padding:'14px 18px',display:'flex',gap:14,alignItems:'flex-start',transition:'box-shadow 0.15s',cursor:'pointer' }}
                        onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}
                        onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                        <div style={{ background:'#E30A17',color:'white',borderRadius:8,width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0 }}>{i+1}</div>
                        <div style={{ flex:1 }}>
                          <p style={{ color:'#1e293b',fontSize:13,fontWeight:600,margin:0,marginBottom:4,lineHeight:1.5 }}>{n.title}</p>
                          <p style={{ color:'#94a3b8',fontSize:11,margin:0 }}>{n.date} · KAP'ta görüntüle →</p>
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
    <div style={{ position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:3000,padding:20 }} onClick={onClose}>
      <div style={{ background:'white',borderRadius:20,width:'min(480px,100%)',boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'22px 26px',background:'linear-gradient(135deg,#E30A17,#c00812)',borderRadius:'20px 20px 0 0' }}>
          <div style={{ color:'white',fontSize:16,fontWeight:700 }}>★ Takibe Al — {signal.ticker}</div>
          <div style={{ color:'rgba(255,255,255,0.7)',fontSize:12,marginTop:3 }}>Giriş: ₺{fmtPrice(signal.price)} · {TF_LABELS[signal.timeframe]||signal.timeframe}</div>
        </div>
        <div style={{ padding:'22px 26px',display:'flex',flexDirection:'column',gap:14 }}>
          <div>
            <label style={{ color:'#64748b',fontSize:11,fontWeight:600,display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:0.5 }}>Not / Açıklama</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={4} autoFocus
              placeholder="örn: IFT CCI kesişimi, günlük. Hedef: 310₺. Stop: 270₺."
              style={{ width:'100%',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:10,color:'#334155',padding:'12px 14px',fontSize:13,outline:'none',resize:'vertical',lineHeight:1.7,fontFamily:'inherit' }} />
          </div>
          <div style={{ background:'#f8fafc',border:'1px solid #e8edf5',borderRadius:10,padding:'12px 16px',display:'flex',gap:24,flexWrap:'wrap' }}>
            {[['Ticker',signal.ticker],['Giriş Fiyatı','₺'+fmtPrice(signal.price)],['Zaman',TF_LABELS[signal.timeframe]||signal.timeframe],['Tarih',new Date().toLocaleDateString('tr-TR')]].map(([l,v])=>(
              <div key={l}>
                <div style={{ color:'#94a3b8',fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,marginBottom:2 }}>{l}</div>
                <div style={{ color:'#1e293b',fontSize:12,fontWeight:700 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:'16px 26px',borderTop:'1px solid #f1f5f9',display:'flex',justifyContent:'flex-end',gap:10 }}>
          <button onClick={onClose} style={{ background:'none',border:'1px solid #e2e8f0',color:'#64748b',padding:'9px 20px',borderRadius:10,cursor:'pointer',fontSize:12,fontWeight:500 }}>İptal</button>
          <button onClick={()=>onAdd(note)} style={{ background:'#E30A17',border:'none',color:'white',padding:'9px 24px',borderRadius:10,cursor:'pointer',fontSize:12,fontWeight:700 }}>★ Takibe Al</button>
        </div>
      </div>
    </div>
  )
}

/* ── TAKİP LİSTESİ ── */
function WatchlistPage({ watchlist, onRemove, onUpdateNote }) {
  const [editingNote, setEditingNote] = useState(null)
  const [noteVal, setNoteVal]         = useState('')
  const [sortBy, setSortBy]           = useState('date')

  const sorted = [...watchlist].sort((a,b) => {
    if (sortBy==='date')   return new Date(b.added_at) - new Date(a.added_at)
    if (sortBy==='change') return (b.change_pct||0) - (a.change_pct||0)
    return a.ticker.localeCompare(b.ticker)
  })

  const winners = watchlist.filter(w=>(w.change_pct||0)>0).length
  const losers  = watchlist.filter(w=>(w.change_pct||0)<0).length
  const avgPct  = watchlist.length ? (watchlist.reduce((s,w)=>s+(w.change_pct||0),0)/watchlist.length).toFixed(2) : 0

  if (!watchlist.length) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:16 }}>
      <div style={{ fontSize:56,opacity:0.15 }}>★</div>
      <div style={{ color:'#94a3b8',fontSize:14,textAlign:'center' }}>Takip listesi boş.<br/>Sinyal tablosundaki ☆ butonuna tıkla.</div>
    </div>
  )

  return (
    <div style={{ padding:'28px 32px' }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:28 }}>
        {[['Takipteki Hisse',watchlist.length,'#1e293b'],['Ortalama Getiri',(avgPct>0?'+':'')+avgPct+'%',parseFloat(avgPct)>=0?'#059669':'#dc2626'],['Kazanan',winners+' hisse','#059669'],['Kaybeden',losers+' hisse','#dc2626']].map(([l,v,c])=><StatCard key={l} label={l} value={v} color={c}/>)}
      </div>
      <div style={{ display:'flex',gap:6,marginBottom:16 }}>
        {[['date','Tarihe Göre'],['change','Getiriye Göre'],['ticker','A-Z']].map(([k,l])=>(
          <button key={k} onClick={()=>setSortBy(k)} style={{ background:sortBy===k?'#E30A17':'white',border:'1px solid',borderColor:sortBy===k?'#E30A17':'#e2e8f0',color:sortBy===k?'white':'#64748b',padding:'6px 14px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600 }}>{l}</button>
        ))}
      </div>
      <div style={{ background:'white',borderRadius:16,border:'1px solid #e8edf5',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'grid',gridTemplateColumns:'110px 90px 110px 110px 110px 100px 100px 1fr 50px',padding:'12px 20px',borderBottom:'1px solid #f1f5f9',background:'#f8fafc',gap:8 }}>
          {['HİSSE','ZAM. DİL.','GİRİŞ','ŞU AN','DEĞİŞİM','EN YÜKSEK','EN DÜŞÜK','NOT',''].map((h,i)=>(
            <span key={i} style={{ color:'#94a3b8',fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5 }}>{h}</span>
          ))}
        </div>
        {sorted.map(item=>(
          <div key={item.id} style={{ display:'grid',gridTemplateColumns:'110px 90px 110px 110px 110px 100px 100px 1fr 50px',padding:'16px 20px',borderBottom:'1px solid #f8fafc',alignItems:'center',gap:8,transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#fafbfc'}
            onMouseLeave={e=>e.currentTarget.style.background='white'}>
            <div>
              <div style={{ color:'#1e293b',fontWeight:700,fontSize:14 }}>{item.ticker}</div>
              <div style={{ color:'#94a3b8',fontSize:10,marginTop:2 }}>{new Date(item.added_at).toLocaleDateString('tr-TR')}</div>
            </div>
            <span style={{ background:'#f3f0ff',color:'#7c3aed',fontSize:11,padding:'3px 8px',borderRadius:6,fontWeight:600,width:'fit-content' }}>{TF_SHORT[item.timeframe]||item.timeframe}</span>
            <span style={{ color:'#64748b',fontSize:13 }}>₺{fmtPrice(item.entry_price)}</span>
            <span style={{ color:'#1e293b',fontSize:13,fontWeight:600 }}>₺{fmtPrice(item.current_price||item.entry_price)}</span>
            <div>
              <div style={{ color:(item.change_pct||0)>=0?'#059669':'#dc2626',fontSize:13,fontWeight:700 }}>{(item.change_pct||0)>=0?'+':''}{(item.change_pct||0).toFixed(2)}%</div>
              <div style={{ marginTop:4,height:3,background:'#f1f5f9',borderRadius:2,width:70 }}>
                <div style={{ height:'100%',borderRadius:2,width:Math.min(Math.abs(item.change_pct||0)*3,100)+'%',background:(item.change_pct||0)>=0?'#059669':'#dc2626' }}/>
              </div>
            </div>
            <span style={{ color:'#059669',fontSize:12,fontWeight:600 }}>+{Math.abs(item.high_pct||0).toFixed(2)}%</span>
            <span style={{ color:'#dc2626',fontSize:12,fontWeight:600 }}>-{Math.abs(item.low_pct||0).toFixed(2)}%</span>
            <div>
              {editingNote===item.id ? (
                <div style={{ display:'flex',gap:6 }}>
                  <textarea value={noteVal} onChange={e=>setNoteVal(e.target.value)} rows={2} autoFocus
                    style={{ flex:1,background:'#f8fafc',border:'1px solid #7c3aed',borderRadius:6,color:'#334155',padding:'6px 8px',fontSize:11,outline:'none',resize:'none',fontFamily:'inherit' }}/>
                  <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                    <button onClick={()=>{onUpdateNote(item.id,noteVal);setEditingNote(null)}} style={{ background:'#059669',border:'none',color:'white',padding:'4px 8px',borderRadius:5,cursor:'pointer',fontSize:10 }}>✓</button>
                    <button onClick={()=>setEditingNote(null)} style={{ background:'#f1f5f9',border:'none',color:'#64748b',padding:'4px 8px',borderRadius:5,cursor:'pointer',fontSize:10 }}>✕</button>
                  </div>
                </div>
              ) : (
                <div onClick={()=>{setEditingNote(item.id);setNoteVal(item.note||'')}}
                  style={{ cursor:'text',color:item.note?'#475569':'#cbd5e1',fontSize:12,lineHeight:1.5,padding:'4px 6px',borderRadius:6 }}>
                  {item.note||<span style={{ fontStyle:'italic' }}>not ekle...</span>}
                </div>
              )}
            </div>
            <button onClick={()=>onRemove(item.id)}
              style={{ background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',padding:'6px 10px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,transition:'all 0.15s' }}
              onMouseEnter={e=>{e.target.style.background='#dc2626';e.target.style.color='white'}}
              onMouseLeave={e=>{e.target.style.background='#fef2f2';e.target.style.color='#dc2626'}}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── ANA UYGULAMA ── */
export default function App() {
  const [page, setPage]                     = useState('signals')
  const [signals, setSignals]               = useState([])
  const [watchlist, setWatchlist]           = useState([])
  const [loading, setLoading]               = useState(true)
  const [filterTF, setFilterTF]             = useState('Tümü')
  const [selectedSignal, setSelectedSignal] = useState(null)
  const [addingSignal, setAddingSignal]     = useState(null)
  const [lastUpdate, setLastUpdate]         = useState(null)
  const [searchTerm, setSearchTerm]         = useState('')

  async function fetchSignals() {
    const { data } = await supabase.from('signals').select('*').order('created_at',{ascending:false}).limit(500)
    if (data) { setSignals(data); setLastUpdate(new Date()) }
    setLoading(false)
  }
  async function fetchWatchlist() {
    const { data } = await supabase.from('watchlist').select('*').order('added_at',{ascending:false})
    if (data) setWatchlist(data)
  }

  useEffect(() => {
    fetchSignals(); fetchWatchlist()
    const i = setInterval(()=>{fetchSignals();fetchWatchlist()},60000)
    return ()=>clearInterval(i)
  }, [])

  async function handleAddToWatch(note) {
    const s = addingSignal
    if (watchlist.find(w=>w.ticker===s.ticker)) { setAddingSignal(null); return }
    const { data } = await supabase.from('watchlist').insert([{
      ticker:s.ticker, entry_price:s.price, current_price:s.price,
      high_price:s.price, low_price:s.price, note,
      timeframe:s.timeframe, criteria:s.criteria,
      added_at:new Date().toISOString(), updated_at:new Date().toISOString(),
      change_pct:0, high_pct:0, low_pct:0,
    }]).select().single()
    if (data) setWatchlist(prev=>[data,...prev])
    setAddingSignal(null)
  }
  async function handleRemoveWatch(id) {
    await supabase.from('watchlist').delete().eq('id',id)
    setWatchlist(prev=>prev.filter(w=>w.id!==id))
  }
  async function handleUpdateNote(id,note) {
    await supabase.from('watchlist').update({note,updated_at:new Date().toISOString()}).eq('id',id)
    setWatchlist(prev=>prev.map(w=>w.id===id?{...w,note}:w))
  }

  const timeframes = ['Tümü',...new Set(signals.map(s=>s.timeframe))]
  const filtered = signals.filter(s=>{
    if (filterTF!=='Tümü' && s.timeframe!==filterTF) return false
    if (searchTerm && !s.ticker.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })
  const todaySignals = signals.filter(s=>Date.now()-new Date(s.created_at)<86400000).length

  return (
    <div style={{ minHeight:'100vh',background:'#f1f5f9',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}
        button,input,textarea{font-family:inherit}
      `}</style>

      {/* HEADER */}
      <header style={{ background:'white',borderBottom:'1px solid #e8edf5',boxShadow:'0 1px 3px rgba(0,0,0,0.04)',position:'sticky',top:0,zIndex:100 }}>
        <div style={{ maxWidth:1400,margin:'0 auto',padding:'0 32px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:32 }}>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <div style={{ width:32,height:32,background:'linear-gradient(135deg,#E30A17,#c00812)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <span style={{ color:'white',fontSize:16 }}>★</span>
              </div>
              <div>
                <div style={{ fontWeight:800,fontSize:15,color:'#1e293b',letterSpacing:-0.3 }}>BIST Tarayıcı</div>
                <div style={{ fontSize:10,color:'#94a3b8',fontWeight:500 }}>IFT CCI Sinyal Sistemi</div>
              </div>
            </div>
            <nav style={{ display:'flex',gap:2 }}>
              {[['signals','📊 Sinyaller'],['watchlist','★ Takip Listesi']].map(([k,l])=>(
                <button key={k} onClick={()=>setPage(k)} style={{ background:page===k?'#fef2f2':'none',border:'none',color:page===k?'#E30A17':'#64748b',padding:'8px 16px',cursor:'pointer',fontSize:13,fontWeight:page===k?700:500,borderRadius:8,display:'flex',alignItems:'center',gap:6,transition:'all 0.15s' }}>
                  {l}
                  {k==='watchlist'&&watchlist.length>0&&<span style={{ background:'#E30A17',color:'white',borderRadius:10,padding:'1px 6px',fontSize:10,fontWeight:700 }}>{watchlist.length}</span>}
                </button>
              ))}
            </nav>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:16 }}>
            {lastUpdate&&(
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:10,color:'#94a3b8' }}>Son güncelleme</div>
                <div style={{ fontSize:12,color:'#64748b',fontWeight:600 }}>{lastUpdate.toLocaleTimeString('tr-TR')}</div>
              </div>
            )}
            <button onClick={()=>{fetchSignals();fetchWatchlist()}} style={{ background:'#f1f5f9',border:'1px solid #e2e8f0',color:'#64748b',padding:'8px 16px',borderRadius:10,cursor:'pointer',fontSize:12,fontWeight:600 }}>↻ Yenile</button>
            <TurkishFlag/>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1400,margin:'0 auto',padding:'28px 32px' }}>

        {/* SİNYALLER */}
        {page==='signals' && (
          <>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:28 }}>
              <StatCard label="Toplam Sinyal" value={signals.length} color="#E30A17" sub="veritabanında"/>
              <StatCard label="Bugün" value={todaySignals} color="#2563eb" sub="son 24 saat"/>
              <StatCard label="Takip Listesi" value={watchlist.length} color="#059669" sub="hisse takipte" onClick={()=>setPage('watchlist')}/>
              <StatCard label="Filtrelenen" value={filtered.length} color="#7c3aed" sub="gösterilen"/>
            </div>

            {/* Filtreler */}
            <div style={{ background:'white',borderRadius:16,border:'1px solid #e8edf5',padding:'16px 20px',marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display:'flex',gap:20,flexWrap:'wrap',alignItems:'center' }}>
                <div style={{ position:'relative',flex:1,minWidth:160 }}>
                  <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',fontSize:14 }}>🔍</span>
                  <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Hisse ara... (THYAO)"
                    style={{ width:'100%',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:10,padding:'8px 12px 8px 34px',fontSize:13,color:'#1e293b',outline:'none' }}/>
                </div>
                <div style={{ display:'flex',gap:6,alignItems:'center',flexWrap:'wrap' }}>
                  <span style={{ color:'#94a3b8',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5 }}>Zaman:</span>
                  {timeframes.map(tf=>(
                    <button key={tf} onClick={()=>setFilterTF(tf)} style={{ background:filterTF===tf?'#E30A17':'#f8fafc',color:filterTF===tf?'white':'#64748b',border:`1px solid ${filterTF===tf?'#E30A17':'#e2e8f0'}`,padding:'5px 14px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,transition:'all 0.15s' }}>
                      {tf==='Tümü'?'Tümü':TF_LABELS[tf]||tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tablo */}
            <div style={{ background:'white',borderRadius:16,border:'1px solid #e8edf5',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display:'grid',gridTemplateColumns:'130px 160px 100px 110px 100px 90px 110px 48px',padding:'12px 20px',borderBottom:'1px solid #f1f5f9',background:'#f8fafc',gap:8 }}>
                {['HİSSE','ZAMAN DİLİMİ','KRİTER','FİYAT','DEĞİŞİM','IFT DEĞERİ','ZAMAN',''].map((h,i)=>(
                  <span key={i} style={{ color:'#94a3b8',fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5 }}>{h}</span>
                ))}
              </div>

              {loading ? (
                <div style={{ padding:60,textAlign:'center' }}>
                  <div style={{ width:36,height:36,border:'3px solid #f1f5f9',borderTop:'3px solid #E30A17',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 12px' }}/>
                  <p style={{ color:'#94a3b8',fontSize:13 }}>Yükleniyor...</p>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              ) : filtered.length===0 ? (
                <div style={{ padding:60,textAlign:'center',color:'#94a3b8' }}>
                  <div style={{ fontSize:32,marginBottom:8,opacity:0.3 }}>📊</div>
                  <p style={{ fontSize:14 }}>Bu filtrelere uyan sinyal yok</p>
                </div>
              ) : filtered.map(s=>{
                const inWatch = watchlist.some(w=>w.ticker===s.ticker)
                return (
                  <div key={s.id} style={{ display:'grid',gridTemplateColumns:'130px 160px 100px 110px 100px 90px 110px 48px',padding:'14px 20px',borderBottom:'1px solid #f8fafc',alignItems:'center',gap:8,transition:'background 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#fafbfc'}
                    onMouseLeave={e=>e.currentTarget.style.background='white'}>

                    <div onClick={()=>setSelectedSignal(s)} style={{ cursor:'pointer' }}>
                      <div style={{ fontWeight:700,fontSize:14,color:'#1e293b' }}>{s.ticker}</div>
                      <div style={{ fontSize:10,color:'#94a3b8',marginTop:2 }}>Analiz için tıkla →</div>
                    </div>

                    <div style={{ display:'flex',flexDirection:'column',gap:3 }}>
                      <span style={{ background:'#f3f0ff',color:'#7c3aed',fontSize:11,padding:'4px 10px',borderRadius:8,fontWeight:600,width:'fit-content' }}>
                        {TF_LABELS[s.timeframe]||s.timeframe}
                      </span>
                      {TF_PARAMS[s.timeframe]&&(
                        <span style={{ color:'#94a3b8',fontSize:10 }}>CCI({TF_PARAMS[s.timeframe].cci}) · WMA({TF_PARAMS[s.timeframe].wma})</span>
                      )}
                    </div>

                    <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
                      {s.criteria?.map(c=><Badge key={c} label={CRITERIA_LABELS[c]||c} color={CRITERIA_COLORS[c]||'#64748b'}/>)}
                    </div>

                    <span style={{ color:'#1e293b',fontSize:13,fontWeight:600 }}>₺{fmtPrice(s.price)}</span>

                    <span style={{ color:s.change>=0?'#059669':'#dc2626',fontSize:13,fontWeight:700,background:s.change>=0?'#f0fdf4':'#fef2f2',padding:'3px 8px',borderRadius:6,width:'fit-content' }}>
                      {s.change>=0?'+':''}{Number(s.change).toFixed(2)}%
                    </span>

                    <div>
                      <div style={{ fontSize:13,fontWeight:700,color:s.ift_value>=0?'#059669':'#dc2626' }}>
                        {s.ift_value!=null?Number(s.ift_value).toFixed(3):'—'}
                      </div>
                      <div style={{ marginTop:3,height:3,background:'#f1f5f9',borderRadius:2,width:60,position:'relative' }}>
                        <div style={{ position:'absolute',height:'100%',borderRadius:2,width:s.ift_value!=null?Math.min(Math.abs(Number(s.ift_value))*60,60)+'px':0,background:s.ift_value>=0?'#059669':'#dc2626',left:s.ift_value>=0?'50%':'auto',right:s.ift_value<0?'50%':'auto' }}/>
                        <div style={{ position:'absolute',left:'50%',top:-1,width:1,height:5,background:'#cbd5e1' }}/>
                      </div>
                    </div>

                    <span style={{ color:'#94a3b8',fontSize:12 }}>{timeAgo(s.created_at)} önce</span>

                    <button onClick={()=>!inWatch&&setAddingSignal(s)} title={inWatch?'Zaten takipte':'Takibe al'}
                      style={{ background:inWatch?'#fef2f2':'#f8fafc',border:`1px solid ${inWatch?'#fecaca':'#e2e8f0'}`,color:inWatch?'#E30A17':'#94a3b8',width:32,height:32,borderRadius:8,cursor:inWatch?'default':'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s',flexShrink:0 }}
                      onMouseEnter={e=>!inWatch&&Object.assign(e.target.style,{background:'#fef2f2',color:'#E30A17',borderColor:'#fecaca'})}
                      onMouseLeave={e=>!inWatch&&Object.assign(e.target.style,{background:'#f8fafc',color:'#94a3b8',borderColor:'#e2e8f0'})}>
                      {inWatch?'★':'☆'}
                    </button>
                  </div>
                )
              })}
            </div>

            <p style={{ color:'#cbd5e1',fontSize:11,marginTop:12,textAlign:'center' }}>
              Her 15 dakikada 600 BIST hissesi taranır · {filtered.length} sinyal gösteriliyor · Hisseye tıkla → Gemini AI analiz
            </p>
          </>
        )}

        {page==='watchlist' && (
          <WatchlistPage watchlist={watchlist} onRemove={handleRemoveWatch} onUpdateNote={handleUpdateNote}/>
        )}
      </main>

      {selectedSignal && <AnalysisModal ticker={selectedSignal.ticker} signal={selectedSignal} onClose={()=>setSelectedSignal(null)}/>}
      {addingSignal   && <AddWatchModal signal={addingSignal} onAdd={handleAddToWatch} onClose={()=>setAddingSignal(null)}/>}
    </div>
  )
}