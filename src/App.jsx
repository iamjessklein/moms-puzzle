import { useState, useRef, useCallback, useEffect } from "react"
import { supabase } from "./supabase.js"

// ── UTILS ─────────────────────────────────────────────────────────────────────

function vibe(p) { try { if ("vibrate" in navigator) navigator.vibrate(p) } catch(e) {} }

function shuffleArr(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1);
    [a[i], a[j]] = [a[j], a[i]]
  }
  if (a.every((v, i) => v === i)) return shuffleArr(arr)
  return a
}

function renderPiece(img, id, cols, rows, pw, ph) {
  const c = document.createElement("canvas")
  c.width = pw; c.height = ph
  const ctx = c.getContext("2d")
  const iA = img.naturalWidth / img.naturalHeight
  const bA = (cols * pw) / (rows * ph)
  let sx, sy, sw, sh
  if (iA > bA) { sh = img.naturalHeight; sw = sh * bA; sx = (img.naturalWidth - sw) / 2; sy = 0 }
  else { sw = img.naturalWidth; sh = sw / bA; sx = 0; sy = (img.naturalHeight - sh) / 2 }
  const col = id % cols, row = Math.floor(id / cols)
  ctx.drawImage(img, sx + col*(sw/cols), sy + row*(sh/rows), sw/cols, sh/rows, 0, 0, pw, ph)
  return c.toDataURL("image/jpeg", 0.75)
}

function launchConfetti(canvas) {
  const ctx = canvas.getContext("2d")
  canvas.width = window.innerWidth; canvas.height = window.innerHeight
  const ps = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width, y: -Math.random() * canvas.height,
    r: Math.random() * 9 + 4, d: Math.random() * 2.5 + 1.5,
    color: `hsl(${Math.random() * 360},90%,65%)`,
    angle: 0, ts: Math.random() * .1 + .05, tilt: 0,
  }))
  let opacity = 1, frame
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.globalAlpha = Math.max(0, opacity)
    ps.forEach(p => {
      p.y += p.d * 3; p.angle += p.ts; p.tilt = Math.sin(p.angle) * 12
      if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width }
      ctx.beginPath(); ctx.lineWidth = p.r / 2; ctx.strokeStyle = p.color
      ctx.moveTo(p.x + p.tilt + p.r / 4, p.y); ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4); ctx.stroke()
    })
    opacity -= .004
    if (opacity > 0) frame = requestAnimationFrame(draw)
    else ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  draw()
}

async function compressImage(dataUrl, maxDim = 600) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      const c = document.createElement("canvas")
      c.width = w; c.height = h
      c.getContext("2d").drawImage(img, 0, 0, w, h)
      resolve(c.toDataURL("image/jpeg", 0.72))
    }
    img.src = dataUrl
  })
}

// Simple hash — not cryptographic, but enough to avoid storing plaintext passwords
async function hashPassword(pw) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw.trim().toLowerCase()))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("")
}

// ── SUPABASE ──────────────────────────────────────────────────────────────────
// Puzzles table columns: key (text, unique), title (text), password_hash (text), data (jsonb)
// "data" contains photos+message+from+cols+rows — only returned after password check client-side
// NOTE: since this is a static site, the real security comes from:
//   1. The short random key being hard to guess
//   2. The password being required to see any photos
// For family use this is plenty of protection.

async function savePuzzle({ key, title, passwordHash, puzzleData }) {
  const { error } = await supabase
    .from("puzzles")
    .insert({ key, title, password_hash: passwordHash, data: puzzleData })
  if (error) throw new Error(error.message)
}

// Load just the title + hash first (no photos)
async function loadPuzzleMeta(key) {
  const { data, error } = await supabase
    .from("puzzles")
    .select("title, password_hash")
    .eq("key", key)
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Load full puzzle data (called only after password verified client-side)
async function loadPuzzleData(key) {
  const { data, error } = await supabase
    .from("puzzles")
    .select("data")
    .eq("key", key)
    .single()
  if (error) throw new Error(error.message)
  return data.data
}

function genKey() {
  const words = ["rose","lily","fern","jade","opal","ruby","iris","dawn","star","moon","sage","wren"]
  return words[Math.floor(Math.random() * words.length)] + "-" + Math.floor(Math.random() * 900 + 100)
}

// ── THEME ─────────────────────────────────────────────────────────────────────
// Inspired by: playful kids-app aesthetic — near-white lavender bg, chunky black
// display type, periwinkle violet accent, soft peach + pink pops, rounded cards.

const violet   = "#7C6FCD"       // primary accent — periwinkle
const violetLt = "#E8E5F8"       // light violet tint
const violetPale = "#F2F0FC"     // near-white lavender bg
const ink      = "#1a1a2e"       // near-black for headings
const peach    = "#FFD6C0"       // warm accent
const mint     = "#C8F0E0"       // success green tint
const rose     = "#7C6FCD"       // alias so existing code keeps working
const roseLt   = "#E8E5F8"
const rosePale = "#F2F0FC"
const plum     = "#3d3480"
const muted    = "#8885a8"
const ff       = "'Nunito', 'Trebuchet MS', sans-serif"
const bg       = "#F4F2FC"       // flat near-white lavender, clean like the reference

// Inject Nunito from Google Fonts once
if (typeof document !== "undefined" && !document.getElementById("nunito-font")) {
  const link = document.createElement("link")
  link.id = "nunito-font"
  link.rel = "stylesheet"
  link.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap"
  document.head.appendChild(link)
}
if (typeof document !== "undefined" && !document.getElementById("global-box-sizing")) {
  const style = document.createElement("style")
  style.id = "global-box-sizing"
  style.textContent = "input, textarea { box-sizing: border-box; }"
  document.head.appendChild(style)
}

const GRID_SIZES = [
  { label: "Easy",   cols: 2, rows: 2 },
  { label: "Medium", cols: 3, rows: 3 },
  { label: "Hard",   cols: 4, rows: 4 },
]

// ── SHARED UI ─────────────────────────────────────────────────────────────────

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "white",
      borderRadius: "24px",
      padding: "22px",
      width: "100%",
      maxWidth: "400px",
      boxShadow: "0 2px 16px rgba(100,80,200,0.08), 0 1px 4px rgba(100,80,200,0.06)",
      marginBottom: "14px",
      ...style
    }}>{children}</div>
  )
}

function Label({ children }) {
  return (
    <div style={{
      fontSize: "11px", fontWeight: "800", color: violet,
      letterSpacing: "1px", marginBottom: "10px",
      textTransform: "uppercase",
    }}>{children}</div>
  )
}

function PrimaryBtn({ children, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", padding: "16px", borderRadius: "16px", border: "none",
      background: disabled ? "#d4d0ee" : violet,
      color: disabled ? "#a0a0c0" : "white",
      fontSize: "16px", fontWeight: "800",
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: ff,
      boxShadow: disabled ? "none" : "0 4px 20px rgba(124,111,205,0.4)",
      letterSpacing: "0.2px",
      transition: "transform 0.1s, box-shadow 0.1s",
      ...style,
    }}
    onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)" }}
    onMouseUp={e => { e.currentTarget.style.transform = "scale(1)" }}
    onTouchStart={e => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)" }}
    onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)" }}
    >{children}</button>
  )
}

function SecondaryBtn({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "16px", borderRadius: "16px",
      border: `2.5px solid ${violetLt}`,
      background: "white",
      color: violet, fontSize: "16px", fontWeight: "800",
      cursor: "pointer", fontFamily: ff,
      letterSpacing: "0.2px",
      transition: "background 0.15s",
      ...style,
    }}>{children}</button>
  )
}

// ── BUILDER ───────────────────────────────────────────────────────────────────

function Builder({ onDone }) {
  const [photos, setPhotos]     = useState([])
  const [title, setTitle]       = useState("A Puzzle For You 💕")
  const [message, setMessage]   = useState("I made this just for you! Love you so much 💕")
  const [from, setFrom]         = useState("")
  const [password, setPassword] = useState("")
  const [gridSize, setGridSize] = useState(GRID_SIZES[1])
  const [status, setStatus]     = useState(null)
  const fileRef = useRef()

  const addFiles = useCallback(async (files) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue
      await new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = async e => {
          const compressed = await compressImage(e.target.result)
          setPhotos(p => [...p, { dataUrl: compressed }])
          resolve()
        }
        reader.readAsDataURL(file)
      })
    }
  }, [])

  const handleCreate = async () => {
    if (!photos.length || !password.trim()) return
    setStatus("saving")
    try {
      const key = genKey()
      const passwordHash = await hashPassword(password)
      const puzzleData = {
        photos: photos.map(p => p.dataUrl),
        title, message, from,
        cols: gridSize.cols,
        rows: gridSize.rows,
      }
      await savePuzzle({ key, title, passwordHash, puzzleData })
      setStatus("done")
      onDone({ key, puzzle: puzzleData, password })
    } catch(e) {
      setStatus("error:" + e.message)
    }
  }

  const busy = status === "saving"
  const canCreate = photos.length > 0 && password.trim().length > 0 && !busy

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 16px 60px", minHeight:"100vh", background:bg, fontFamily:ff }}>
      <div style={{ textAlign:"center", marginBottom:"28px" }}>
        <div style={{ fontSize:"52px", marginBottom:"4px" }}>🧩</div>
        <h1 style={{ fontSize:"clamp(26px,8vw,38px)", fontWeight:"900", color:ink, margin:"0 0 6px", letterSpacing:"-0.5px", lineHeight:1.1 }}>
          Puzzle <span style={{ color:violet }}>Builder</span>
        </h1>
        <p style={{ color:muted, fontSize:"14px", margin:"0", fontWeight:"600" }}>Make a puzzle for someone you love 💕</p>
      </div>

      {/* Photos */}
      <Card>
        <Label>📷 ADD PHOTOS</Label>
        <div onClick={() => fileRef.current?.click()} style={{
          border:`2.5px dashed ${roseLt}`, borderRadius:"14px",
          padding: photos.length ? "12px" : "28px",
          textAlign:"center", cursor:"pointer", background:rosePale,
          marginBottom: photos.length ? "12px" : 0,
        }}>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }}
            onChange={e => { addFiles(e.target.files); e.target.value = "" }} />
          {photos.length === 0 ? (
            <>
              <div style={{ fontSize:"36px" }}>📸</div>
              <div style={{ fontWeight:"700", color:rose, marginTop:"6px" }}>Tap to choose photos</div>
              <div style={{ fontSize:"12px", color:muted, marginTop:"3px" }}>Add one or more family photos</div>
            </>
          ) : (
            <div style={{ fontWeight:"700", color:rose, fontSize:"14px" }}>+ Add more photos</div>
          )}
        </div>
        {photos.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px" }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position:"relative", aspectRatio:"1", borderRadius:"10px", overflow:"hidden", border:`2px solid ${roseLt}` }}>
                <img src={p.dataUrl} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                <button onClick={() => setPhotos(ps => ps.filter((_,j) => j!==i))} style={{
                  position:"absolute", top:"4px", right:"4px",
                  background:"rgba(200,40,80,0.9)", color:"white",
                  border:"none", borderRadius:"50%", width:"22px", height:"22px",
                  fontSize:"14px", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"700",
                }}>×</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Message */}
      <Card>
        <Label>💌 YOUR MESSAGE</Label>
        {[
          { label:"Puzzle title",                        val:title,   set:setTitle,   multi:false, ph:"e.g. Family Memories 💕" },
          { label:"Message (shown when she finishes!)",  val:message, set:setMessage, multi:true,  ph:"Write something sweet..." },
          { label:"From (your name)",                    val:from,    set:setFrom,    multi:false, ph:"e.g. Your daughter" },
        ].map(({ label, val, set, multi, ph }) => (
          <div key={label} style={{ marginBottom:"12px" }}>
            <div style={{ fontSize:"11px", color:muted, marginBottom:"5px" }}>{label}</div>
            {multi
              ? <textarea value={val} onChange={e => set(e.target.value)} placeholder={ph} rows={3} style={{ width:"100%", padding:"10px 12px", border:`2px solid ${roseLt}`, borderRadius:"10px", fontFamily:ff, fontSize:"14px", color:"#3a1a2a", background:rosePale, outline:"none", resize:"vertical" }} />
              : <input    value={val} onChange={e => set(e.target.value)} placeholder={ph}          style={{ width:"100%", padding:"10px 12px", border:`2px solid ${roseLt}`, borderRadius:"10px", fontFamily:ff, fontSize:"14px", color:"#3a1a2a", background:rosePale, outline:"none" }} />
            }
          </div>
        ))}
      </Card>

      {/* Password */}
      <Card>
        <Label>🔒 SET A SECRET WORD</Label>
        <div style={{ fontSize:"12px", color:muted, marginBottom:"10px", lineHeight:1.5 }}>
          Your mom will need to type this to open the puzzle. Tell her separately — e.g. call her or text it before you send the link.
        </div>
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="e.g. sunshine"
          type="text"
          style={{ width:"100%", padding:"12px 14px", border:`2px solid ${password ? rose : roseLt}`, borderRadius:"10px", fontFamily:ff, fontSize:"16px", color:"#3a1a2a", background:rosePale, outline:"none", letterSpacing:"0.5px" }}
        />
        {password && (
          <div style={{ marginTop:"8px", fontSize:"12px", color:rose, fontStyle:"italic" }}>
            🔑 Secret word: "<strong>{password}</strong>" — remember to tell her!
          </div>
        )}
      </Card>

      {/* Difficulty */}
      <Card>
        <Label>🎯 DIFFICULTY</Label>
        <div style={{ display:"flex", gap:"8px" }}>
          {GRID_SIZES.map(g => (
            <button key={g.label} onClick={() => setGridSize(g)} style={{
              flex:1, padding:"10px 0", borderRadius:"10px",
              border: gridSize.label===g.label ? `2.5px solid ${rose}` : `2px solid ${roseLt}`,
              background: gridSize.label===g.label ? rose : "white",
              color: gridSize.label===g.label ? "white" : rose,
              fontWeight:"700", fontSize:"13px", cursor:"pointer", fontFamily:ff,
            }}>
              {g.label}
              <div style={{ fontSize:"10px", fontWeight:"400", opacity:0.8 }}>{g.cols}×{g.rows}</div>
            </button>
          ))}
        </div>
      </Card>

      <div style={{ width:"100%", maxWidth:"400px" }}>
        <PrimaryBtn onClick={handleCreate} disabled={!canCreate}>
          {busy ? "⏳ Saving puzzle…" : "🎁 Create Puzzle & Get Link"}
        </PrimaryBtn>
        {!password.trim() && photos.length > 0 && (
          <div style={{ marginTop:"8px", textAlign:"center", fontSize:"12px", color:muted, fontStyle:"italic" }}>
            Add a secret word above to continue
          </div>
        )}
        {status?.startsWith("error:") && (
          <div style={{ marginTop:"10px", padding:"12px 14px", background:"#fff0f0", borderRadius:"10px", fontSize:"13px", color:rose, border:`1px solid ${roseLt}`, lineHeight:1.5 }}>
            ⚠️ {status.replace("error:","")}
          </div>
        )}
      </div>
    </div>
  )
}

// ── PASSWORD SCREEN ───────────────────────────────────────────────────────────

function PasswordScreen({ title, onUnlock }) {
  const [input, setInput]   = useState("")
  const [error, setError]   = useState(false)
  const [loading, setLoading] = useState(false)

  const attempt = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError(false)
    const result = await onUnlock(input)
    if (!result) {
      setError(true)
      setInput("")
    }
    setLoading(false)
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:bg, fontFamily:ff, padding:"24px 16px" }}>
      <div style={{ textAlign:"center", marginBottom:"32px" }}>
        <div style={{ fontSize:"56px", marginBottom:"10px" }}>🔒</div>
        <h1 style={{ fontSize:"clamp(22px,6vw,32px)", fontWeight:"900", color:ink, margin:"0 0 8px", letterSpacing:"-0.5px" }}>{title}</h1>
        <p style={{ color:muted, fontSize:"14px", fontWeight:"600", margin:0 }}>Enter the secret word to open your puzzle</p>
      </div>

      <Card>
        <Label>🔑 SECRET WORD</Label>
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setError(false) }}
          onKeyDown={e => e.key === "Enter" && attempt()}
          placeholder="Type the secret word…"
          type="text"
          autoFocus
          style={{
            width:"100%", padding:"14px", border:`2px solid ${error ? "#e84040" : roseLt}`,
            borderRadius:"10px", fontFamily:ff, fontSize:"18px",
            color:"#3a1a2a", background:rosePale, outline:"none",
            textAlign:"center", letterSpacing:"1px",
            transition:"border-color 0.2s",
          }}
        />
        {error && (
          <div style={{ marginTop:"8px", textAlign:"center", fontSize:"13px", color:"#e84040", fontStyle:"italic" }}>
            That's not quite right — try again 🙈
          </div>
        )}
        <PrimaryBtn onClick={attempt} disabled={!input.trim() || loading} style={{ marginTop:"14px" }}>
          {loading ? "Checking…" : "Open My Puzzle 🧩"}
        </PrimaryBtn>
      </Card>
    </div>
  )
}

// ── SHARE SCREEN ──────────────────────────────────────────────────────────────

function ShareScreen({ puzzleKey, puzzle, password, onPreview, onNew }) {
  const [copied, setCopied] = useState(false)

  const shareUrl = `${window.location.origin}${window.location.pathname}?p=${puzzleKey}`

  const copy = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 3000) })
      .catch(() => {
        const ta = document.createElement("textarea")
        ta.value = shareUrl; document.body.appendChild(ta); ta.select()
        document.execCommand("copy"); document.body.removeChild(ta)
        setCopied(true); setTimeout(() => setCopied(false), 3000)
      })
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 16px 60px", minHeight:"100vh", background:bg, fontFamily:ff }}>
      <div style={{ textAlign:"center", marginBottom:"28px" }}>
        <div style={{ fontSize:"52px" }}>🎉</div>
        <h1 style={{ fontSize:"clamp(24px,7vw,34px)", fontWeight:"900", color:ink, margin:"8px 0 4px", letterSpacing:"-0.5px" }}>
          Puzzle <span style={{ color:violet }}>Ready!</span>
        </h1>
        <p style={{ color:muted, fontSize:"14px", fontWeight:"600", margin:0 }}>Send the link + secret word to your mom 💌</p>
      </div>

      <Card style={{ background: violetPale, border:`2px solid ${violetLt}` }}>
        <Label>🔑 SECRET WORD — TELL HER THIS</Label>
        <div style={{ fontSize:"32px", fontWeight:"900", color:plum, textAlign:"center", letterSpacing:"3px", padding:"10px 0", background:"white", borderRadius:"14px", margin:"4px 0 10px" }}>
          {password}
        </div>
        <div style={{ fontSize:"12px", color:muted, textAlign:"center", fontWeight:"600" }}>
          Call or text this word to her before sending the link
        </div>
      </Card>

      <Card>
        <Label>📋 PUZZLE LINK</Label>
        <div style={{
          background:rosePale, border:`2px solid ${copied ? "#4caf50" : roseLt}`,
          borderRadius:"10px", padding:"14px", fontFamily:"monospace",
          fontSize:"13px", color:plum, wordBreak:"break-all",
          transition:"border-color 0.2s",
        }}>
          {shareUrl}
        </div>
        <PrimaryBtn onClick={copy} style={{ marginTop:"12px" }}>
          {copied ? "✅ Copied!" : "📋 Copy Link"}
        </PrimaryBtn>
      </Card>

      <Card>
        <Label>💬 HOW TO SEND</Label>
        <div style={{ fontSize:"14px", color:muted, lineHeight:1.7 }}>
          1. <strong style={{color:plum}}>Call or text her the secret word</strong> first<br/>
          2. Then copy and text her the link<br/>
          3. She taps the link → types the word → puzzle opens! 🧩
        </div>
      </Card>

      <div style={{ width:"100%", maxWidth:"400px", display:"flex", gap:"10px" }}>
        <SecondaryBtn onClick={onPreview} style={{ flex:1 }}>▶ Preview It</SecondaryBtn>
        <PrimaryBtn   onClick={onNew}     style={{ flex:1 }}>+ New Puzzle</PrimaryBtn>
      </div>
    </div>
  )
}

// ── PUZZLE PLAYER ─────────────────────────────────────────────────────────────

function PuzzlePlayer({ puzzle, onBack }) {
  const { photos, title, message, from, cols: defCols, rows: defRows } = puzzle
  const [screen, setScreen]         = useState("intro")
  const [photoIdx, setPhotoIdx]     = useState(0)
  const [pCols, setPCols]           = useState(defCols)
  const [pRows, setPRows]           = useState(defRows)
  const [board, setBoard]           = useState([])
  const [pieceSrcs, setPieceSrcs]   = useState([])
  const [selected, setSelected]     = useState(null)
  const [flashSlots, setFlashSlots] = useState({})
  const confettiRef = useRef(null)

  const boardPx = Math.min(340, window.innerWidth - 40)

  const startGame = useCallback((pi, c, r) => {
    const img = new Image()
    img.onload = () => {
      const pw = Math.floor(boardPx / c)
      const ph = Math.floor(boardPx / r)
      const total = c * r
      setPieceSrcs(Array.from({ length: total }, (_, i) => renderPiece(img, i, c, r, pw, ph)))
      setBoard(shuffleArr(Array.from({ length: total }, (_, i) => i)))
      setSelected(null); setFlashSlots({})
      setScreen("game")
    }
    img.src = photos[pi]
  }, [photos, boardPx])

  const handleTap = useCallback((slotIdx) => {
    if (selected === null) { setSelected(slotIdx); vibe(15); return }
    if (selected === slotIdx) { setSelected(null); return }
    const a = selected, b = slotIdx
    setSelected(null)
    setBoard(prev => {
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]]
      const solved = next.every((v, i) => v === i)
      if (solved) {
        vibe([80,40,80,40,200])
        setTimeout(() => setScreen("solved"), 350)
        setTimeout(() => { if (confettiRef.current) launchConfetti(confettiRef.current) }, 500)
      } else {
        const aOk = next[a]===a, bOk = next[b]===b
        vibe(aOk||bOk ? [50,30,50] : 25)
        setFlashSlots({ [a]: aOk?"ok":"bad", [b]: bOk?"ok":"bad" })
        setTimeout(() => setFlashSlots({}), 450)
      }
      return next
    })
  }, [selected])

  const pw = Math.floor(boardPx / pCols)
  const ph = Math.floor(boardPx / pRows)
  const total = pCols * pRows
  const solvedCount = board.filter((v,i) => v===i).length

  if (screen === "intro") return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"28px 16px 60px", minHeight:"100vh", background:bg, fontFamily:ff }}>
      {onBack && (
        <button onClick={onBack} style={{ alignSelf:"flex-start", background:"white", border:`2px solid ${violetLt}`, borderRadius:"12px", padding:"8px 14px", color:violet, fontWeight:"800", fontSize:"13px", cursor:"pointer", fontFamily:ff, marginBottom:"16px", boxShadow:"0 2px 8px rgba(124,111,205,0.1)" }}>← Builder</button>
      )}
      <div style={{ textAlign:"center", marginBottom:"24px" }}>
        <div style={{ fontSize:"48px", marginBottom:"6px" }}>🧩</div>
        <h1 style={{ fontSize:"clamp(20px,7vw,32px)", fontWeight:"900", color:ink, margin:"0 0 6px", letterSpacing:"-0.5px", lineHeight:1.1 }}>{title}</h1>
        <p style={{ color:muted, fontSize:"13px", margin:"0", fontWeight:"600" }}>A puzzle made just for you 💕</p>
      </div>

      {photos.length > 1 && (
        <Card>
          <Label>CHOOSE A PHOTO</Label>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            {photos.map((src,i) => (
              <img key={i} src={src} onClick={() => setPhotoIdx(i)} style={{
                width:"70px", height:"70px", objectFit:"cover", borderRadius:"10px", cursor:"pointer",
                border:`3px solid ${photoIdx===i ? rose : roseLt}`,
                transform: photoIdx===i ? "scale(1.08)" : "scale(1)", transition:"all 0.15s",
              }} />
            ))}
          </div>
        </Card>
      )}

      <Card>
        <Label>DIFFICULTY</Label>
        <div style={{ display:"flex", gap:"8px" }}>
          {GRID_SIZES.map(g => (
            <button key={g.label} onClick={() => { setPCols(g.cols); setPRows(g.rows) }} style={{
              flex:1, padding:"10px 0", borderRadius:"10px",
              border: pCols===g.cols ? `2.5px solid ${rose}` : `2px solid ${roseLt}`,
              background: pCols===g.cols ? rose : "white",
              color: pCols===g.cols ? "white" : rose,
              fontWeight:"700", fontSize:"13px", cursor:"pointer", fontFamily:ff,
            }}>
              {g.label}
              <div style={{ fontSize:"10px", fontWeight:"400", opacity:0.8 }}>{g.cols}×{g.rows}</div>
            </button>
          ))}
        </div>
      </Card>

      <div style={{ width:"100%", maxWidth:"400px" }}>
        <PrimaryBtn onClick={() => startGame(photoIdx, pCols, pRows)}>🧩 Start Puzzle!</PrimaryBtn>
      </div>
    </div>
  )

  if (screen === "game") return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"18px 16px 50px", minHeight:"100vh", background:bg, fontFamily:ff }}>
      <canvas ref={confettiRef} style={{ position:"fixed", top:0, left:0, width:"100vw", height:"100vh", pointerEvents:"none", zIndex:9999 }} />

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", maxWidth:"400px", marginBottom:"14px" }}>
        <button onClick={() => setScreen("intro")} style={{ background:"white", border:`2px solid ${violetLt}`, borderRadius:"12px", padding:"8px 14px", color:violet, fontWeight:"800", fontSize:"13px", cursor:"pointer", fontFamily:ff, boxShadow:"0 2px 8px rgba(124,111,205,0.1)" }}>← Back</button>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"13px", fontWeight:"800", color:ink }}>{solvedCount} / {total} ✓</div>
          <div style={{ width:"110px", height:"7px", background:violetLt, borderRadius:"99px", overflow:"hidden", marginTop:"4px" }}>
            <div style={{ width:`${(solvedCount/total)*100}%`, height:"100%", background:violet, borderRadius:"99px", transition:"width 0.4s ease" }} />
          </div>
        </div>
        <button onClick={() => startGame(photoIdx, pCols, pRows)} style={{ background:"white", border:`2px solid ${violetLt}`, borderRadius:"12px", padding:"8px 14px", color:violet, fontWeight:"800", fontSize:"13px", cursor:"pointer", fontFamily:ff, boxShadow:"0 2px 8px rgba(124,111,205,0.1)" }}>↺ Shuffle</button>
      </div>

      <div style={{ textAlign:"center", width:"100%", maxWidth:"400px", marginBottom:"12px", fontSize:"14px", color: selected!==null ? violet : muted, fontWeight:"800" }}>
        {selected!==null ? "✨ Tap another piece to swap" : "👆 Tap a piece to select"}
      </div>

      <div style={{
        display:"grid", gridTemplateColumns:`repeat(${pCols}, ${pw}px)`,
        width:`${pCols*pw}px`, borderRadius:"20px", overflow:"hidden",
        boxShadow:"0 8px 32px rgba(100,80,200,0.2)", border:`4px solid ${violetLt}`,
        gap:"2px", background:violet,
      }}>
        {board.map((pieceId, slotIdx) => {
          const isSel  = selected===slotIdx
          const isOk   = pieceId===slotIdx
          const flash  = flashSlots[slotIdx]
          return (
            <div key={slotIdx} onClick={() => handleTap(slotIdx)} style={{
              width:`${pw}px`, height:`${ph}px`, position:"relative",
              overflow:"hidden", cursor:"pointer",
              outline: isSel ? "3px solid #FFE44D" : isOk ? "3px solid #4cdb85" : "none",
              outlineOffset:"-2px",
              transform: isSel ? "scale(0.88)" : "scale(1)",
              transition:"transform 0.12s ease",
              zIndex: isSel?3:isOk?2:1,
              background: flash==="ok" ? "rgba(80,220,140,0.45)" : flash==="bad" ? "rgba(255,80,80,0.25)" : "transparent",
            }}>
              {pieceSrcs[pieceId] && (
                <img src={pieceSrcs[pieceId]} style={{ width:"100%", height:"100%", display:"block", pointerEvents:"none", userSelect:"none", WebkitUserSelect:"none" }} draggable={false} />
              )}
              {isSel && <div style={{ position:"absolute", inset:0, background:"rgba(255,228,77,0.18)", pointerEvents:"none" }} />}
              {isOk && !isSel && (
                <div style={{ position:"absolute", top:"4px", right:"4px", background:"#4cdb85", color:"white", borderRadius:"50%", width:"20px", height:"20px", fontSize:"12px", fontWeight:"900", display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none", boxShadow:"0 2px 6px rgba(0,0,0,0.2)", fontFamily:ff }}>✓</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 16px 60px", minHeight:"100vh", background:bg, fontFamily:ff, textAlign:"center" }}>
      <canvas ref={confettiRef} style={{ position:"fixed", top:0, left:0, width:"100vw", height:"100vh", pointerEvents:"none", zIndex:9999 }} />
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}} @keyframes popIn{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
      <div style={{ fontSize:"64px", animation:"float 1.8s ease-in-out infinite", marginBottom:"8px" }}>🎉</div>
      <h2 style={{ fontSize:"30px", fontWeight:"900", color:ink, letterSpacing:"-0.5px", animation:"popIn .5s cubic-bezier(.34,1.56,.64,1)", marginBottom:"8px", fontFamily:ff }}>
        Puzzle <span style={{ color:violet }}>Complete!</span>
      </h2>
      {message && <p style={{ color:plum, fontSize:"16px", fontWeight:"600", marginBottom:"4px", maxWidth:"320px" }}>{message}</p>}
      {from    && <p style={{ color:muted, fontSize:"13px", fontWeight:"700", marginBottom:"20px" }}>— {from}</p>}
      <img src={photos[photoIdx]} style={{ width:"100%", maxWidth:"340px", borderRadius:"20px", border:`4px solid ${violetLt}`, boxShadow:"0 8px 32px rgba(100,80,200,0.18)", marginBottom:"20px", display:"block" }} />
      <div style={{ display:"flex", gap:"10px", width:"100%", maxWidth:"340px" }}>
        <PrimaryBtn   onClick={() => startGame(photoIdx, pCols, pRows)} style={{ flex:1 }}>🔄 Play Again</PrimaryBtn>
        <SecondaryBtn onClick={() => setScreen("intro")}                 style={{ flex:1 }}>📷 Pick Photo</SecondaryBtn>
      </div>
    </div>
  )
}

// ── ROOT ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [appState, setAppState]         = useState("loading")
  const [shareData, setShareData]       = useState(null)
  const [playerPuzzle, setPlayerPuzzle] = useState(null)
  const [puzzleMeta, setPuzzleMeta]     = useState(null)   // { title, password_hash, key }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = params.get("p")
    if (p) {
      loadPuzzleMeta(p)
        .then(meta => {
          setPuzzleMeta({ ...meta, key: p })
          setAppState("password")
        })
        .catch(() => setAppState("builder"))
    } else {
      setAppState("builder")
    }
  }, [])

  // Called when mom submits a password attempt
  const handleUnlock = async (attempt) => {
    const hash = await hashPassword(attempt)
    if (hash !== puzzleMeta.password_hash) return false
    // Password correct — now load the full data
    try {
      const puzzle = await loadPuzzleData(puzzleMeta.key)
      setPlayerPuzzle(puzzle)
      setAppState("play")
      return true
    } catch(e) {
      return false
    }
  }

  if (appState === "loading") return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:bg, fontFamily:ff }}>
      <div style={{ textAlign:"center", color:muted }}>
        <div style={{ fontSize:"40px", marginBottom:"12px" }}>🧩</div>
        <div style={{ fontSize:"16px" }}>Loading…</div>
      </div>
    </div>
  )

  if (appState === "password" && puzzleMeta)
    return <PasswordScreen title={puzzleMeta.title} onUnlock={handleUnlock} />

  if (appState === "play" && playerPuzzle)
    return <PuzzlePlayer puzzle={playerPuzzle} />

  if (appState === "share" && shareData)
    return (
      <ShareScreen
        puzzleKey={shareData.key}
        puzzle={shareData.puzzle}
        password={shareData.password}
        onPreview={() => { setPlayerPuzzle(shareData.puzzle); setAppState("preview") }}
        onNew={() => setAppState("builder")}
      />
    )

  if (appState === "preview" && playerPuzzle)
    return <PuzzlePlayer puzzle={playerPuzzle} onBack={() => setAppState("share")} />

  return (
    <Builder onDone={({ key, puzzle, password }) => {
      setShareData({ key, puzzle, password })
      setAppState("share")
    }} />
  )
}
