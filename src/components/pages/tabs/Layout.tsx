import { ReactNode, useMemo } from "react"
import Header from "./Header"
import Tabs from "./Tabs"
import { useLocation } from "react-router"
import { LinkI } from "./Tab"
import Lineicons from "@lineiconshq/react-lineicons"
import { Gear1Solid, HeartSolid, Home2Solid, Message2Solid, PlusSolid } from "@lineiconshq/free-icons"
import { useAppStore } from "../../../store/app"

export interface Props {
    children: ReactNode
}

const BASE_URL = "/tabs/user"
const FULL_BLEED_PATHS = ["/tabs/user", "/tabs/user/", "/tabs/user/favourites"]

const Layout = ({ children }: Props) => {

    const { pathname } = useLocation()
    const { favouritesCount } = useAppStore()

    const isUser = pathname?.includes("user")
    const isFullBleed = FULL_BLEED_PATHS.includes(pathname)
    const { setRefresh } = useAppStore()




    const UserLinks: LinkI[] = useMemo(() => [{
        icon: <Lineicons icon={Home2Solid} />,
        path: `${BASE_URL}`,
        label: "home",
        action: () => setRefresh?.(true)
    },
    {
        icon: <Lineicons icon={Message2Solid} />,
        path: `${BASE_URL}/chat`,
        label: "messages",
    },
    {
        icon: <Lineicons icon={PlusSolid} />,
        path: `/upload`,
    },
    {
        icon: <Lineicons icon={HeartSolid} />,
        path: `${BASE_URL}/favourites`,
        label: "favourites",
        badge: favouritesCount
    },
    {
        icon: <Lineicons icon={Gear1Solid} />,
        path: `${BASE_URL}/settings`,
        label: "settings"
    },
    ], [favouritesCount, setRefresh])


    return (
        // Fixed-height shell: nothing outside <main> is allowed to scroll
        <div className="flex h-dvh w-full flex-col overflow-hidden mx-auto sm:w-[400px]">
            <Header noMargin />
            {/* The ONLY scroll container */}
            <main
                className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain ${!isFullBleed ? "px-4" : ""}`}
                style={{ WebkitOverflowScrolling: "touch" }}
            >
                {children}
                <div className="h-2 shrink-0" />
            </main>
            <Tabs links={isUser ? UserLinks : []} />
        </div>
    )
}

export default Layout