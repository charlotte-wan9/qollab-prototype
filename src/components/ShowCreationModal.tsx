import React, { useState, useRef, useCallback } from 'react'
import { X, FileText, Upload, FileUp, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ScriptBlock } from '../types'
import { DEMO_SCRIPT_BLOCKS } from '../constants'
import { extractTextFromPDF, parseTextToBlocks } from '../services/scriptParser'

interface ShowCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (title: string, scriptBlocks: ScriptBlock[]) => void
  showCount: number
}

type SourceTab = 'sample' | 'paste' | 'upload'

const SAMPLE_SCRIPTS = [
  {
    id: 'last-signal',
    name: 'The Last Signal',
    description: 'Demo musical — all block types',
    blocks: DEMO_SCRIPT_BLOCKS,
  },
]

const ShowCreationModal: React.FC<ShowCreationModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  showCount,
}) => {
  const [title, setTitle] = useState('')
  const [sourceTab, setSourceTab] = useState<SourceTab>('sample')
  const [selectedSampleId, setSelectedSampleId] = useState('last-signal')
  const [pasteText, setPasteText] = useState('')
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [uploadFileName, setUploadFileName] = useState('')
  const [uploadedText, setUploadedText] = useState('')
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setTitle('')
    setSourceTab('sample')
    setSelectedSampleId('last-signal')
    setPasteText('')
    setUploadStatus('idle')
    setUploadFileName('')
    setUploadedText('')
    setUploadError('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadFileName(file.name)
    setUploadStatus('loading')
    setUploadError('')

    try {
      let text = ''
      if (file.name.toLowerCase().endsWith('.pdf')) {
        text = await extractTextFromPDF(file)
      } else {
        text = await file.text()
      }
      setUploadedText(text)
      setUploadStatus('done')
      if (!title) {
        setTitle(file.name.replace(/\.[^.]+$/, ''))
      }
    } catch (err) {
      console.error('File upload error:', err)
      setUploadError('Failed to read file. For PDFs, make sure the file is not password-protected.')
      setUploadStatus('error')
    }
    // Reset so the same file can be re-selected
    e.target.value = ''
  }, [title])

  const handleCreate = () => {
    if (!title.trim()) return

    let blocks: ScriptBlock[]
    const showId = `show-${Date.now()}`

    if (sourceTab === 'sample') {
      const sample = SAMPLE_SCRIPTS.find((s) => s.id === selectedSampleId)
      blocks = (sample?.blocks ?? DEMO_SCRIPT_BLOCKS).map((b) => ({ ...b, showId }))
    } else {
      const rawText = sourceTab === 'paste' ? pasteText : uploadedText
      if (!rawText.trim()) return
      blocks = parseTextToBlocks(rawText, showId)
    }

    onCreate(title.trim(), blocks)
    reset()
  }

  const canCreate =
    title.trim().length > 0 &&
    (sourceTab === 'sample' ||
      (sourceTab === 'paste' && pasteText.trim().length > 0) ||
      (sourceTab === 'upload' && uploadStatus === 'done'))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Modal header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-slate-100">New Production</h2>
            <p className="text-xs text-slate-500 mt-0.5">Give it a name and load your script</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-raised transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto custom-scroll px-6 py-5 space-y-6">
          {/* Show title */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Show Title
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && canCreate) handleCreate() }}
              placeholder={`e.g., Spring Musical ${new Date().getFullYear()}`}
              className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber focus:border-amber transition-all"
            />
          </div>

          {/* Source tab selector */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Script Source
            </label>
            <div className="flex rounded-xl bg-surface border border-border overflow-hidden">
              {(['sample', 'paste', 'upload'] as SourceTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSourceTab(tab)}
                  className={`flex-1 py-2 text-xs font-semibold transition-all capitalize ${
                    sourceTab === tab
                      ? 'bg-amber text-bg'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab === 'sample' ? 'Sample' : tab === 'paste' ? 'Paste Text' : 'Upload File'}
                </button>
              ))}
            </div>

            {/* Sample scripts */}
            {sourceTab === 'sample' && (
              <div className="space-y-2">
                {SAMPLE_SCRIPTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSampleId(s.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedSampleId === s.id
                        ? 'border-amber bg-amber-muted'
                        : 'border-border bg-surface hover:border-border-strong'
                    }`}
                  >
                    <FileText
                      size={18}
                      className={selectedSampleId === s.id ? 'text-amber' : 'text-slate-600'}
                    />
                    <div>
                      <p className={`text-sm font-semibold ${selectedSampleId === s.id ? 'text-amber' : 'text-slate-200'}`}>
                        {s.name}
                      </p>
                      <p className="text-[11px] text-slate-600">{s.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Paste text */}
            {sourceTab === 'paste' && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Paste your script text. Lines starting with <code className="text-amber">Act</code> or <code className="text-amber">Scene</code> become headers; <code className="text-amber">[Location]</code> becomes a location tag; lines with <code className="text-amber">Name{'  '}dialogue</code> (2+ spaces) become character lines.
                </p>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={"Act I\nScene 1\n[The Stage]\n\nA figure stands alone in the dark.\n\nMaya  I never meant for any of this to happen."}
                  rows={9}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-xs text-slate-300 placeholder-slate-700 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber focus:border-amber transition-all custom-scroll resize-none"
                />
              </div>
            )}

            {/* File upload */}
            {sourceTab === 'upload' && (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                    uploadStatus === 'done'
                      ? 'border-approved/40 bg-approved/5'
                      : uploadStatus === 'error'
                      ? 'border-red/40 bg-red-bg'
                      : 'border-border hover:border-amber/40 hover:bg-amber-glow'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {uploadStatus === 'loading' ? (
                    <>
                      <Loader2 size={22} className="text-amber animate-spin" />
                      <p className="text-xs text-slate-400">Reading {uploadFileName}…</p>
                    </>
                  ) : uploadStatus === 'done' ? (
                    <>
                      <CheckCircle2 size={22} className="text-approved" />
                      <p className="text-xs text-slate-300 font-medium">{uploadFileName}</p>
                      <p className="text-[11px] text-slate-600">Click to replace</p>
                    </>
                  ) : uploadStatus === 'error' ? (
                    <>
                      <AlertCircle size={22} className="text-red" />
                      <p className="text-xs text-red">{uploadError}</p>
                      <p className="text-[11px] text-slate-600">Click to try again</p>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-raised border border-border flex items-center justify-center">
                        <FileUp size={18} className="text-slate-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-300">
                          Click to upload <span className="text-amber">.txt</span> or <span className="text-amber">.pdf</span>
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          PDF text will be extracted automatically
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {uploadStatus === 'done' && (
                  <div className="bg-surface border border-border rounded-xl p-3 max-h-28 overflow-y-auto custom-scroll">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Preview</p>
                    <pre className="text-[11px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap">
                      {uploadedText.slice(0, 600)}{uploadedText.length > 600 ? '\n…' : ''}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-border bg-surface/60">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="flex-[2] py-2.5 rounded-xl bg-amber hover:bg-amber-bright disabled:bg-raised disabled:text-slate-600 text-bg text-sm font-semibold transition-all active:scale-95 shadow-md shadow-amber/10 flex items-center justify-center gap-2"
          >
            Start Designing
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShowCreationModal
