
import { useMemo, useState } from "react"
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

interface PhoneAuthRequest {
    phone: string
    code?: string
    pinCode?: string
    step: number
}


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

    const [fees, setFees] = useState(0)
    const [bio, setBio] = useState("")


    const [error, setError] = useState("")
    const [isBroker, setIsBroker] = useState(false)
    const [pin1, setpin1] = useState("")
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
        setShowSetupModal(true)
    }

    const step2 = async () => {

        try {
            setLoading(true)
            // if (pin1 != pin2 && (pin1 != "" && pin2 != "")) {
            //     setError("password mismatch, ensure you use the same value for the password fields")
            //     return
            // }

            if (pin1?.length < 4) {
                setError("please complete the pin")
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
                <h3 className="text-2xl  font-semibold  -mb-5">My Broker</h3>
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

                <h3 className="text-2xl  font-semibold  -mb-5">Create pin</h3>
                <p className="  text-center text-text/50  text-sm leading-6 mt-2 max-w-[80%]">please create a new pin you will use when accessing the platform</p>
                <p className="text-text/50 text-sm mt-1"></p>
                <br />
                <PinInput value={pin1} onChange={setpin1} />
                <button onClick={step2} className="btn rounded-full bg-primary text-white w-full">
                    <Loader loading={loading}>
                        continue
                    </Loader>
                </button>
                <div className="flex items-center gap-1 justify-center">
                    not sure about the phone number, <span onClick={() => setStep(1)} className="underline text-primary" >go back</span>
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
        , [step, phone, pin1, loading])

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

                <Modal position="center" hideClose open={showSetupModal} onClose={() => { setShowSetupModal(false); navigate("/tabs/user/") }}>
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

                                    <div className="flex items-center justify-end">
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

                                    <div className="flex items-center justify-end">
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
        </div>
    )
}

export default PhoneAuth