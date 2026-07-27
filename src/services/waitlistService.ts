import { supabase } from '@/lib/supabase';

export type WaitlistSignupInput = {
  email: string;
  fullName?: string;
  companyName?: string;
  role?: string;
};

export const waitlistService = {
  async join(input: WaitlistSignupInput) {
    const payload = {
      email: input.email.trim().toLowerCase(),
      full_name: input.fullName?.trim() || null,
      company_name: input.companyName?.trim() || null,
      role: input.role?.trim() || null,
    };

    const { error } = await supabase.from('waitlist_signups').insert(payload);

    if (!error) return { status: 'joined' as const };

    if ((error as { code?: string }).code === '23505') {
      return { status: 'already_joined' as const };
    }

    throw error;
  },
};
