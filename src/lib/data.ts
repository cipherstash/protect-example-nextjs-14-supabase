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
export async function getUsers(email?: string): Promise<DecryptedUser[]> {
  try {
    let data: EncryptedUser[] = []
    let error: Error | null = null

    if (email) {
      const searchResult = await protectClient.encrypt(email, {
        column: users.email,
        table: users,
      })

      if (searchResult.failure) {
        throw new Error(searchResult.failure.message)
      }

      // Convieniently, the encrypt method uses the withResult pattern, so the encrypted payload is already wrapped in a "data" property.
      // This is why we can pass the searchResult directly to the rpc function as Supabase requires the composite type.
      // ------------------------------------------------------------------------------------------------
      // Reference the SEARCHABLE_ENCRYPTION.md in the root of the repo for the implementation of `search_user_by_email`
      const { data: searchData, error: searchError } = await supabase.rpc(
        'search_user_by_email',
        {
          val: searchResult,
        },
      )

      data = searchData as EncryptedUser[]
      error = searchError
    } else {
      const { data: searchData, error: searchError } = await supabase
        .from('users')
        .select('id, email::jsonb, name::jsonb')

      data = searchData as EncryptedUser[]
      error = searchError
    }

    if (error) {
      throw new Error(error.message)
    }

    const encryptedUsers = data?.map((user: EncryptedUser) =>
      encryptedUserSchema.parse(user),
    )

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
