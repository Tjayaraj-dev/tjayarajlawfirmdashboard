#!/usr/bin/env bash
# Seeds local-only auth users for development. NOT for production.
# Re-run after `supabase db reset` (which wipes auth.users).
#   ./scripts/seed-dev-users.sh
set -euo pipefail

API_URL="$(supabase status -o env | grep '^API_URL' | cut -d= -f2- | tr -d '"')"
ANON_KEY="$(supabase status -o env | grep '^ANON_KEY' | cut -d= -f2- | tr -d '"')"
SERVICE_KEY="$(supabase status -o env | grep '^SERVICE_ROLE_KEY' | cut -d= -f2- | tr -d '"')"

# Use the public signup endpoint (anon key). Local auth has email confirmations
# disabled, so accounts are usable immediately. The handle_new_user trigger
# creates each profile as 'staff'.
create_user() {
  local email="$1" name="$2"
  curl -s "${API_URL}/auth/v1/signup" \
    -H "apikey: ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"demo1234\",\"data\":{\"full_name\":\"${name}\"}}" \
    > /dev/null
  echo "  seeded ${email}"
}

echo "Seeding dev users (password: demo1234)..."
create_user "admin@jayarajco.com" "T. Jayaraj"
create_user "staff@jayarajco.com" "Priya Kumar"

# The handle_new_user trigger creates each profile as 'staff'. Promote the admin
# via PostgREST (service role bypasses RLS).
curl -s "${API_URL}/rest/v1/profiles?email=eq.admin@jayarajco.com" -X PATCH \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"role":"admin"}' > /dev/null
echo "  promoted admin@jayarajco.com to admin"
echo "Done."
