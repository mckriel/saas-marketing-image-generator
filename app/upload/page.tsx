// app/upload/page.tsx
'use client'
import { useState } from 'react'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)

  const handleUpload = async () => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const result = await res.json()
    console.log(result)
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Upload Your Product</h1>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={handleUpload}>Upload</button>
    </div>
  )
}
