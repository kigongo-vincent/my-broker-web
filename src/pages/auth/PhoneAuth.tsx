
import { useMemo, useState } from "react"
import Logo from "../../components/base/Logo"
import { StepI } from "../tabs/user/Upload"
import { useNavigate } from "react-router"
import { Post, Put } from "../../../api/index"
import Modal from "../../components/base/Modal"
import { UserI, useUserStore } from "../../store/auth"

interface PhoneAuthRequest {
    phone: string
    code?: string
    pinCode?: string
    step: number
}


const PhoneAuth = () => {


    const [step, setStep] = useState(1)
    const navigate = useNavigate()
    const [phone, setPhone] = useState("0782147143")
    const [showSignupModal, setShowSignupModal] = useState(false)
    const [showSetupModal, setShowSetupModal] = useState(false)
    const [setupStep, setSetupStep] = useState(1)
    const [setupName, setSetupName] = useState("")
    const [setupEmail, setSetupEmail] = useState("")
    const [setupPhoto, setSetupPhoto] = useState("")
    const [setupSaving, setSetupSaving] = useState(false)
    const [error, setError] = useState("")
    const [pin1, setpin1] = useState("")
    const [pin2, setpin2] = useState("")
    const { login } = useUserStore()

    const step1 = async () => {
        if (phone) {
            const { status } = await Post<PhoneAuthRequest, { token: string }>("users/phone", { phone: phone, step: 1 })
            if (status == 202) {
                setShowSignupModal(true)
                return
            }
            if (status == 200) {
                setStep(3)
            }
        }
    }


    const handleAuthSuccess = (data: { token: string, user: UserI }) => {
        login(data)
        setShowSetupModal(true)
    }

    const step2 = async () => {

        if (pin1 != pin2 && (pin1 != "" && pin2 != "")) {
            setError("password mismatch, ensure you use the same value for the password fields")
            return
        }

        if (phone) {
            const { status, msg, data } = await Post<PhoneAuthRequest, { token: string, user: UserI }>("users/phone", { phone: phone, step: 2, pinCode: pin1 })
            if (status != 200) {
                setError(msg)
                return
            }
            handleAuthSuccess(data)
        }
    }

    const step3 = async () => {
        if (phone == "") {
            setError("phone number is missing")
            return
        }
        if (pin1 == "") {
            setError("pincode is missing")
            return
        }
        if (phone) {
            const { status, data, msg } = await Post<PhoneAuthRequest, { token: string, user: UserI }>("users/phone", { phone: phone, step: 3, pinCode: pin1 })
            if (status == 200) {
                handleAuthSuccess(data)
                return
            }
            setError(msg)
        }
    }


    const handleSetupSave = async () => {
        if (!setupName.trim()) {
            setError("Please add your name so we can finish creating your account.")
            return
        }

        setSetupSaving(true)
        try {
            await Put("me/", { name: setupName.trim(), email: setupEmail.trim(), photo: setupPhoto.trim() })
            setShowSetupModal(false)
            navigate("/tabs/user/")
        } catch {
            setError("We could not save your profile details yet. Please try again.")
        } finally {
            setSetupSaving(false)
        }
    }

    const steps: StepI[] = useMemo(() =>
        [{
            id: 1,
            content: <>
                <Logo className="h-26 w-26" />
                <h3 className="text-2xl  font-light  -mb-5">My Broker</h3>
                <p className=" text-center text-text/50  text-sm leading-6 mt-2 max-w-[80%]">Continue with your phone, its that easy</p>


                <div className="flex flex-col w-full gap-2">
                    <span className="text-sm">Phone</span>
                    <input value={phone} onChange={(e) => setPhone(e?.currentTarget?.value)} className="outline-0 bg-pale h-14 rounded-full px-6" placeholder="phone" />
                </div>

                <button onClick={step1} className="btn bg-primary rounded-full text-white w-full">continue</button>
                <button
                    onClick={() => navigate("/tabs/user")}
                    className="btn w-full bg-pale  rounded-full">
                    {/* <img src={GoogleIcon} className="h-7" alt="" /> */}
                    <span>skip to home</span>
                </button>
            </>

        }, {
            id: 2,
            content: <>
                <Logo className="h-26 w-26" />

                <h3 className="text-2xl  font-light  -mb-5">Create pin</h3>
                <p className="  text-center text-text/50  text-sm leading-6 mt-2 max-w-[80%]">please create a new pin you will use when accessing the platform</p>
                <p className="text-text/50 text-sm mt-1"></p>
                <br />
                <div className="flex flex-col w-full gap-2">
                    <span className="text-sm">New Pincode</span>
                    <input value={pin2} onChange={(e) => setpin2(e?.currentTarget?.value)} className="outline-0 bg-pale h-14 rounded-lg px-6" placeholder="**********" />
                </div>
                <div className="flex flex-col w-full gap-2">
                    <span className="text-sm">Confirm New Pincode</span>
                    <input value={pin1} onChange={(e) => setpin1(e?.currentTarget?.value)} type="number" className="outline-0 bg-pale h-14 rounded-lg px-6" placeholder="**********" />
                </div>
                <button onClick={step2} className="btn bg-primary text-white w-full">continue</button>
                <div className="flex items-center gap-1 justify-center">
                    not sure about the phone number, <span onClick={() => setStep(1)} className="underline text-primary" >go back</span>
                </div>
            </>
        }, {
            id: 3,
            content: <>
                <Logo className="h-26 w-26" />

                <h3 className="text-2xl  font-light  -mb-5">Enter pin</h3>
                <p className="  text-center text-text/50  text-sm leading-6 mt-2 max-w-[80%]">please provide the pincode of your account</p>
                <p className="text-text/50 text-sm mt-1"></p>
                <br />
                <div className="flex flex-col w-full gap-2">
                    <span className="text-sm">Pincode</span>
                    <input value={pin1} onChange={(e) => setpin1(e?.currentTarget?.value)} className="outline-0 rounded-full bg-pale h-14  px-6" placeholder="**********" />
                </div>
                <button onClick={step3} className="btn rounded-full w-full bg-primary text-white">confirm</button>
                <div className="flex items-center gap-1 justify-center">
                    not sure about the phone number, <span onClick={() => setStep(1)} className="underline text-primary" >go back</span>
                </div>
            </>
        }
        ]
        , [step, phone, pin1, pin2])

    const currentStep = steps.find(s => s?.id == step)

    return (
        <div className="relative h-screen w-screen">

            {/* <img src="https://images.pexels.com/photos/28428587/pexels-photo-28428587.jpeg" className="absolute left-0 top-0 h-full w-full object-cover" alt="" /> */}

            <div className="flex h-full p-4 absolute left-0 top-0 flex-col w-full bg-paper/98 gap-4 justify-center items-center">

                {currentStep?.content}

                <Modal
                    actions={<><button onClick={() => setShowSignupModal(false)} className="btn bg-pale">cancel</button><button onClick={() => { setStep(2); setShowSignupModal(false) }} className="btn bg-primary text-white">continue</button></>}
                    open={showSignupModal} onClose={() => setShowSignupModal(false)}>
                    <p className="text-xl font-semibold">Sign up confirmation</p>
                    <p className="text-text/50 text-sm mt-1">The phone number <u>{phone}</u> is not yet registered on the platform, would you like to continue with creating a new account</p>
                    <br />
                </Modal>

                <Modal position="bottom" open={showSetupModal} onClose={() => { setShowSetupModal(false); navigate("/tabs/user/") }}>
                    <div className="rounded-3xl bg-paper p-4">
                        <p className="text-xl font-semibold">Finish your account setup</p>
                        <p className="mt-2 text-sm text-text/60">We just need a few details so your account is ready for listings and conversations.</p>

                        {setupStep === 1 && (
                            <div className="mt-6 space-y-4">
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm">Full name</span>
                                    <input value={setupName} onChange={(e) => setSetupName(e.currentTarget.value)} className="outline-0 bg-pale h-14 rounded-full px-6" placeholder="Enter your full name" />
                                </div>
                                <div className="mt-6 flex gap-3">
                                    <button onClick={() => { setShowSetupModal(false); navigate("/tabs/user/") }} className="btn flex-1 rounded-full bg-pale">Later</button>
                                    <button onClick={() => setSetupStep(2)} className="btn flex-1 rounded-full bg-primary text-white">Continue</button>
                                </div>
                            </div>
                        )}

                        {setupStep === 2 && (
                            <div className="mt-6 space-y-4">
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm">Email</span>
                                    <input value={setupEmail} onChange={(e) => setSetupEmail(e.currentTarget.value)} className="outline-0 bg-pale h-14 rounded-full px-6" placeholder="you@example.com" />
                                </div>
                                <div className="mt-6 flex gap-3">
                                    <button onClick={() => setSetupStep(1)} className="btn flex-1 rounded-full bg-pale">Back</button>
                                    <button onClick={() => setSetupStep(3)} className="btn flex-1 rounded-full bg-primary text-white">Continue</button>
                                </div>
                            </div>
                        )}

                        {setupStep === 3 && (
                            <div className="mt-6 space-y-4">
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm">Profile photo URL</span>
                                    <input value={setupPhoto} onChange={(e) => setSetupPhoto(e.currentTarget.value)} className="outline-0 bg-pale h-14 rounded-full px-6" placeholder="https://..." />
                                </div>
                                <div className="mt-6 flex gap-3">
                                    <button onClick={() => setSetupStep(2)} className="btn flex-1 rounded-full bg-pale">Back</button>
                                    <button onClick={handleSetupSave} disabled={setupSaving} className="btn flex-1 rounded-full bg-primary text-white disabled:opacity-60">{setupSaving ? "Saving..." : "Save profile"}</button>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>

                {/* error modal  */}

                <Modal
                    actions={<><button onClick={() => setError("")} className="btn bg-primary text-white">ok</button></>}
                    open={error?.length != 0} onClose={() => setError("")}>
                    <p className="text-xl font-semibold text-danger">Authentication Error</p>
                    <p className="text-text/50 text-sm mt-1">{error}</p>
                    <br />
                </Modal>
            </div>
        </div>
    )
}

export default PhoneAuth