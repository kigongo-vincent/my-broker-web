import { Activity, ReactNode, useMemo } from "react"
import { useLocation, useNavigate } from "react-router"
import { useAppStore } from "../../../store/app"
import { useUserStore } from "../../../store/auth"

export interface LinkI {
    label?: string
    icon: ReactNode
    path: string
    badge?: string | number
}

const Tab = (t: LinkI) => {
    const { pathname } = useLocation()
    const isActive = useMemo(() => pathname === t?.path || pathname === t?.path + "/", [pathname, t?.path])
    const isUpload = useMemo(() => t?.path?.includes("upload"), [t?.path])
    const navigate = useNavigate()
    const { LoginPrompt, unread } = useAppStore()

    const hasBadge = t?.label === "messages" && unread !== 0 ? true : typeof t.badge === "number" ? t.badge > 0 : Boolean(t.badge)
    const badgeContent = t?.label === "messages" ? unread : t?.badge
    const { token } = useUserStore()

    const action = () => {
        if (token !== "") {
            navigate(t?.path)
            return
        }
        t?.label !== "home" && LoginPrompt(t?.label || "")
    }

    // TikTok style plus/upload button styling (pill-shaped with cyan/magenta shadow or primary background)
    if (isUpload) {
        return (
            <div className="flex flex-col items-start justify-center bg-primary rounded-lg h-full py-2 cursor-pointer group px-1" onClick={action}>
                <div className="relative flex items-center justify-center h-full min-h-full  w-[11vw]  flex-1 bg-primary text-white rounded-lg  transition-transform duration-200 active:scale-95">
                    {/* TikTok inner multi-colored pill layer accent */}
                    {/* <div className="absolute inset-0 bg-primary/40 rounded-[10px] -left-1 -z-10 blur-[0.5px]" /> */}
                    <div className="absolute inset-0 bg-secondary/40 rounded-[10px] -right-1 -z-10 blur-[0.5px]" />
                    <span className="flex items-center justify-center font-bold text-xl">
                        {t?.icon}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center h-full w-full gap-0.5 cursor-pointer group py-1" onClick={action}>
            <div
                className={`relative flex items-center justify-center transition-all duration-200 active:scale-95 ${isActive ? "text-primary font-semibold" : "text-text/50 hover:text-text/80"
                    }`}
            >
                <span className={`transition-transform duration-200 ${isActive ? "scale-110" : "scale-100"}`}>
                    {t?.icon}
                </span>

                <Activity mode={hasBadge ? "visible" : "hidden"}>
                    <span className="absolute -top-3 -right-4 min-w-[6vw] h-[6vw] px-1 bg-danger text-sm font-medium text-white rounded-full flex items-center justify-center">
                        {typeof badgeContent === "number" && badgeContent > 99 ? "99+" : badgeContent}

                    </span>
                </Activity>
            </div>

            <span className={`text-sm mt-1 sm:text-xs transition-colors duration-200 capitalize leading-none ${isActive ? "text-primary font-medium" : "text-text/50 font-medium"}`}>
                {t?.label}
            </span>
        </div>
    )
}

export default Tab