
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Dodo Webhook Listener Running!")

serve(async (req) => {
    try {
        // 1. Parse the incoming JSON payload from Dodo
        const payload = await req.json()
        console.log("Received Webhook:", payload.type)

        // 2. We only care about successful payments
        if (payload.type === 'payment.succeeded') {

            // 3. Extract User ID from the metadata we sent in Checkout.tsx
            const userId = payload.data.metadata?.user_id

            if (!userId) {
                console.error("No user_id found in metadata")
                return new Response("Error: No user_id in metadata", { status: 400 })
            }

            console.log(`Upgrading User: ${userId}`)

            // 4. Initialize Supabase Admin Client
            // WE NEED THE SERVICE_ROLE_KEY TO BYPASS RLS (Row Level Security)
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // 5. Update the User's Profile to PRO
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({
                    is_pro: true,
                    subscription_status: 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)

            if (error) {
                console.error("Database Update Failed:", error)
                return new Response("Database Error", { status: 500 })
            }

            console.log("User Upgraded Successfully!")
        }

        // Always return 200 OK to Dodo so they stop retrying
        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })

    } catch (err) {
        console.error("Webhook Error:", err)
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }
})
