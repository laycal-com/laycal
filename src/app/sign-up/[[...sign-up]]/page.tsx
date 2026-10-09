import { SignUp } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/auth-shell";
import { authFormAppearance } from "@/lib/clerkAppearance";

/**
 * Invitation landing page. Access is invite-only: this route is never linked
 * publicly, but Clerk invitation emails send people here with a ticket, so it
 * has to stay mounted.
 */
export default function Page() {
  return (
    <AuthShell
      eyebrow="Invitation"
      title="Accept your invitation."
      description="Set up your Laycal account with the email address your invite was sent to."
    >
      <SignUp appearance={authFormAppearance} />
    </AuthShell>
  );
}
