import { protectClient } from '@/protect'
import { supabase } from './supabase'
import { z } from 'zod'
import type { EncryptedPayload } from '@cipherstash/protect'
import { users } from '@/protect/schema'

const encryptedUserSchema = z.object({
  id: z.number(),
  email: z.custom<EncryptedPayload>(),
  name: z.custom<EncryptedPayload>(),
})

const decryptedUserSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
})

export type EncryptedUser = z.infer<typeof encryptedUserSchema>
export type DecryptedUser = z.infer<typeof decryptedUserSchema>

function toSupabaseLikeString(obj) {
  // Step 1: JSON.stringify and escape inner quotes
  const json = JSON.stringify(obj)
  // Step 2: wrap in parentheses and double quotes, escaping " as \"
  const escaped = '("' + json.replace(/"/g, '\\"') + '")'
  return escaped
}

// CS_NOTE
// This function is used to fetch the users from the database, decrypt them, and return them as an array of DecryptedUser objects.
// Here we are using the zod schema to validate the correct types of the data that is being returned from the database,
// and what will be returned to the client component after decrypting the data.
//
// Using a schema parser is optional, but it is recommended to maintain type safety.
export async function getUsers(email?: string): Promise<DecryptedUser[]> {
  try {
    let query = supabase.from('users').select('id, email::jsonb, name::jsonb')

    if (email) {
      const searchResult = await protectClient.encrypt('cj@example.com', {
        column: users.email,
        table: users,
      })

      if (searchResult.failure) {
        throw new Error(searchResult.failure.message)
      }

      const searchTerm = `${JSON.stringify(`(${JSON.stringify(JSON.stringify(searchResult.data))})`)}`
      // const searchTerm = toSupabaseLikeString(searchResult.data)

      // Equality example
      // query = query.eq(
      //   'email',
      //   searchTerm,
      // )

      const searchResult2 = await protectClient.encrypt('John', {
        column: users.name,
        table: users,
      })

      if (searchResult2.failure) {
        throw new Error(searchResult2.failure.message)
      }

      const searchTerm2 = `${JSON.stringify(`(${JSON.stringify(JSON.stringify(searchResult2.data))})`)}`
      // const searchTerm2 = toSupabaseLikeString(searchResult2.data)

      // query = query.filter('name', 'in', `(${searchTerm2},${searchTerm})`)
      query = query.or(`email.ilike.${searchTerm}, name.ilike.${searchTerm2}`)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    const encryptedUsers = data?.map((user) => encryptedUserSchema.parse(user))
    const result =
      await protectClient.bulkDecryptModels<EncryptedUser>(encryptedUsers)

    if (result.failure) {
      throw new Error(result.failure.message)
    }

    return result.data.map((user) => decryptedUserSchema.parse(user))
  } catch (error) {
    console.error('Database error:', error)
    return []
  }
}
