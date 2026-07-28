import { useLayoutEffect, useState } from "react"
import Header from "../../../components/pages/tabs/Header"
import { Put } from "../../../../api"
import { UserI, useUserStore } from "../../../store/auth"

interface SwitchProps {
    checked: boolean
    setChecked: (checked: boolean) => void
    disabled?: boolean
}

const Switch = ({ checked, setChecked, disabled }: SwitchProps) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => setChecked(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${checked ? "bg-primary" : "bg-pale"
            }`}
    >
        <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-6" : "translate-x-1"
                }`}
        />
    </button>
)


const Privacy = () => {

    const { getUser, setUser } = useUserStore()
    const user = getUser()
    const [hideEmail, setHideEmail] = useState(false)
    const [hideContact, setHideContact] = useState(false)

    const update = async (next: Pick<UserI, "hideContact" | "hideEmail">) => {
        setUser?.({ ...user, ...next } as UserI)
        await Put<Pick<UserI, "hideContact" | "hideEmail">, UserI>("me", next)
    }

    // The switch reports the NEW "accessible" state (checked = accessible),
    // so hide* is simply the inverse of that.
    const handleHideContact = async (accessible: boolean) => {
        const next = !accessible
        setHideContact(next)
        update({ hideContact: next, hideEmail })
    }
    const handleHideEmail = async (accessible: boolean) => {
        const next = !accessible
        setHideEmail(next)
        update({ hideContact, hideEmail: next })
    }

    useLayoutEffect(() => {
        setHideContact(Boolean(user?.hideContact))
        setHideEmail(Boolean(user?.hideEmail))
    }, [])

    return (
        <div>
            <Header back title="privacy" />
            <div className="px-4">

                <div className="flex border-b border-text/10 pb-4 mb-4 items-center gap-4 justify-between">

                    <div className="flex flex-col justify-center gap-1">
                        <h2 className=" font-semibold">Email accessibility</h2>
                        <p className="text-sm text-text/60">all users of the platform can access my email</p>
                    </div>
                    <Switch checked={!hideEmail} setChecked={handleHideEmail} />
                </div>
                <div className="flex  items-center gap-4 justify-between">

                    <div className="flex flex-col justify-center gap-1">
                        <h2 className=" font-semibold">Phone accessibility</h2>
                        <p className="text-sm text-text/60">all users of the platform can access my contact</p>
                    </div>
                    <Switch checked={!hideContact} setChecked={handleHideContact} />
                </div>

            </div>
        </div>
    )
}

export default Privacy