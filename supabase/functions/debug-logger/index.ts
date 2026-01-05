
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id: '3491bafd-8bdb-4c71-b88f-629bd415f35b',
            email: 'lifeofak0@gmail.com',
            is_pro: true,
            subscription_status: 'debug_manual_insert',
            updated_at: new Date().toISOString()
        })
        .select()

    if (error) return new Response(JSON.stringify(error), { status: 500 })

    return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" }
    })
})
