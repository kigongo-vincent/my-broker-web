import { Route, Routes } from "react-router"
import user from "./tabs/user"
import admin from "./tabs/admin"
import Layout from "../components/pages/tabs/Layout"


const tabs = () => {
    return (
        <Layout>
            <Routes>
                <Route path="/user/*" Component={user} />
                <Route path="/admin/*" Component={admin} />
            </Routes>
        </Layout>
    )
}

export default tabs