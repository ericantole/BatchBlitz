
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Dodo Webhook Listener v2 Running!")

serve(async (req) => {
    try {
        const payload = await req.json()
        console.log("PAYLOAD RECEIVED:", JSON.stringify(payload))

        const eventType = payload.type
        const customerEmail = payload.data?.customer?.email

        // Common Metadata Search (Function)
        // Common Metadata Search (Function)
        const findUserId = async (data: any, supabaseAdmin: any) => {
            let userId = data.metadata?.user_id || data.metadata?.['user_id']

            if (userId) return userId

            if (customerEmail) {
                console.log("Metadata missing, searching by Email:", customerEmail)
                const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

                if (listError) {
                    console.error("List Users Error:", listError)
                    return null
                }

                // CASE INSENSITIVE MATCH
                const user = users?.users.find((u: any) => u.email?.toLowerCase() === customerEmail.toLowerCase())
                if (user) {
                    console.log("Found user by email (case-insensitive):", user.email)
                    return user.id
                }
            }
            return null
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. LOG TO DATABASE (Audit Trail)
        const { error: logError } = await supabaseAdmin.from('payment_events').insert({
            event_type: eventType,
            payload: payload,
            provider_payment_id: payload.data.payment_id,
            amount: payload.data.amount,
            currency: payload.data.currency
        })

        if (logError) console.error("Failed to log event:", logError)

        // HANDLE SUCCESS
        if (eventType === 'payment.succeeded' || eventType === 'subscription.active') {
            const userId = await findUserId(payload.data, supabaseAdmin)

            // Update the log with the finding
            if (userId) {
                await supabaseAdmin.from('payment_events').update({ user_id: userId }).eq('provider_payment_id', payload.data.payment_id)
            }

            if (!userId) throw new Error("No User ID found for Success Event")

            // UPSERT checks if row exists: Updates it.
            // If not, Creates it. (Prevents "Silent Failure" on missing profiles)
            const { error, data: upsertData } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: userId,
                    email: customerEmail, // Ensure email is stamped
                    is_pro: true,
                    subscription_status: 'active',
                    updated_at: new Date().toISOString()
                })
                .select()

            console.log(`SUCCESS: User ${userId} upgraded. Rows affected: ${upsertData?.length}`)
        }

        // HANDLE FAILURE / CANCELLATION
        else if (eventType === 'payment.failed' || eventType === 'subscription.payment_failed' || eventType === 'subscription.cancelled') {
            const userId = await findUserId(payload.data, supabaseAdmin)
            if (userId) {
                await supabaseAdmin.from('profiles').update({
                    is_pro: false,
                    subscription_status: 'past_due', // or 'cancelled'
                    updated_at: new Date().toISOString()
                }).eq('id', userId)
                console.log(`DOWNGRADE: User ${userId} set to free/past_due.`)
            } else {
                console.log("Could not find user to downgrade (might not verify email on failure).")
            }
        }

        // HANDLE PROCESSING
        else if (eventType === 'payment.processing') {
            console.log("Payment is processing...")
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })

    } catch (err) {
        console.error("Webhook Error:", err)
        return new Response(`Error: ${err.message}`, { status: 400 })
    }
})
