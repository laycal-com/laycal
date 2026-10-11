import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { authFormAppearance } from "@/lib/clerkAppearance";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AuthShell
      eyebrow="Log in"
      title="Welcome back."
      description="Sign in to see your calls, booked visits and assistants."
    >
      <SignIn appearance={authFormAppearance} />
    </AuthShell>
  );
}
