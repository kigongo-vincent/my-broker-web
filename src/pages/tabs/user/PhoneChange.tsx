import { useState } from "react"
import Header from "../../../components/pages/tabs/Header"
import PhoneInput from "../../../components/base/Phone"
import { UserI, useUserStore } from "../../../store/auth"
import { useAppStore } from "../../../store/app"
import Loader from "../../../components/base/Loader"
import { Put } from "../../../../api"
import { useNavigate } from "react-router"


const PhoneChange = () => {

    const [step, setStep] = useState(1)
    const [phone1, setPhone1] = useState("") // new phone
    const [phone2, setPhone2] = useState("") // confirm new phone
    const [loading, setLoading] = useState(false)
    const { getUser, setUser } = useUserStore()
    const { setError, setSuccess } = useAppStore()
    const navigate = useNavigate()


    const ErrorTitle = "Phone change error"

    const validateStep1 = () => {
        if (phone1?.length < 11) {
            setError({ title: ErrorTitle, body: "invalid phone number " })
            return 1
        }
        if (phone1 == "") {
            setError({ title: ErrorTitle, body: "phone number is required" })
            return 1
        }
    }

    const validateStep2 = () => {
        if (phone2?.length < 11) {
            setError({ title: ErrorTitle, body: "invalid phone number " })
            return 1
        }
        if (phone1 == "" || phone2 == "") {
            setError({ title: ErrorTitle, body: "phone number is required" })
            return 1
        }
        if (phone1 != phone2) {
            setError({ title: ErrorTitle, body: "phone number mismatch" })
            return 1
        }
    }

    const handleStep1Continue = () => {
        const code = validateStep1()
        if (code == 1) {
            return
        }
        setStep(2)
    }

    const handleBackToStep1 = () => {
        setPhone2("")
        setStep(1)
    }

    const onSubmit = async () => {
        const code = validateStep2()
        if (code == 1) {
            return
        }

        setLoading(true)
        try {
            const { data, status, msg } = await Put<Partial<UserI>, UserI>("me", { phone: phone1, name: getUser()?.name })
            if (status != 200) {
                setError({ title: ErrorTitle, body: msg })
                return
            }
            setUser?.(data)
            setSuccess({ title: "phone updated successfully", body: "your phone number has beed updated successfully" })
            navigate(-1)
        } catch (error) {

        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <Header back title="phone change" caption="update your contact" />
            <div className="px-4 flex flex-col gap-6">
                {step === 1 && (
                    <>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-text/50">new phone*</p>
                            <PhoneInput placeholder="old phone number" defaultValue={getUser()?.phone} value={phone1} onChange={setPhone1} />
                        </div>

                        <div className="flex items-center justify-end gap-4">
                            <button className="btn bg-pale flex-1" onClick={() => navigate(-1)}>cancel</button>
                            <button className="btn bg-primary flex-1" onClick={handleStep1Continue}>
                                next
                            </button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-text/50">confirm new phone*</p>
                            <PhoneInput placeholder="old phone number" value={phone2} onChange={setPhone2} />
                        </div>

                        <div className="flex items-center justify-end gap-4">
                            <button className="btn bg-pale flex-1" onClick={handleBackToStep1}>back</button>
                            <button className="btn bg-primary flex-1" onClick={onSubmit}>
                                <Loader loading={loading}>
                                    confirm
                                </Loader>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default PhoneChange