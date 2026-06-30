import { ReactNode } from "react"
import Header from "./Header"
import Tabs from "./Tabs"
import { useLocation } from "react-router"
import { LinkI } from "./Tab"
import Lineicons from "@lineiconshq/react-lineicons"
import { Gear1Solid, HeartSolid, Home2Solid, Message2Solid, PlusSolid } from "@lineiconshq/free-icons"

export interface Props {
    children: ReactNode
}

const Layout = ({ children }: Props) => {

    const { pathname } = useLocation()

    // const isAdmin = pathname.includes("admin")
    const isUser = pathname?.includes("user")

    const BASE_URL = "/tabs/user"

    // const AdminLinks: LinkI[] = []
    const UserLinks: LinkI[] = [{
        icon: <Lineicons icon={Home2Solid} />,
        path: `${BASE_URL}`
    },
    {
        icon: <Lineicons icon={Message2Solid} />,
        path: `${BASE_URL}/chat`,
        badge: 3,
    },
    {
        icon: <Lineicons icon={PlusSolid} />,
        path: `/upload`
    },
    {
        icon: <Lineicons icon={HeartSolid} />,
        path: `${BASE_URL}/favourites`
        , badge: 1
    },
    {
        icon: <Lineicons icon={Gear1Solid} />,
        path: `${BASE_URL}/settings`
    },
    ]

    return (
        <div>
            <Header />
            <main className=" h-screen pt-[9vh] px-4 overscroll-y-auto">{children}

                <div className="min-h-[10vh]"></div>

            </main>
            <Tabs links={isUser ? UserLinks : []} />
        </div>
    )
}

export default Layout