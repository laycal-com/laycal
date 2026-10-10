'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface AccountSummary {
  account: {
    id: string;
    name: string;
    email: string;
    industry: string;
    phone: string;
    timezone: string;
    website: string;
    onboarded: boolean;
  };
  billing: {
    balance: number;
    ratePerMinute: number;
    nextAssistantFee: number;
    assistantFee: number;
    minimumTopup: number;
  };
  setup: { assistant: boolean; credits: boolean; calendar: boolean; dismissed: boolean };
}

type State =
  | { status: 'loading'; data: null }
  | { status: 'ready'; data: AccountSummary }
  | { status: 'suspended'; data: null }
  | { status: 'error'; data: null };

const AccountContext = createContext<State & { refresh: () => Promise<void> }>({
  status: 'loading',
  data: null,
  refresh: async () => {},
});

/** The signed-in account, loaded once by the portal shell and shared with every page in it. */
export const useAccount = () => useContext(AccountContext);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading', data: null });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/account', { cache: 'no-store' });
      if (res.status === 403) return setState({ status: 'suspended', data: null });
      if (!res.ok) return setState({ status: 'error', data: null });
      setState({ status: 'ready', data: await res.json() });
    } catch {
      setState({ status: 'error', data: null });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <AccountContext.Provider value={{ ...state, refresh }}>{children}</AccountContext.Provider>;
}
