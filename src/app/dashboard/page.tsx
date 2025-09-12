import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardClient } from '@/components/DashboardClient';
import { PaymentGateWrapper } from '@/components/PaymentGateWrapper';

export default async function Dashboard() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <PaymentGateWrapper>
      <DashboardClient />
    </PaymentGateWrapper>
  );
}