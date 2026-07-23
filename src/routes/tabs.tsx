import { Route, Routes } from "react-router"
import user from "./tabs/user"
import admin from "./tabs/admin"
import Layout from "../components/pages/tabs/Layout"
import { useQuery } from "@tanstack/react-query"
import { Post } from "../../api"
import { useUserStore } from "../store/auth"
import { VerificationRequest } from "../pages/tabs/user/Verify"
import { useEffect } from "react"
import NotFound from "../pages/NotFound"


const tabs = () => {
    const { token, getUser, setUser } = useUserStore()
    const { data } = useQuery({
        queryKey: ["requests-list"],
        queryFn: async () =>
            token != "" ?
                Post<unknown, VerificationRequest[]>("requests/list", null) : null,
    })

    useEffect(() => {
        if (token != "") {
            if (!data?.data?.length) return

            const status = data.data[0]?.status

            setUser?.({
                ...getUser(),
                verification: status,
            })
        }
    }, [data])
    return (
        <Layout>
            <Routes>
                <Route path="/user/*" Component={user} />
                <Route path="/admin/*" Component={admin} />
                <Route path="/*" Component={NotFound} />
            </Routes>
        </Layout>
    )
}

export default tabs