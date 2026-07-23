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

const Layout = ({ children }: Props) => {

    const { pathname } = useLocation()
    const { favouritesCount } = useAppStore()

    const isUser = pathname?.includes("user")

    const BASE_URL = "/tabs/user"

    const UserLinks: LinkI[] = useMemo(() => [{
        icon: <Lineicons icon={Home2Solid} />,
        path: `${BASE_URL}`,
        label: "home"
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
    ], [favouritesCount])

    return (
        <div>
            <Header />
            <main className={`h-screen  ${!["/tabs/user", "/tabs/user/", "/tabs/user/favourites"]?.includes(pathname) && "px-4"} overscroll-y-auto`}>
                {children}
                <div className="min-h-[14vh]"></div>

            </main>
            <Tabs links={isUser ? UserLinks : []} />
        </div>
    )
}

export default Layout