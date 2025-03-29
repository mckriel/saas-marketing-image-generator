// pages/api/upload.ts
import { IncomingForm, Fields, Files } from 'formidable'
import fs from 'fs'
import { openai } from '@/lib/openai'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

const debug = process.env.DEBUG === 'TRUE'
const supabase = getSupabase();

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed')
  }

  const tmpDir = '/tmp'
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir)
  }

  const form = new IncomingForm({ uploadDir: tmpDir, keepExtensions: true })

  const data: { fields: Fields; files: Files } = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    });
  });

  const uploadedFile = Array.isArray(data.files.file) ? data.files.file[0] : undefined;

  if (!uploadedFile) {
    throw new Error('No file uploaded');
  }

  const filePath = uploadedFile.filepath;
  const fileName = uploadedFile.originalFilename;
  const imageData = fs.readFileSync(filePath);
  const base64Raw = imageData.toString('base64');
  const base64Image = `data:image/jpeg;base64,${base64Raw}`;

  if (debug) {
    console.log('[DEBUG] Upload received:', filePath);
    console.log('[DEBUG] File name:', fileName);
    console.log('[DEBUG] Base64 size:', base64Raw.length);
  }

  // Save upload metadata to Supabase
  const { data: uploadInsert, error } = await supabase.from('uploads').insert([
    {
      file_name: fileName,
      base64_data: base64Raw,
    }
  ]).select().single();

  if (error) {
    console.error('[DEBUG] Failed to insert upload:', error);
    return res.status(500).json({ error: 'Failed to log upload to Supabase' });
  }

  const uploadId = uploadInsert?.id;


  const chatRes = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'You are a product knowledge expert marketing assistant who is going to help me promote my brand or product' },
          { type: 'text', text: 'I am going to provide you with an image to analyze. I want you to tell me what product is shown in this image?' },
          { type: 'text', text: 'I want you to send me back some image prompt generation ideas for the next step in the process where I will have you generate me some viral marketing content for the specific product image I have provided. You are to ensure that the prompts you return are very detailed and crafted in such a way that the DALL·E model will provide amazingly accurate results. ' },
          { type: 'image_url', image_url: { url: base64Image } },
        ],
      },
    ],
    max_tokens: 1000,
  });

  const responseText = chatRes.choices[0]?.message?.content || 'No response.';

  if (debug) {
    console.log('[DEBUG] GPT-4o response text:', responseText.slice(0, 500));
    console.log('[DEBUG] Upload ID:', uploadId);
  }

  return res.status(200).json({ result: responseText, uploadId });
}
