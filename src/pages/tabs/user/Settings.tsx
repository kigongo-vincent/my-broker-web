import { BadgeDecagramPercentSolid, ColourPalette3Solid, Envelope1Solid, PhoneSolid, PowerButtonSolid, TargetUserSolid, UserMultiple4Solid } from "@lineiconshq/free-icons"
import Lineicons from "@lineiconshq/react-lineicons"
import { ReactNode } from "react"
import FlexRender from "../../../components/base/FlexRender"


export interface SettingComponentI {
    icon: ReactNode
    title: string
    caption: string
    path?: string
    onPress?: () => void
}

const SettingComponent = (s: SettingComponentI) => {
    return (
        <div className="flex items-center gap-2">
            <span className="h-14 w-14 rounded-xl flex items-center justify-center bg-pale">
                {s?.icon}
            </span>
            <div className="flex flex-col justify-center">
                <p className="font-medium">{s?.title}</p>
                <p className="text-sm text-text/50">{s?.caption}</p>
            </div>
        </div>
    )
}

const Settings = () => {

    const settings: SettingComponentI[] = [
        {
            icon: <Lineicons icon={ColourPalette3Solid} />,
            title: "Theme settings",
            caption: "modify the appearance",
            path: ""
        },
        {
            icon: <Lineicons icon={TargetUserSolid} />,
            title: "Profile & Account",
            caption: "customize your profile",
            path: ""
        },
        {
            icon: <Lineicons icon={BadgeDecagramPercentSolid} />,
            title: "ID verification",
            caption: "earn a verification badger on your account",
            path: ""
        },
        {
            icon: <Lineicons icon={PhoneSolid} />,
            title: "Change phone number",
            caption: "Transfer account to another phone number",
            path: ""
        },
        {
            icon: <Lineicons icon={Envelope1Solid} />,
            title: "Change Email",
            caption: "Transfer account to another email",
            path: ""
        },
        {
            icon: <Lineicons icon={UserMultiple4Solid} />,
            title: "Manage users",
            caption: "Review & manage users",
            path: ""
        },
        {
            icon: <Lineicons icon={PowerButtonSolid} />,
            title: "Logout",
            caption: "logout from platform",
            path: ""
        },

    ]

    return (
        <div className="">
            <p className="text-xl font-semibold  mt-10">Setting</p>
            <p className="text-sm mb-10 mt-2  text-text/80">adjust the nobs of the app to match your preference</p>
            <FlexRender className="gap-6" items={settings} render={(item, index) => <SettingComponent {...item} key={index} />} />
        </div>
    )
}

export default Settings