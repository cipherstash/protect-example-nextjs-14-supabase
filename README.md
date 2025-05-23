# Next.js 14 (Pages Router) with Protect.js and Supabase Example

This is an example application that demonstrates how to use [CipherStash Protect.js](https://github.com/cipherstash/protectjs) for data protection in a Next.js 14.x application, which uses the `pages` router, and a Supabase integration. The application showcases how to encrypt sensitive data before storing it in Supabase and decrypt it when retrieving.

## Features

- Next.js 14 with Pages Router
- CipherStash Protect.js for data encryption/decryption
- Supabase JS SDK for database operations
- TypeScript support
- TailwindCSS for styling
- Zod for runtime type validation

## Key Implementation Details

### Data Protection

The application uses Protect.js to encrypt sensitive user data (email addresses) before storing them in Supabase. The encryption/decryption process happens on the server side to ensure security. Key features include:

- Server-side decryption using `getServerSideProps`
- Type-safe data handling with Zod schemas
- Bulk decryption of encrypted data
- Secure API routes for data insertion

### Implementation Requirements

When implementing Protect.js in your own application, there are several key requirements to note:

1. **Server-Side Data Handling**

   - All encryption/decryption must be performed server-side
   - Use `getServerSideProps` for fetching and decrypting data ([example in `src/pages/index.tsx`](src/pages/index.tsx))
   - Create API routes for handling data insertion with encryption ([example in `src/pages/api/users.ts`](src/pages/api/users.ts))

2. **Type Safety**

   - Implement Zod schemas to validate encrypted and decrypted data ([example in `src/lib/data.ts`](src/lib/data.ts))
   - Define separate schemas for encrypted and decrypted data structures
   - Use TypeScript types to ensure type safety throughout the application

3. **Database Integration**

   - Store both plaintext and encrypted versions of sensitive data
   - Use bulk decryption for efficient data retrieval ([example in `src/lib/data.ts`](src/lib/data.ts))
   - Implement proper error handling for encryption/decryption operations

4. **Security Best Practices**
   - Never expose encryption/decryption logic to the client
   - Use API routes for all data modification operations ([example in `src/pages/api/users.ts`](src/pages/api/users.ts))
   - Implement proper error handling and validation

### Database Integration

The application uses Supabase as its database backend:

- Secure data storage with encrypted fields
- Type-safe database operations

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   CS_CLIENT_ID=
   CS_CLIENT_KEY=
   CS_CLIENT_ACCESS_KEY=
   CS_WORKSPACE_CRN=
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `/src/pages` - Next.js pages and API routes
- `/src/lib` - Utility functions and database operations
- `/src/protect` - Protect.js configuration

## Security Considerations

- All encryption/decryption operations are performed server-side
- Sensitive data is never exposed to unauthenticated clients in plaintext
- API routes are used to handle data insertion with encryption
- Type validation ensures data integrity

## Learn More

- [CipherStash Protect.js Documentation](https://github.com/cipherstash/protectjs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
