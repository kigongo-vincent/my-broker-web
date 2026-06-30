import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface BaseI {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string;
}

export interface UserI extends Partial<BaseI> {
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  verified?: boolean;
  broker?: boolean;
  lastSeen?: string;
}

const MockkUser: UserI = {
  ID: 1,
  name: "jamal alkhen saleem",
  photo:
    "https://images.rawpixel.com/image_800/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvNDc5LW1rLTk2OTAtam9iNTgzLmpwZw.jpg",
  phone: "+256782147143",
  lastSeen: "3 days ago",
  verified: true,
  broker: true,
};

export interface AuthStoreI {
  user: UserI | {};
  token: string;
  setUser: (u: UserI) => void;
  logout: () => void;
  getUserPhoto?: (url?: string) => string;
}

export const STORAGE_KEY = "_jdncjnsckchsbchkbcknsncknksjncchbfk";
export const AVATAR_FALLBACK =
  "https://media.istockphoto.com/id/2151669184/vector/vector-flat-illustration-in-grayscale-avatar-user-profile-person-icon-gender-neutral.jpg?s=612x612&w=0&k=20&c=UEa7oHoOL30ynvmJzSCIPrwwopJdfqzBs0q69ezQoM8=";

export const useUserStore = create<AuthStoreI>()(
  persist(
    (set, get) => ({
      user: MockkUser,
      token: "",
      company: {},

      setUser: (u) => {
        set({ user: u });
      },

      getUserPhoto: (url) => {
        const savedUser = get()?.user as UserI;
        return url
          ? url
          : savedUser?.photo
          ? savedUser?.photo
          : AVATAR_FALLBACK;
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
