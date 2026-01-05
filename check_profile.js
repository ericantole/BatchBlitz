
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://egzzbgqoyptdkkwzttky.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_USER_ID = '3491bafd-8bdb-4c71-b88f-629bd415f35b'; // From your logs

async function main() {
    console.log(`Checking Profile for User: ${TARGET_USER_ID}...`);

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', TARGET_USER_ID);

    if (error) {
        console.error("Error fetching profile:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("❌ PROFILE NOT FOUND. The row does not exist.");
    } else {
        const profile = data[0];
        console.log("✅ PROFILE FOUND:");
        console.log(`   Email: ${profile.email}`);
        console.log(`   Is Pro: ${profile.is_pro}  <-- CHECK THIS`);
        console.log(`   Status: ${profile.subscription_status}`);
        console.log(`   Updated: ${profile.updated_at}`);
    }
}

main();
