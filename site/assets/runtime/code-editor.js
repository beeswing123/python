import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'

function createEditor(parent, initial) {
  const state = EditorState.create({
    doc: initial || '',
    extensions: [
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
    ],
  })
  return new EditorView({ state, parent })
}

export { createEditor }
