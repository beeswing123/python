import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'

// `onChange`, when given, is called with the full document text after every
// change. The page uses it to persist the learner's work.
function createEditor(parent, initial, onChange) {
  const extensions = [
    lineNumbers(),
    highlightActiveLine(),
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    python(),
    EditorView.theme({
      '&': { fontSize: '16px' },
      '.cm-scroller': { fontFamily: 'ui-monospace, monospace' },
    }),
    EditorView.lineWrapping,
  ]
  if (onChange) {
    extensions.push(
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onChange(update.state.doc.toString())
      }),
    )
  }
  const state = EditorState.create({ doc: initial || '', extensions })
  return new EditorView({ state, parent })
}

export { createEditor }
