
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://egzzbgqoyptdkkwzttky.supabase.co'
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY")
    Deno.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    const { data, error } = await supabase
        .from('payment_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

    if (error) {
        console.error("Error fetching events:", error)
        return
    }

    if (!data || data.length === 0) {
        console.log("No events found.")
        return
    }

    const event = data[0]
    console.log("=== LATEST EVENT ===")
    console.log("ID:", event.id)
    console.log("Created At:", event.created_at)
    console.log("Event Type:", event.event_type)
    console.log("PAYLOAD JSON:")
    console.log(JSON.stringify(event.payload, null, 2))
}

main()
