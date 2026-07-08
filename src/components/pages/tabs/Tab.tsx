import { Activity, ReactNode, useMemo } from "react"
import { useLocation, useNavigate } from "react-router"

export interface LinkI {
    label?: string
    icon: ReactNode
    path: string
    badge?: string | number

}

const Tab = (t: LinkI) => {

    const { pathname } = useLocation()
    const isActive = useMemo(() => pathname == t?.path, [pathname, t?.path])
    const uploadStyles = useMemo(() => t?.path?.includes("upload") ? "bg-primary text-white " : "", [pathname])
    const navigate = useNavigate()

    console.log(`current: ${pathname}, path: ${t?.path}, active: ${isActive}`)

    return (
        <div className="flex flex-col items-center ">
            <div
                onClick={() => navigate(t?.path)}
                className={`h-16 cursor-pointer relative w-16 flex items-center justify-center rounded-2xl  ${isActive ? "text-text bg-paper " : "text-text/50"} ${uploadStyles}`}>
                <span>{t?.icon}</span>



                {/* badge  */}
                <Activity mode={t?.badge ? "visible" : "hidden"}>
                    <span className="bg-danger top-0 flex items-center justify-center text-sm right-0 h-8 text-white w-8 rounded-full absolute">{t?.badge}</span>
                </Activity>
            </div>
            <span className="text-[2.9vw] font-medium">{t?.label}</span>
        </div>
    )
}

export default Tab