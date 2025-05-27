# Searching Encrypted Data with Supabase SDK

When working with encrypted data in Supabase, you can use the standard Supabase SDK methods by properly formatting the encrypted payload as a string.

> [!NOTE]
> The following assumes you have installed the [latest version of the EQL v2 extension](https://github.com/cipherstash/encrypt-query-language/releases).
> You can also install the extension using the [dbdev](https://database.dev/cipherstash/eql) tool.

## Converting Encrypted Search Terms

When searching encrypted data, you need to convert the encrypted payload into a format that PostgreSQL and the Supabase SDK can understand. The encrypted payload needs to be converted to a raw composite type format by double stringifying the JSON:

```typescript
const searchResult = await protectClient.encrypt('billy@example.com', {
  column: users.email,
  table: users,
})

const searchTerm = `(${JSON.stringify(JSON.stringify(searchResult.data))})`
```

## Query Examples

Here are examples of different ways to search encrypted data using the Supabase SDK:

### Equality Search

```typescript
const { data, error } = await supabase
  .from('users')
  .select('id, email::jsonb, name::jsonb')
  .eq('email', searchTerm)
```

### Pattern Matching Search

```typescript
const { data, error } = await supabase
  .from('users')
  .select('id, email::jsonb, name::jsonb')
  .like('email', searchTerm)
```

## Conclusion

The key is in the string formatting of the encrypted payload: `(${JSON.stringify(JSON.stringify(searchTerm))})`. This ensures the encrypted data is properly formatted for comparison in the database using the EQL custom type. You can use this pattern with any of Supabase's query methods like `.eq()`, `.like()`, `.ilike()`, etc.