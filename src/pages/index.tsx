import { getUsers } from '../lib/data'
import type { GetServerSideProps } from 'next'
import { useState } from 'react'
import type { DecryptedUser } from '../lib/data'

// CS_NOTE
// getServerSideProps is used to fetch the users from the database, decrypt them, and pass them to the client component as props
// This logic is executed on the server side and is required when using CipherStash Protect.
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const users = await getUsers()

    return {
      props: {
        users,
      },
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return {
      props: {
        users: [],
      },
    }
  }
}

interface HomeProps {
  users: DecryptedUser[]
}

export default function Home({ users: initialUsers }: HomeProps) {
  const [users, setUsers] = useState(initialUsers)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // CS_NOTE
      // In order to use CipherStash Protect to encrypt the users before inserting them into the database,
      // we need to leverage the Next.js API route to create the user as that logic will be executed on the server side.
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      const newUser = await response.json()
      setUsers([...users, newUser])
      setEmail('')
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="py-24">
      <div className="w-full max-w-2xl space-y-8 mx-auto">
        <div>
          <h2 className="text-xl font-bold mb-4">Add User</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 mb-2"
                required
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add User'}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </form>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Users</h2>
          {users.length > 0 ? (
            <ul className="space-y-2">
              {users.map((user) => (
                <li
                  key={user.id}
                  className="p-4 bg-black/[.05] dark:bg-white/[.06] rounded"
                >
                  <pre className="font-[family-name:var(--font-geist-mono)] text-sm w-full whitespace-pre-wrap">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No users found</p>
          )}
        </div>
      </div>
    </div>
  )
}
