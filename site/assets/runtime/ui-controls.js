// Wires Run / Check / Hint / Show Answer buttons.
// window.UIControls.bind({lesson, getCode, onPass})

(function () {
  function el(tag, props, children) {
    const e = document.createElement(tag)
    if (props) Object.assign(e, props)
    for (const c of children || []) e.appendChild(c)
    return e
  }

  function bind({ lesson, getCode, onPass }) {
    const root = document.getElementById('lesson-controls')
    root.innerHTML = ''
    const out = el('pre', { id: 'output', className: 'lesson-output' })
    const hintBox = el('div', { id: 'hints', className: 'lesson-hints' })
    const answerBox = el('pre', { id: 'answer', className: 'lesson-answer', hidden: true })

    let hintIdx = 0
    const hints = lesson.hints || []

    const runBtn = el('button', { type: 'button', textContent: 'Run' })
    runBtn.onclick = async () => {
      out.textContent = 'Running…'
      const r = await window.runCode(getCode())
      const parts = []
      if (r.stdout) parts.push(r.stdout)
      if (r.stderr) parts.push('[stderr] ' + r.stderr)
      if (r.error) parts.push('[error] ' + r.error)
      out.textContent = parts.join('\n') || '(no output)'
    }

    const checkBtn = el('button', { type: 'button', textContent: 'Check' })
    checkBtn.onclick = async () => {
      out.textContent = 'Checking…'
      const r = await window.CheckRunner.runChecks(getCode(), lesson.checks || [])
      if (r.passed) {
        out.textContent = '✓ All checks passed!'
        if (onPass) onPass()
      } else {
        out.textContent = '✗ Failed:\n' + r.errors.join('\n')
      }
    }

    const hintBtn = el('button', { type: 'button', textContent: 'Hint' })
    hintBtn.onclick = () => {
      if (hintIdx >= hints.length) {
        hintBox.textContent = 'No more hints.'
        return
      }
      const h = hints[hintIdx++]
      hintBox.textContent = 'Hint ' + hintIdx + '/' + hints.length + ': ' + (h.en || h.zh || '')
    }

    const answerBtn = el('button', { type: 'button', textContent: 'Show Answer' })
    answerBtn.onclick = () => {
      answerBox.hidden = !answerBox.hidden
      answerBox.textContent = lesson.solution || ''
      answerBtn.textContent = answerBox.hidden ? 'Show Answer' : 'Hide Answer'
    }

    root.append(runBtn, checkBtn, hintBtn, answerBtn, out, hintBox, answerBox)
  }

  window.UIControls = { bind }
})()