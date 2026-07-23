import { Activity, useEffect, useState } from "react"
import Header from "../../../components/pages/tabs/Header"
import { BrokerDetails, UserI, useUserStore } from "../../../store/auth"
import PhotoUpload from "../../../components/base/PhotoUpload"
import Modal from "../../../components/base/Modal"
import Loader from "../../../components/base/Loader"
import { Put } from "../../../../api"
import { useNavigate } from "react-router"

const Account = () => {

    const { user, setUser } = useUserStore()
    const u = user as UserI

    const [editing, setEditing] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const [name, setName] = useState(u?.name ?? "")
    const [email, setEmail] = useState(u?.email ?? "")
    const [photo, setPhoto] = useState(u?.photo ?? "")
    const [fee, setFee] = useState(u?.BrokerDetails?.Fee ?? "")
    const [bio, setBio] = useState(u?.BrokerDetails?.Bio ?? "")
    const navigate = useNavigate()

    // keep local fields in sync with the store whenever we're not mid-edit
    useEffect(() => {
        if (editing) return
        setName(u?.name ?? "")
        setEmail(u?.email ?? "")
        setPhoto(u?.photo ?? "")
        setFee(u?.BrokerDetails?.Fee ?? "")
        setBio(u?.BrokerDetails?.Bio ?? "")
    }, [u, editing])

    const handleCancel = () => {
        setName(u?.name ?? "")
        setEmail(u?.email ?? "")
        setPhoto(u?.photo ?? "")
        setFee(u?.BrokerDetails?.Fee ?? "")
        setBio(u?.BrokerDetails?.Bio ?? "")
        setEditing(false)
    }

    const handleSave = async () => {
        if (!name.trim()) {
            setError("Please add your name so we can update your profile.")
            return
        }

        setSaving(true)
        try {
            const body = {
                name: name.trim(),
                email: email.trim(),
                photo: photo?.trim?.() ?? photo,
                role: u?.role,
                BrokerDetails: u?.role === "broker"
                    ? ({ Fee: fee, Bio: bio } as BrokerDetails)
                    : u?.BrokerDetails
            }
            const { data } = await Put<unknown, UserI>("me/", body)
            setUser?.(data)
            navigate("/tabs/user")
        } catch {
            setError("We could not save your profile details yet. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <Header back />
            <div className=" pb-[5vh] flex flex-col gap-4 p-4">

                <div className=" flex justify-center">
                    <PhotoUpload value={photo} setValue={setPhoto} />
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-sm">Name</span>
                    <input
                        disabled={!editing}
                        value={name}
                        onChange={(e) => setName(e.currentTarget.value)}
                        type="text"
                        className="outline-0 bg-pale h-14 rounded-lg px-6 text-text/50 disabled:text-text/50"
                        placeholder="john mccathy" />
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-sm">Email</span>
                    <input
                        disabled={!editing}
                        value={email}
                        onChange={(e) => setEmail(e.currentTarget.value)}
                        type="email"
                        className="outline-0 bg-pale h-14 rounded-lg px-6 text-text/50"
                        placeholder="you@example.com" />
                </div>

                <Activity mode={u?.role == "broker" ? "visible" : "hidden"}>

                    <div className="w-full flex flex-col gap-2">
                        <p className="text-sm">Broker details</p>
                        <textarea
                            value={bio}
                            disabled={!editing}
                            onChange={(e) => setBio(e.currentTarget.value)}
                            rows={5}
                            className="bg-pale outline-0 text-text/50 w-full p-4 rounded"
                            placeholder="broker details" />
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        <p className="text-sm">Broker fees</p>
                        <input
                            value={fee}
                            disabled={!editing}
                            onChange={(e) => setFee(e.currentTarget.value)}
                            className="bg-pale text-text/50 w-full p-4 rounded"
                            placeholder="broker fees" />
                    </div>

                </Activity>

                {editing ? (
                    <div className="flex gap-3 mt-4">
                        <button onClick={handleCancel} className="btn flex-1 rounded-full bg-pale">
                            cancel
                        </button>
                        <button onClick={handleSave} disabled={saving} className="btn flex-1 rounded-full bg-primary text-white disabled:opacity-60">
                            <Loader loading={saving}>save</Loader>
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setEditing(true)} className="btn rounded-full bg-primary text-white mt-4">

                    </button>
                )}

                <Modal
                    actions={<button onClick={() => setError("")} className="btn bg-primary text-white">ok</button>}
                    open={error?.length != 0} onClose={() => setError("")}>
                    <p className="text-xl font-semibold text-danger">Update Error</p>
                    <p className="text-text/50 text-sm mt-1">{error}</p>
                    <br />
                </Modal>
            </div>
        </div>
    )
}

export default Account