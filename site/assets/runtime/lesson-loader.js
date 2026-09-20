// Fetch lesson Markdown by id (frontmatter + body).
// Exposes window.LiaScriptLoader.fetchLesson.
(function () {
  const BASE = '/content'

  async function fetchLesson(id) {
    const meta = await fetchMeta()
    const entry = meta.lessons.find((l) => l.id === id)
    if (!entry) {
      throw new Error('Lesson not found: ' + id)
    }
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
      metaPromise = fetch('/content/manifest.json', { cache: 'no-store' }).then((r) => {
        if (!r.ok) throw new Error('manifest fetch failed: ' + r.status)
        return r.json()
      })
    }
    return metaPromise
  }

  window.LiaScriptLoader = { fetchLesson }
})()