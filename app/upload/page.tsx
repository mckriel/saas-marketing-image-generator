// app/upload/page.tsx
'use client'
import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [aiResponse, setAIResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [uploadId, setUploadId] = useState<string | null>(null)


  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const result = await res.json()
    setAIResponse(result.result)
    setUploadId(result.uploadId)
    setLoading(false)
  }

  const handleGenerate = async (prompt: string) => {
    setSelectedPrompt(prompt)
    setLoading(true)
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, upload_id: uploadId })
    })
    const result = await res.json()
    setGeneratedImages(result.images || [])
    setLoading(false)
  }

  const extractPrompts = (text: string) => {
    return text
      .split(/\n|\d+\./)
      .map(line => line.trim())
      .filter(line => line.length > 10)
  }

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    link.setAttribute('target', '_blank') // fallback if download fails
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Upload Your Product Image</h1>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mb-4" />
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        onClick={handleUpload}
        disabled={!file || loading}
      >
        {loading ? 'Analyzing...' : 'Upload & Analyze'}
      </button>

      {aiResponse && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Suggested Prompts:</h2>
          <div className="flex flex-col gap-2">
            {extractPrompts(aiResponse).map((prompt, idx) => (
              <button
                key={idx}
                className="px-4 py-2 border rounded hover:bg-gray-100 text-left"
                onClick={() => handleGenerate(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedPrompt && <p className="mt-6 italic">Generating image for: "{selectedPrompt}"</p>}

      {generatedImages.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {generatedImages.map((url, idx) => (
            <div key={idx} className="border rounded p-2">
            <img src={url} alt={`Generated ${idx}`} className="w-full rounded mb-2" />
            <button
              onClick={() => handleDownload(url, `promo-image-${idx + 1}.png`)}
              className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Download
            </button>
          </div>
          ))}
        </div>
      )}
    </div>
  )
}
