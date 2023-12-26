import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface NewsLetterType {
    email: string;
}

export const addUserNewsletter = async ({ email }: NewsLetterType) => {
    try {
        const { data, error } = await supabase
            .from('newsletter_subscribers')
            .insert([
                { email: email },
            ])
            .select()

        if (error) {
            return new Response('Error checking for existing user', { status: 200 });
        }

        return data;

    } catch (error) {
        return new Response('Error checking for existing user', { status: 500 });
    }
}
