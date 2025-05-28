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

// CS_NOTE
// This function is used to fetch the users from the database, decrypt them, and return them as an array of DecryptedUser objects.
// Here we are using the zod schema to validate the correct types of the data that is being returned from the database,
// and what will be returned to the client component after decrypting the data.
//
// Using a schema parser is optional, but it is recommended to maintain type safety.
export async function getUsers(
  email?: string,
  name?: string,
): Promise<DecryptedUser[]> {
  try {
    let query = supabase.from('users').select('id, email::jsonb, name::jsonb')

    if (email && name) {
      const searchTermResult = await protectClient.createSearchTerms([
        {
          value: email,
          column: users.email,
          table: users,
          returnType: 'escaped-composite-literal',
        },
        {
          value: name,
          column: users.name,
          table: users,
          returnType: 'escaped-composite-literal',
        },
      ])

      if (searchTermResult.failure) {
        throw new Error(searchTermResult.failure.message)
      }

      // query = query.filter('name', 'in', `(${searchTerm2},${searchTerm})`)
      query = query.or(
        `email.ilike.${searchTermResult.data[0]}, name.ilike.${searchTermResult.data[1]}`,
      )
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
