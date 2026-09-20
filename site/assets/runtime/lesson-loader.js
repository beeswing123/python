// Load lessons by id.
// Exposes window.LiaScriptLoader:
//   getLesson(id)   -> manifest entry, metadata already parsed by the build
//   fetchLesson(id) -> lesson Markdown text (frontmatter + body)
(function () {
  // Document-relative: GitHub Pages serves this as a project site under
  // /python/, so a leading slash would resolve to the domain root and 404.
  const BASE = 'content'

  // The manifest entry carries the lesson's parsed frontmatter (title,
  // starter_code, hints, checks, ...); the browser never parses YAML itself.
  async function getLesson(id) {
    const meta = await fetchMeta()
    const entry = meta.lessons.find((l) => l.id === id)
    if (!entry) {
      throw new Error('Lesson not found: ' + id)
    }
    return entry
  }

  async function fetchLesson(id) {
    const entry = await getLesson(id)
    const url = BASE + '/' + entry.chapter_dir + '/' + entry.file
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error('Failed to load ' + url + ': ' + res.status)
    }
    return await res.text()
  }

  let metaPromise = null
  function fetchMeta() {
    if (!metaPromise) {
      metaPromise = fetch('content/manifest.json', { cache: 'no-store' }).then((r) => {
        if (!r.ok) throw new Error('manifest fetch failed: ' + r.status)
        return r.json()
      })
    }
    return metaPromise
  }

  window.LiaScriptLoader = { getLesson, fetchLesson }
})()