import { ReactNode } from "react"
import { useUserStore } from "../../store/auth"
import { Navigate } from "react-router"

export interface Props {
    children: ReactNode
}

const AuthProtector = ({ children }: Props) => {

    const { token } = useUserStore()
    if (token == "") return <Navigate to={"/tabs/user"} />

    return children
}

export default AuthProtector