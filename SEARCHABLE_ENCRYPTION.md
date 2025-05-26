# Searching Encrypted Data with Supabase SDK

When working with encrypted data in Supabase, there are some important considerations to keep in mind, particularly around composite types and custom types with the EQL v2 extension.

> [!NOTE]
> The following assumes you have installed the [latest version of the EQL v2 extension](https://github.com/cipherstash/encrypt-query-language/releases).
> You can also install the extension using the [dbdev](https://database.dev/cipherstash/eql) tool.

## Challenges with Supabase SDK

The Supabase SDK has limitations when working with composite types and custom types. For example, the following approach using the standard `.eq()` function will not work:

```typescript
const { data, error } = await supabase
  .from('users')
  .select('id, email::jsonb, name::jsonb')
  .eq('email', value); // where value is an EQL payload
```

## Solution: Custom Postgres Function (using exact match)

To work around these limitations, you'll need to:

1. Go to your Supabase project's [API settings](https://supabase.com/dashboard/project/_/settings/api) and add `eql_v2` schema to "Exposed schemas".

2. [Grant necessary privileges](https://supabase.com/docs/guides/api/using-custom-schemas) to the required roles:
```sql
GRANT USAGE ON SCHEMA eql_v2 TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA eql_v2 TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA eql_v2 TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA eql_v2 TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA eql_v2 GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA eql_v2 GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA eql_v2 GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
```

3. Create a custom return type to handle composite type casting:
```sql
CREATE TYPE user_with_json_fields AS (
  id integer,
  email jsonb,
  name jsonb
);
```

4. Create a custom Postgres function:
```sql
CREATE OR REPLACE FUNCTION search_user_by_email(val eql_v2_encrypted)
RETURNS SETOF user_with_json_fields AS $$
  SELECT id, email::jsonb, name::jsonb FROM users WHERE email = val;
$$ LANGUAGE sql;
```

5. Use the function via Supabase SDK's RPC method:
```typescript
// First, encrypt the search value
const searchResult = await protectClient.encrypt('billy@example.com', {
  column: users.email,
  table: users,
})

if (searchResult.failure) {
  throw new Error(searchResult.failure.message)
}

// Use the RPC method to call the custom function
const { data, error } = await supabase.rpc('search_user_by_email', {
  val: searchResult,
})
```

Note: The `encrypt` method uses the withResult pattern, so the encrypted payload is already wrapped in a "data" property, making it compatible with Supabase's RPC requirements for composite type structures.