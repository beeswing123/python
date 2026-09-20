(function () {
  const KEY = 'py-tutorial:v1'

  function empty() {
    return { version: 1, language: 'en', done: [], current: null, code: {}, updated: null }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return empty()
      const obj = JSON.parse(raw)
      if (obj.version !== 1) return empty()
      return obj
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
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importJSON(file) {
    const text = await file.text()
    const obj = JSON.parse(text)
    if (obj.version !== 1) throw new Error('Unsupported progress version: ' + obj.version)
    save(obj)
    return obj
  }

  window.Progress = { markDone, getDone, setCode, getCode, setCurrent, getCurrent, setLanguage, getLanguage, exportJSON, importJSON }
})()
