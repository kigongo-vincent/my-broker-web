// @ts-nocheck
import { useState } from "react"
import Header from "../../../components/pages/tabs/Header"
import FlexRender from "../../../components/base/FlexRender"
import { UserI } from "../../../store/auth"
import { User } from "../../../components/pages/tabs/Post"
import Lineicons from "@lineiconshq/react-lineicons"
import { MenuMeatballs1Solid } from "@lineiconshq/free-icons"


const Users = () => {
    const tabs = ["users", "admins", "brokers"]

    const [seletcedTab, setSlelectedTab] = useState(tabs[0])

    const [users, setUsers] = useState<Partial<UserI>[]>([
        { name: "Sarah Nakato", photo: "https://i.pravatar.cc/150?img=1", verified: true, role: "admin", broker: false, lastSeen: "2 minutes ago" },
        { name: "David Mukasa", photo: "https://i.pravatar.cc/150?img=2", role: "user", broker: true, lastSeen: "1 hour ago" },
        { name: "Grace Namuli", photo: "https://i.pravatar.cc/150?img=3", role: "user", broker: false, lastSeen: "4 days back" },
        { name: "James Okello", photo: "https://i.pravatar.cc/150?img=4", role: "user", broker: true, lastSeen: "just now" },
        { name: "Patricia Auma", photo: "https://i.pravatar.cc/150?img=5", role: "user", broker: false, lastSeen: "3 hours ago" },
        { name: "Brian Ssekandi", photo: "https://i.pravatar.cc/150?img=6", role: "user", broker: false, lastSeen: "yesterday" },
        { name: "Esther Nabirye", photo: "https://i.pravatar.cc/150?img=7", role: "user", broker: true, lastSeen: "2 weeks back" },
    ]);
    return (
        <div>
            <Header back />
            <div className="mt-[8vh] p-4">
                <FlexRender row className="flex-row my-4 gap-2" items={tabs} render={(item, index) => <div
                    onClick={() => setSlelectedTab(item)}
                    className={` px-5 py-3  cursor-pointer flex-1 text-center ${seletcedTab == item && "border-b-2 border-primary text-primary"}`} key={index}>{item}
                </div>} />
                <br />
                <FlexRender className="gap-8" items={users} render={(item, index) => <User  {...item as UserI} actions={<><Lineicons icon={MenuMeatballs1Solid} /></>} key={index} />} />
            </div>
        </div>
    )
}

export default Users