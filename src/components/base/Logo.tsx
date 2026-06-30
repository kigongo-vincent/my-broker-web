import { HTMLAttributes } from "react"
import LogoIcon from "../../assets/app-icon.png"
import { motion } from "framer-motion"
export interface Props extends HTMLAttributes<HTMLDivElement> { }

const Logo = ({ className }: Props) => {
    return (
        <motion.img
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            src={LogoIcon} alt="" className={className} />
    )
}

export default Logo