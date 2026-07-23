import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface BaseI {
  ID?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string;
}

type UserRole = "user" | "admin" | "broker";

export interface BrokerDetails {
  Fee: string;
  Bio: string;
}

type verification = "pending" | "approved" | "cancelled";

export interface UserI extends Partial<BaseI> {
  name: string;
  email?: string;
  role?: UserRole;
  phone?: string;
  photo?: string;
  hideContact?: boolean;
  verified?: boolean;
  broker?: boolean;
  verification?: verification;
  lastSeen?: string;
  BrokerDetails?: BrokerDetails;
}

const MockkUser: UserI | {} = {};

export interface AuthStoreI {
  user: UserI | {};
  token: string;
  getUser: () => UserI;
  setUser?: (u: UserI) => void;
  logout: () => void;
  login: (o: { user: UserI; token: string }) => void;
  getUserPhoto?: (url?: string) => string;
}

export const STORAGE_KEY = "_jdncjnsckchsbchkbcknsncknksjncchbfk";
export const AVATAR_FALLBACK =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgQIQ9gOvBDOqy7Toi6lIFPzWbdrum3VdsDwtze4kuSw&s=10";

export const useUserStore = create<AuthStoreI>()(
  persist(
    (set, get) => ({
      user: MockkUser,
      token: "",
      company: {},

      getUser: () => {
        return get()?.user as UserI;
      },

      setUser: (u) => {
        set({ user: u });
      },

      login: ({ user, token }) => {
        set({ user: user, token: token });
      },

      getUserPhoto: (url) => {
        // const savedUser = get()?.user as UserI;
        return url ? url : AVATAR_FALLBACK;
      },

      logout: () => {
        set({
          user: {},
          token: undefined,
        });
        window.location.href = "/";
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
