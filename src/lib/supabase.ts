import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null

export function edgeFunctionUrl(name: string): string {
  if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL')
  return `${supabaseUrl}/functions/v1/${name}`
}

export function edgeFunctionHeaders(): HeadersInit {
  if (!supabaseAnonKey) return {}
  return { Authorization: `Bearer ${supabaseAnonKey}` }
}
