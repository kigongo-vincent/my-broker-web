
import { useMemo, useRef, useState } from "react"
import Logo from "../../components/base/Logo"
import { StepI } from "../tabs/user/Upload"
import { useNavigate } from "react-router"
import { Post, Put } from "../../../api/index"
import Modal from "../../components/base/Modal"
import { BrokerDetails, UserI, useUserStore } from "../../store/auth"
import Loader from "../../components/base/Loader"
import PhotoUpload from "../../components/base/PhotoUpload"
import PhoneInput from "../../components/base/Phone"
import { PinInput } from "../../components/base/PinCode"
import { BottomSheet } from "react-spring-bottom-sheet"

interface PhoneAuthRequest {
    phone: string
    code?: string
    pinCode?: string
    step: number
}

interface AuthSuccessI { token: string, user: UserI }


const PhoneAuth = () => {


    const [step, setStep] = useState(1)
    const navigate = useNavigate()
    const [phone, setPhone] = useState("")
    const [showSignupModal, setShowSignupModal] = useState(false)
    const [showSetupModal, setShowSetupModal] = useState(false)
    const [setupStep, setSetupStep] = useState(1)
    const [setupName, setSetupName] = useState("")
    const [setupEmail, setSetupEmail] = useState("")
    const [setupPhoto, setSetupPhoto] = useState("")
    const [setupSaving, setSetupSaving] = useState(false)
    const [showTerms, setShowTerms] = useState(false)
    const [signupData, setSignupData] = useState<AuthSuccessI | null>(null)
    const sheetRef = useRef(null)
    const [fees, setFees] = useState(0)
    const [bio, setBio] = useState("")


    const [error, setError] = useState("")
    const [isBroker, setIsBroker] = useState(false)
    const [pin1, setpin1] = useState("")
    const [pin2, setpin2] = useState("")
    const [pinStage, setPinStage] = useState<1 | 2>(1) // 1 = create, 2 = confirm
    const [loading, setLoading] = useState(false)
    const { login, setUser } = useUserStore()

    const step1 = async () => {
        try {
            setLoading(true)
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
        } catch (error) {

        } finally {
            setLoading(false)
        }
    }


    const handleAuthSuccess = (data: { token: string, user: UserI }) => {
        login(data)
        // Only funnel the user into "finish your account setup" if their
        // profile actually looks incomplete. Step 3 (returning user, pin
        // login) returns a fully-populated user for anyone who already
        // finished setup, so re-showing the modal there was the bug.
        const needsSetup = !data.user?.completeSetup
        if (needsSetup) {
            setShowSetupModal(true)
            return
        } else {
            navigate("/tabs/user/")
        }
    }

    // called by the pin-step button: advances create -> confirm, or submits once confirmed
    const handlePinContinue = () => {
        if (pinStage == 1) {
            if (pin1?.length < 4) {
                setError("please complete the pin")
                return
            }
            setPinStage(2)
            return
        }

        // pinStage == 2
        if (pin2?.length < 4) {
            setError("please confirm your pin")
            return
        }

        if (pin1 !== pin2) {
            setError("pins don't match, please try again")
            setpin2("")
            setPinStage(1)
            setpin1("")
            return
        }

        // signup already succeeded (e.g. user hit "Not now" on terms and came
        // back to "continue") — don't re-POST, just re-open the terms sheet
        if (signupData) {
            setShowTerms(true)
            return
        }

        step2()
    }

    const step2 = async () => {

        try {
            setLoading(true)

            if (pin1?.length < 4 || pin2?.length < 4 || pin1 !== pin2) {
                setError("please make sure both pins match")
                return
            }

            if (phone) {
                const { status, msg, data } = await Post<PhoneAuthRequest, AuthSuccessI>("users/phone", { phone: phone, step: 2, pinCode: pin1 })
                if (status != 200) {
                    setError(msg)
                    return
                }
                setSignupData(data)
                setShowTerms(true)
                // handleAuthSuccess(data)
            }
        } catch (error) {

        } finally {

            setLoading(false)
        }
    }

    const step3 = async () => {
        try {
            setLoading(true)
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
        } catch (error) {

        } finally {
            setLoading(false)
        }
    }




    const steps: StepI[] = useMemo(() =>
        [{
            id: 1,
            content: <>
                <Logo className="h-26 w-26" />
                <h3 className="text-2xl  font-bold  -mb-5">My Broker</h3>
                <p className=" text-center text-text/50  text-sm leading-6 mt-2 max-w-[80%]">Continue with your phone, its that easy</p>


                <div className="flex flex-col w-full gap-2">
                    <span className="text-sm">Phone</span>
                    {/* <input value={phone} onChange={(e) => setPhone(e?.currentTarget?.value)} className="outline-0 bg-pale h-14 rounded-full px-6" placeholder="phone" /> */}
                    <PhoneInput value={phone} onChange={setPhone} className="rounded-full" />
                </div>

                <button onClick={step1} className="btn bg-primary rounded-full text-white w-full">
                    <Loader loading={loading}>
                        continue
                    </Loader>
                </button>
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

                <h3 className="text-2xl  font-semibold  -mb-5">{pinStage == 1 ? "Create pin" : "Confirm pin"}</h3>
                <p className="  text-center text-text/50  text-sm leading-6 mt-2 max-w-[80%]">
                    {pinStage == 1
                        ? "please create a new pin you will use when accessing the platform"
                        : "please re-enter the same pin to confirm"}
                </p>
                <p className="text-text/50 text-sm mt-1"></p>
                <br />
                {pinStage == 1
                    ? <PinInput key="pin-create" value={pin1} onChange={setpin1} />
                    : <PinInput key="pin-confirm" value={pin2} onChange={setpin2} />}
                <button onClick={handlePinContinue} className="btn rounded-full bg-primary text-white w-full">
                    <Loader loading={loading}>
                        {pinStage == 1 ? "continue" : "confirm"}
                    </Loader>
                </button>
                <div className="flex items-center gap-1 justify-center">
                    not sure about the phone number,{" "}
                    <span
                        onClick={() => {
                            if (pinStage == 2) {
                                setPinStage(1)
                                setpin2("")
                            } else {
                                setpin1("")
                                setpin2("")
                                setSignupData(null)
                                setStep(1)
                            }
                        }}
                        className="underline text-primary"
                    >
                        go back
                    </span>
                </div>
            </>
        }, {
            id: 3,
            content: <>
                <Logo className="h-26 w-26" />

                <h3 className="text-2xl  font-semibold  -mb-5">Enter pin</h3>
                <p className="  text-center text-text/50  text-sm leading-6 mt-2 max-w-[80%]">please provide the pincode of your account</p>
                <p className="text-text/50 text-sm mt-1"></p>
                <br />
                {/* <div className="flex flex-col w-full gap-2">
                    <span className="text-sm">Pincode</span>
                    <input value={pin1} onChange={(e) => setpin1(e?.currentTarget?.value)} className="outline-0 rounded-full bg-pale h-14  px-6" placeholder="**********" />
                </div> */}
                <PinInput value={pin1} onChange={setpin1} />
                <button onClick={step3} className="btn  w-full bg-primary text-white">
                    <Loader loading={loading}>
                        confirm
                    </Loader>
                </button>
                <div className="flex items-center gap-1 justify-center">
                    not sure about the phone number, <span onClick={() => setStep(1)} className="underline text-primary" >go back</span>
                </div>
            </>
        }
        ]
        , [step, phone, pin1, pin2, pinStage, loading])

    const currentStep = steps.find(s => s?.id == step)
    const [hidePhone, setHidePhone] = useState(false)

    const handleAccountTypeSelect = (isBroker: boolean) => {
        var nextStep: number
        if (isBroker) {
            setIsBroker(true)
            nextStep = 4
        } else {
            nextStep = 5
        }
        setSetupStep(nextStep)
    }

    const handlePhoneVisibility = (hidePhone: boolean) => {
        if (hidePhone) {
            setHidePhone(true)
        }
        setSetupStep(prev => prev + 1)
    }

    const handleSetupSave = async () => {
        if (!setupName.trim()) {
            setError("Please add your name so we can finish creating your account.")
            return
        }

        setSetupSaving(true)
        try {
            var body = { hideContact: hidePhone, name: setupName.trim(), email: setupEmail.trim(), photo: setupPhoto.trim(), role: isBroker ? "broker" : "user", BrokerDetails: ({ Fee: `UGX ${fees.toLocaleString("en-US")}`, Bio: bio } as BrokerDetails) }
            const { data, status, msg } = await Put<unknown, UserI>("me/", body)
            if (status == 200) {
                setUser?.(data)
                setShowSetupModal(false)
                navigate("/tabs/user/")
            }
            else {
                setError(msg)
            }
        } catch {
            setError("We could not save your profile details yet. Please try again.")
        } finally {
            setSetupSaving(false)
        }
    }
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

                <Modal position="right" open={showSetupModal} onClose={() => { setShowSetupModal(false); navigate("/tabs/user/") }}>
                    <div className="rounded-3xl bg-paper ">
                        {
                            setupStep == 1 && <>
                                <p className="text-lg ">Finish your account setup</p>
                                <p className="mt-4 mb-8  text-text/40">We just need a few details so your account is ready for listings and conversations.</p>
                            </>
                        }
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
                            <div className="mt-6 space-y-8">
                                <div className="">
                                    <h3 className="text-xl font-medium ">Account type</h3>
                                    <p className="text-text/50 text-sm leading-8">Are you signing up as a broker </p>
                                </div>
                                <div className="flex items-center justify-between">

                                    <button onClick={() => setSetupStep(prev => prev - 1)} className="btn  bg-pale">Back</button>

                                    <div className="flex items-center gap-3 justify-end">
                                        <button onClick={() => handleAccountTypeSelect(false)} className="btn bg-pale">NO</button>
                                        <button onClick={() => handleAccountTypeSelect(true)} className="btn bg-primary text-white">YES</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {setupStep === 4 && (
                            <div className="mt-6 space-y-1 flex flex-col">
                                <h2 className=" font-medium mt-5">Broker details</h2>
                                <p className="text-sm text-text/60">Please provide your broker operation details</p>
                                <div className="flex flex-col gap-2 mt-8">
                                    <span className="text-sm">Broker fees (UGX)</span>
                                    <input value={fees} onChange={(e) => setFees(+e.currentTarget.value)} className="outline-0 bg-pale h-14 rounded px-6" placeholder="Enter your full name" />
                                </div>
                                <div className="flex flex-col gap-2 mt-8">
                                    <span className="text-sm">Broker details</span>
                                    <textarea rows={5} value={bio} onChange={(e) => setBio(e.currentTarget.value)} className="outline-0 bg-pale  rounded py-4 px-6" placeholder="brief description about your operations" />
                                </div>
                                <div className="mt-6 flex gap-3 w-full">
                                    <button onClick={() => setSetupStep(prev => prev - 1)} className="btn flex-1 rounded-full bg-pale">Back</button>
                                    <button onClick={() => setSetupStep(prev => prev + 1)} className="btn flex-1 rounded-full bg-primary text-white disabled:opacity-60">{setupSaving ? "Saving..." : "next"}</button>
                                </div>
                            </div>
                        )}


                        {setupStep === 5 && (
                            <div className="mt-6 space-y-1 flex  flex-col">
                                <h2 className=" font-medium mt-5 text-lg">Privacy</h2>
                                <p className="text-sm text-text/60">Would you like to have you phone number visible to all users on the platform </p>
                                <div className="flex items-center mt-6 justify-between">

                                    <button onClick={() => setSetupStep(prev => prev - 1)} className="btn  bg-pale">Back</button>

                                    <div className="flex gap-3 items-center justify-end">
                                        <button onClick={() => handlePhoneVisibility(false)} className="btn bg-pale">NO</button>
                                        <button onClick={() => handlePhoneVisibility(true)} className="btn bg-primary text-white">YES</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {setupStep === 6 && (
                            <div className="mt-6 space-y-1 flex items-center flex-col">
                                <PhotoUpload value={setupPhoto} setValue={setSetupPhoto} />
                                <h2 className=" font-medium mt-5">Profile picture</h2>
                                <p className="text-sm text-text/60">Please provide your profile picture</p>
                                <div className="mt-6 flex gap-3 w-full">
                                    <button onClick={() => setSetupStep(prev => prev - 1)} className="btn flex-1 rounded-full bg-pale">Back</button>
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

            {/* terms modal  */}
            <BottomSheet open={showTerms} onDismiss={() => setShowTerms(false)} ref={sheetRef} className="z-000">
                <div className="py-10 px-4 min-h-[26vh] flex justify-start flex-col gap-4">
                    <h3 className="text-xl font-semibold">Terms & conditions</h3>

                    <div className="text-text/60 leading-7  space-y-3">
                        <p>
                            By continuing, you agree to let us collect your profile details
                            (name, email, phone, photo) and, if you list a property, its images,
                            location, and price — used only to run your account, show your
                            listings, and connect you with interested renters.
                        </p>
                        <p>
                            You can view, correct, or delete your data at any time from
                            Settings, or by contacting our support team, in line with Uganda's
                            Data Protection and Privacy Act, 2019.
                        </p>
                        <button
                            onClick={() => navigate("/terms")}
                            className="underline text-primary mb-5 outline-0"
                        >
                            Read full Terms & Data Policy
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* <button onClick={() => setShowTerms(false)} className="btn border border-primary/50 text-primary w-full rounded-full">
                            Not now
                        </button> */}
                        <button
                            onClick={() => { setShowTerms(false); handleAuthSuccess(signupData as AuthSuccessI) }}
                            className="btn bg-primary text-white w-full rounded-full"
                        >
                            Agree & continue
                        </button>
                    </div>
                </div>
            </BottomSheet>
        </div>
    )
}

export default PhoneAuth