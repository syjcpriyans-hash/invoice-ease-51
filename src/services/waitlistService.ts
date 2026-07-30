export type WaitlistSignupInput = {
  email: string;
  fullName?: string;
  companyName?: string;
  role?: string;
};

type WaitlistResult = {
  status: "joined" | "already_joined";
  error?: string;
};

export const waitlistService = {
  async join(
    input: WaitlistSignupInput,
    turnstileToken: string,
  ) {
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        fullName: input.fullName?.trim() || "",
        companyName: input.companyName?.trim() || "",
        role: input.role?.trim() || "",
        turnstileToken,
      }),
    });

    const payload =
      (await response.json().catch(() => ({}))) as
        WaitlistResult;

    if (!response.ok) {
      throw new Error(
        payload.error ||
          "Could not submit the early-access request.",
      );
    }

    return {
      status: payload.status,
    };
  },
};
