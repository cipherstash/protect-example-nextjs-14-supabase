import { modelToEncryptedPgComposites } from '@cipherstash/protect'
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
    // Extract email from request body
    const { email, name } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const user = {
      email,
      name,
    }

    // Encrypt the email using CipherStash Protect
    const result = await protectClient.encryptModel(user, users)

    // You will always need to handle encryption failure
    if (result.failure) {
      return res.status(500).json({ error: result.failure })
    }

    // Insert the user into the database with both plain and encrypted email
    // for example purposes.
    const { data, error } = await supabase
      .from('users')
      .insert([modelToEncryptedPgComposites(result.data)])
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error })
    }

    // Return the created user data
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error creating user:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
