import { HTMLAttributes } from "react"
import LogoIcon from "../../assets/app-icon.png"
import { motion } from "framer-motion"
import { useNavigate } from "react-router"
export interface Props extends HTMLAttributes<HTMLDivElement> { }

const Logo = ({ className }: Props) => {

    const navigate = useNavigate()

    return (
        <motion.img
            onClick={() => navigate("/")}
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            src={LogoIcon} alt="" className={className} />
    )
}

export default Logo