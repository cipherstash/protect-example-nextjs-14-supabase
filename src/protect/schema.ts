import { csColumn, csTable } from '@cipherstash/protect'

export const users = csTable('users', {
  email_encrypted: csColumn('email_encrypted').equality(),
})
