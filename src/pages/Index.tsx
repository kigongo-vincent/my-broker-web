import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import Logo from "../components/base/Logo";

const Index = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timeout = setTimeout(() => {
            navigate("/auth/");
        }, 1500);

        return () => clearTimeout(timeout);
    }, [navigate]);

    return (
        <div className="flex h-screen items-center justify-center">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                >
                    <Logo className="h-34" />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default Index;