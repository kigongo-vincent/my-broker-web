import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import Logo from "../components/base/Logo";

const onboardingSteps = [
    {
        title: "Find your next place",
        description: "Browse trusted rentals, short stays, and homes in one calm experience.",
    },
    {
        title: "Chat with verified brokers",
        description: "Open conversations, share details, and move faster from interest to viewing.",
    },
    {
        title: "List and manage with ease",
        description: "Post your own properties and keep everything aligned with your account.",
    },
];

const Index = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);

    const currentStep = useMemo(() => onboardingSteps[step], [step]);

    return (
        <div className="flex h-screen w-full items-center justify-center overflow-hidden bg-paper px-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="flex w-full max-w-md flex-col items-center text-center"
                >
                    <Logo className="h-24 w-24" />
                    <h1 className="mt-4 text-3xl font-semibold">My Broker</h1>
                    <p className="mt-2 text-sm leading-6 text-text/60">{currentStep.description}</p>

                    <div className="mt-8 flex gap-2">
                        {onboardingSteps.map((_, index) => (
                            <span
                                key={index}
                                className={`h-2 w-2 rounded-full ${index === step ? "bg-primary" : "bg-text/20"}`}
                            />
                        ))}
                    </div>

                    <div className="mt-8 flex w-full flex-col gap-3">
                        {step < onboardingSteps.length - 1 ? (
                            <button onClick={() => setStep((value) => value + 1)} className="btn w-full rounded-full bg-primary text-white">
                                Continue
                            </button>
                        ) : (
                            <button onClick={() => navigate("/auth")} className="btn w-full rounded-full bg-primary text-white">
                                Start exploring
                            </button>
                        )}
                        <button onClick={() => navigate("/auth")} className="btn w-full rounded-full bg-pale text-text">
                            Skip for now
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default Index;