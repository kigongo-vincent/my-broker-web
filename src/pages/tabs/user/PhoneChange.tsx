import { useMemo, useState } from "react"
import Header from "../../../components/pages/tabs/Header"
import { Shell, StepI } from "./Upload"
import { useNavigate } from "react-router"


const PhoneChange = () => {
    const [current, setCurrent] = useState(1)
    const navigate = useNavigate()

    const steps: StepI[] = useMemo(() => [
        {
            content: <Shell onNext={() => setCurrent(prev => prev + 1)}>

                <div className="mt-[8vh] ">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm">Old phone number</span>
                        <input type="number" className="outline-0 bg-pale h-14 rounded-lg px-6" placeholder="(256) 7XXXXXXX" />
                    </div>
                </div>
            </Shell>,
            id: 1,
        },
        {
            content: <Shell onNext={() => setCurrent(prev => prev + 1)} onBack={() => setCurrent(prev => prev - 1)}>

                <div className="mt-[8vh] ">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm">New phone number</span>
                        <input type="number" className="outline-0 bg-pale h-14 rounded-lg px-6" placeholder="(256) 7XXXXXXX" />
                    </div>
                </div>
            </Shell>,
            id: 2,
        },
        {
            content: <Shell onNext={() => navigate(`/`)} onBack={() => setCurrent(prev => prev - 1)}>

                <div className="mt-[8vh] ">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm">Verification code</span>
                        <input type="number" className="outline-0 bg-pale h-14 rounded-lg px-6" placeholder="**********" />
                    </div>
                </div>
            </Shell>,
            id: 3,
        },
    ] as StepI[], [])


    const currentStep = steps?.find(s => s?.id == current)

    return (
        <div>
            <Header back />
            {currentStep?.content}
        </div>
    )
}

export default PhoneChange