import { csColumn, csTable } from '@cipherstash/protect'

export const users = csTable('users', {
  email: csColumn('email').equality().freeTextSearch().orderAndRange(),
  name: csColumn('name').equality().freeTextSearch().orderAndRange(),
})
