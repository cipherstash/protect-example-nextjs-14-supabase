import type { NextApiRequest, NextApiResponse } from 'next'
import { users } from '@/protect/schema'
import { protectClient } from '@/protect'
import { supabase } from '@/lib/supabase'

// CS_NOTE
// In order to handle data that is created on the client side, we need to leverage the Next.js API route
// This logic is executed on the server side and is required when using CipherStash Protect to encrypt the data
// before inserting it into the database.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const result = await protectClient.encrypt(email, {
      table: users,
      column: users.email_encrypted,
    })

    if (result.failure) {
      return res.status(500).json({ error: result.failure })
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{ email, email_encrypted: result.data }])
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error })
    }

    return res.status(201).json(data)
  } catch (error) {
    console.error('Error creating user:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
