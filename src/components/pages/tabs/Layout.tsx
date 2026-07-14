import { ReactNode } from "react"
import Header from "./Header"
import Tabs from "./Tabs"
import { useLocation } from "react-router"
import { LinkI } from "./Tab"
import Lineicons from "@lineiconshq/react-lineicons"
import { Gear1Solid, HeartSolid, Home2Solid, Message2Solid, PlusSolid } from "@lineiconshq/free-icons"
import { useUserStore, UserI } from "../../../store/auth"

export interface Props {
    children: ReactNode
}

const Layout = ({ children }: Props) => {

    const { pathname } = useLocation()
    const { user } = useUserStore()
    const isAuthenticated = Boolean((user as UserI)?.ID)


    const isUser = pathname?.includes("user")

    const BASE_URL = "/tabs/user"

    const UserLinks: LinkI[] = [{
        icon: <Lineicons icon={Home2Solid} />,
        path: `${BASE_URL}`,
        label: "home"
    },
    ...(isAuthenticated ? [{
        icon: <Lineicons icon={Message2Solid} />,
        path: `${BASE_URL}/chat`,
        label: "messages"
    }] : []),
    {
        icon: <Lineicons icon={PlusSolid} />,
        path: `/upload`,
    },
    ...(isAuthenticated ? [{
        icon: <Lineicons icon={HeartSolid} />,
        path: `${BASE_URL}/favourites`,
        label: "favourites"
    }] : []),
    {
        icon: <Lineicons icon={Gear1Solid} />,
        path: `${BASE_URL}/settings`,
        label: "settings"
    },
    ]

    return (
        <div>
            <Header />
            <main className=" h-screen px-4 overscroll-y-auto">
                <div className="min-h-[11vh]"></div>
                {children}

                <div className="min-h-[14vh]"></div>

            </main>
            <Tabs links={isUser ? UserLinks : []} />
        </div>
    )
}

export default Layout