import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Lead, Forwarder, Invoice, Bid } from '@/lib/api/contracts';
import { UserRecord, OrgRecord, mockDb } from '@/mock/db';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export type AppTheme = 
  | 'dark' | 'light' | 'cyberpunk' | 'matrix' | 'nord' | 'dracula'
  | 'synthwave' | 'solarized' | 'retro' | 'forest' | 'sunset' | 'slate';

interface StoreState {
  // --- AUTH SLICE ---
  user: UserRecord | null;
  org: OrgRecord | null;
  token: string | null;
  refresh: string | null;

  // --- DATA SLICES ---
  leads: Lead[];
  forwarders: Forwarder[];
  invoices: Invoice[];

  // --- UI SLICE ---
  sidebarOpen: boolean;
  theme: AppTheme;
  notifications: Notification[];
  shortcutsOpen: boolean;

  // --- ACTIONS ---
  hydrate: () => void;
  setAuth: (user: UserRecord | null, org: OrgRecord | null, token: string | null, refresh: string | null) => void;
  logout: () => void;
  
  // UI setters
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: AppTheme) => void;
  setShortcutsOpen: (open: boolean) => void;
  addNotification: (title: string, message: string) => void;
  markNotificationsAsRead: () => void;

  // Optimistic & DB synced actions
  syncLeads: () => void;
  syncForwarders: () => void;
  syncInvoices: () => void;
  
  optimisticAddBid: (leadId: string, bid: Bid) => void;
  optimisticUpdateInvoiceStatus: (invoiceId: string, status: 'Paid' | 'Unpaid') => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // --- Initial States ---
      user: null,
      org: null,
      token: null,
      refresh: null,

      leads: [],
      forwarders: [],
      invoices: [],

      sidebarOpen: true,
      theme: 'dark',
      notifications: [
        {
          id: 'notif-1',
          title: 'System Online',
          message: 'Freight instrument control center is authenticated and online.',
          read: false,
          timestamp: new Date().toISOString(),
        }
      ],
      shortcutsOpen: false,

      // --- Hydration ---
      hydrate: () => {
        // Safe database loading on client-side
        const state = get();
        
        // Sync arrays from localStorage mockDB
        const syncedLeads = mockDb.leads.list();
        const syncedForwarders = mockDb.forwarders.list();
        const syncedInvoices = mockDb.invoices.list();

        set({
          leads: syncedLeads,
          forwarders: syncedForwarders,
          invoices: syncedInvoices,
        });

        // If user is set but onboarding incomplete, we can sync auth values if needed
        if (state.user) {
          const freshUser = mockDb.users.find(state.user.email);
          if (freshUser) {
            const freshOrg = mockDb.orgs.get(freshUser.orgId);
            set({ user: freshUser, org: freshOrg });
          }
        }
      },

      setAuth: (user, org, token, refresh) => {
        set({ user, org, token, refresh });
      },

      logout: () => {
        set({ user: null, org: null, token: null, refresh: null });
        if (typeof document !== 'undefined') {
          // Clear authentication cookie
          document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
      },

      // --- UI Actions ---
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },
      setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),

      addNotification: (title, message) => {
        const newNotif: Notification = {
          id: `notif-${Math.random().toString(36).substr(2, 9)}`,
          title,
          message,
          read: false,
          timestamp: new Date().toISOString(),
        };
        set((prev) => ({ notifications: [newNotif, ...prev.notifications].slice(0, 20) }));
      },

      markNotificationsAsRead: () => {
        set((prev) => ({
          notifications: prev.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      // --- Sync Actions ---
      syncLeads: () => {
        set({ leads: mockDb.leads.list() });
      },

      syncForwarders: () => {
        set({ forwarders: mockDb.forwarders.list() });
      },

      syncInvoices: () => {
        set({ invoices: mockDb.invoices.list() });
      },

      // --- Optimistic Updates ---
      optimisticAddBid: (leadId, bid) => {
        // 1. Instantly update Zustand state for UI responsiveness
        set((prev) => ({
          leads: prev.leads.map((l) => {
            if (l.id === leadId) {
              const updatedBids = [...l.bids.filter(b => b.forwarderId !== bid.forwarderId), bid];
              return { ...l, bids: updatedBids, status: 'Quoted' as const };
            }
            return l;
          }),
        }));

        // 2. Persist to mock database in the background
        mockDb.leads.addBid(leadId, bid);
        mockDb.leads.update(leadId, { status: 'Quoted' });
      },

      optimisticUpdateInvoiceStatus: (invoiceId, status) => {
        // 1. Instantly update Zustand state
        set((prev) => ({
          invoices: prev.invoices.map((i) => {
            if (i.id === invoiceId) {
              return { ...i, status, paidAt: status === 'Paid' ? new Date().toISOString() : undefined };
            }
            return i;
          }),
        }));

        // 2. Persist to mock database in the background
        mockDb.invoices.updateStatus(invoiceId, status);
      },
    }),
    {
      name: 'freight-calculator-store',
      skipHydration: true, // Prevents server/client mismatch during Next.js rendering
    }
  )
);
