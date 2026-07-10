import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import Logo from "../components/base/Logo";

const Index = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timeout = setTimeout(() => {
            navigate("/tabs/user");
        }, 2000);

        return () => clearTimeout(timeout);
    }, [navigate]);

    return (
        <div className="flex h-screen items-center overflow-hidden w-full justify-center">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, scale: 25 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 25 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                >
                    <Logo className="h-34" />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default Index;