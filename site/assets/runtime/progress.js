(function () {
  const KEY = 'py-tutorial:v1'

  function empty() {
    return { version: 1, language: 'en', done: [], current: null, code: {}, updated: null }
  }

  // Coerce a parsed object to the expected shape. Anything unrecognised in
  // localStorage or in an imported file is repaired here rather than trusted,
  // because a wrong-shaped object would otherwise persist and break every
  // later read (markDone would throw on an undefined `done`).
  function normalize(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return empty()
    if (obj.version !== 1) return empty()
    const s = empty()
    s.done = Array.isArray(obj.done) ? obj.done : []
    s.code = obj.code && typeof obj.code === 'object' && !Array.isArray(obj.code) ? obj.code : {}
    s.language = typeof obj.language === 'string' ? obj.language : 'en'
    s.current = typeof obj.current === 'string' ? obj.current : null
    s.updated = typeof obj.updated === 'string' ? obj.updated : null
    return s
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return empty()
      return normalize(JSON.parse(raw))
    } catch {
      return empty()
    }
  }

  function save(s) {
    s.updated = new Date().toISOString()
    localStorage.setItem(KEY, JSON.stringify(s))
  }

  function markDone(id) {
    const s = load()
    if (!s.done.includes(id)) s.done.push(id)
    save(s)
  }

  function getDone() { return load().done }

  function setCode(id, code) {
    const s = load(); s.code[id] = code; save(s)
  }
  function getCode(id) { return load().code[id] || '' }

  function setCurrent(id) {
    const s = load(); s.current = id; save(s)
  }
  function getCurrent() { return load().current }

  function setLanguage(lang) {
    const s = load(); s.language = lang; save(s)
  }
  function getLanguage() { return load().language || 'en' }

  function exportJSON() {
    const data = load()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'py-tutorial-progress.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    // iOS Safari shows a confirmation sheet and only fetches the blob after the
    // user taps it, so revoking now would race the download. FileSaver.js defers
    // by 40s for the same reason.
    setTimeout(() => URL.revokeObjectURL(url), 40000)
  }

  async function importJSON(file) {
    const text = await file.text()
    const obj = JSON.parse(text)
    if (!obj || typeof obj !== 'object' || obj.version !== 1) {
      throw new Error('Unsupported progress version: ' + (obj && obj.version))
    }
    // Normalise before saving so a wrong-shaped file cannot be persisted.
    const s = normalize(obj)
    save(s)
    return s
  }

  window.Progress = { markDone, getDone, setCode, getCode, setCurrent, getCurrent, setLanguage, getLanguage, exportJSON, importJSON }
})()
