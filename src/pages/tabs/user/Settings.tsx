import { BadgeDecagramPercentSolid, PhoneSolid, PowerButtonSolid, TargetUserSolid, UserMultiple4Solid } from "@lineiconshq/free-icons"
import Lineicons from "@lineiconshq/react-lineicons"
import { ReactNode, useMemo, useState } from "react"
import FlexRender from "../../../components/base/FlexRender"
import { BaseI, } from "../../../store/auth"
import Modal from "../../../components/base/Modal"
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid"
import { Link, useNavigate } from "react-router"


export interface SettingComponentI extends BaseI {
    icon: ReactNode
    title: string
    caption: string
    path?: string
    onPress?: () => void
}

const SettingComponent = (s: SettingComponentI) => {
    return (
        <Link
            to={s?.path ? s?.path : ""}
            onClick={() => s?.onPress?.()}
            className="flex items-center gap-3">
            <span className="h-16 w-16 rounded-xl flex items-center justify-center bg-pale">
                {s?.icon}
            </span>
            <div className="flex flex-col  justify-center">
                <p className="font-medium ">{s?.title}</p>
                <p className=" text-text/50">{s?.caption}</p>
            </div>
        </Link>
    )
}

const Settings = () => {

    const [showLogoutModal, setShowlogoutModal] = useState(false)

    const settings: SettingComponentI[] = useMemo(() => [
        // {
        //     icon: <Lineicons icon={ColourPalette3Solid} />,
        //     title: "Theme settings",
        //     caption: "modify the appearance",
        //     path: ""
        // },
        {

            ID: 1,
            icon: <Lineicons icon={TargetUserSolid} />,
            title: "Profile & Account",
            caption: "customize your profile",
            path: "/account"
        },
        {
            ID: 2,
            icon: <Lineicons icon={BadgeDecagramPercentSolid} />,
            title: "ID verification",
            caption: true ? "your account is verified" : "earn a verification badge on your account",
            path: "/verification"
        },
        {
            ID: 3,
            icon: <Lineicons icon={PhoneSolid} />,
            title: "Change phone number",
            caption: "Transfer account to another phone number",
            path: "/phone"
        },
        // {
        //     ID: 4,
        //     icon: <Lineicons icon={Envelope1Solid} />,
        //     title: "Change Email",
        //     caption: "Transfer account to another email",
        //     path: ""
        // },
        {
            ID: 5,
            icon: <Lineicons icon={UserMultiple4Solid} />,
            title: "Manage users",
            caption: "Review & manage users",
            path: "/users"
        },
        {
            ID: 6,
            icon: <Lineicons icon={PowerButtonSolid} />,
            title: "Logout",
            caption: "logout from platform",
            path: "",
            onPress: () => setShowlogoutModal(true)

        },

    ], [])

    // const { user } = useUserStore()
    // const filteredSettings = useMemo(() => {
    //     const res: SettingComponentI[] = []
    //     return settings.forEach(s => {
    //         if (s?.id)
    //     })

    // }, [user])

    const navigate = useNavigate()

    return (
        <div className="">
            <p className="text-xl font-medium  ">Setting</p>
            <p className="text-sm mb-5 mt-1  text-text/80">adjust the nobs of the app to match your preference</p>
            <FlexRender className="gap-6" items={settings} render={(item, index) => <SettingComponent {...item} key={index} />} />

            {/* logout  */}
            <Modal actions={<><button onClick={() => setShowlogoutModal(false)} className="btn bg-pale">cancel</button><button onClick={() => navigate(`/`)} className="btn bg-primary text-white">confirm</button></>} open={showLogoutModal} onClose={() => setShowlogoutModal(false)}>

                <p className="text-2xl flex items-center mb-4 gap-2 font-semibold">

                    <ExclamationTriangleIcon className="h-8 w-8" />
                    Logout confirmation</p>
                <p className="text-text/70">
                    Are you sure you want to logout</p>
            </Modal>
        </div>
    )
}

export default Settings