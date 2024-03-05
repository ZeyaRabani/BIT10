import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface NewsLetterType {
    email: string;
}

interface WaitlistType {
    address: string;
}

interface SignUpListType {
    user_name: string;
    user_email: string;
    user_twitter?: string;
}

export const addUserNewsletter = async ({ email }: NewsLetterType) => {
    try {
        const { data, error } = await supabase
            .from('user_signups')
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

export const addUserToWaitlist = async ({ address }: WaitlistType) => {
    try {
        const { data, error } = await supabase
            .from('waitlist_address')
            .insert([
                { address: address },
            ])
            .select()

        if (error) {
            return new Response('Error checking for existing address', { status: 200 });
        }

        return data;

    } catch (error) {
        return new Response('Error checking for existing address', { status: 500 });
    }
}

export const signUpUserList = async ({ user_name, user_email, user_twitter }: SignUpListType) => {
    try {
        const { data, error } = await supabase
            .from('old_user_sign_up')
            .insert([
                {
                    user_name: user_name,
                    user_email: user_email,
                    user_twitter: user_twitter
                },
            ])
            .select()

        if (error) {
            return new Response('Error checking for existing email', { status: 200 });
        }

        return data;

    } catch (error) {
        return new Response('Error checking for existing email', { status: 500 });
    }
}
