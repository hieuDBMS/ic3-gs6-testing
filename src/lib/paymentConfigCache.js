import { supabase } from './supabase';

/* ─────────────────────────────────────────────────────────
   Module-level payment config cache
   Fetched once per browser session — never re-fetched on
   every PaymentModal open. Saves ~200-400ms each time.
   Split into its own module (rather than living inside
   PaymentModal.jsx) so PaymentSettingsPage can invalidate it
   without violating the "one file = one component" fast-refresh rule.
───────────────────────────────────────────────────────── */
let _configCache    = null;
let _configFetching = null; // in-flight dedup

// Called by PaymentSettingsPage after a teacher saves new bank info — without
// this, any tab that already opened a PaymentModal this session keeps showing
// the OLD bank account/QR for the rest of the SPA session (module cache never
// expires on its own), which can route a student's transfer to a stale account.
export function invalidatePaymentConfigCache() {
  _configCache = null;
  _configFetching = null;
}

export async function getPaymentConfig() {
  // Already cached
  if (_configCache !== null) return _configCache;
  // Deduplicate concurrent calls
  if (_configFetching) return _configFetching;
  _configFetching = supabase
    .from('payment_config')
    .select('*')
    .eq('id', 1)
    .single()
    .then(({ data }) => {
      _configCache    = data ?? {};   // store empty obj so truthiness works
      _configFetching = null;
      return _configCache;
    })
    .catch(() => {
      _configFetching = null;         // allow retry on error
      return {};
    });
  return _configFetching;
}
