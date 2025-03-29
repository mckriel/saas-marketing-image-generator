// pages/api/generate.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { openai } from '@/lib/openai'
import { supabase } from '@/lib/supabase'

const debug = process.env.DEBUG === 'TRUE'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const { prompt, upload_id } = req.body

  if (debug) {
    console.log('[DEBUG] Incoming request body:', req.body)
  }
  
  if (!prompt || !upload_id || typeof upload_id !== 'string') {
    console.error('[ERROR] Missing or invalid upload_id')
    return res.status(400).json({ error: 'Prompt and valid upload_id are required' })
  }

  try {
    const response = await openai.images.generate({
      prompt,
      n: 1,
      size: '1024x1024'
    })

    const imageUrls = response.data.map(img => img.url)

    if (debug) {
      console.log('[DEBUG] DALL·E image URLs:', imageUrls)
    }

    await supabase.from('generations').insert([
        {
          upload_id,
          prompt,
          image_urls: imageUrls
        }
    ]);

    return res.status(200).json({ images: imageUrls })
  } catch (err: any) {
    console.error('OpenAI error:', err)
    return res.status(500).json({ error: 'Failed to generate image' })
  }
}