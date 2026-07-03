import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface BaseI {
  ID?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string;
}

type UserRole = "user" | "admin";

export interface UserI extends Partial<BaseI> {
  name: string;
  email?: string;
  role?: UserRole;
  phone?: string;
  photo?: string;
  verified?: boolean;
  broker?: boolean;
  lastSeen?: string;
}

const MockkUser: UserI | {} = {};

export interface AuthStoreI {
  user: UserI | {};
  token: string;
  setUser: (u: UserI) => void;
  logout: () => void;
  getUserPhoto?: (url?: string) => string;
}

export const STORAGE_KEY = "_jdncjnsckchsbchkbcknsncknksjncchbfk";
export const AVATAR_FALLBACK =
  "https://media.easy-peasy.ai/6d171bea-8373-43be-b226-0f3205f1a9f1/cbeed891-c4e9-4291-94f0-4a3239c6f1f7_medium.webp";

export const useUserStore = create<AuthStoreI>()(
  persist(
    (set) => ({
      user: MockkUser,
      token: "",
      company: {},

      setUser: (u) => {
        set({ user: u });
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
