import { createClient } from '@/lib/supabase/server'

export async function fetchReportWebhookUrl(): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('report_settings').select('webhook_url').eq('id', 1).maybeSingle()

  if (error) throw error

  return data?.webhook_url ?? null
}
