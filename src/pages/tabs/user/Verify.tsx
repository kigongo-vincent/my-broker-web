import { CheckBadgeIcon } from "@heroicons/react/20/solid"
import { ArrowUpTrayIcon, XMarkIcon, IdentificationIcon, ArrowPathIcon } from "@heroicons/react/24/outline"
import Header from "../../../components/pages/tabs/Header"
import { useEffect, useMemo, useRef, useState } from "react"
import { UserI, useUserStore } from "../../../store/auth"
import { StepI } from "./Upload"
import Loader from "../../../components/base/Loader"
import { compressImage, uploadToCloudinary } from "../../../hooks/posts"
import { Post } from "../../../../api"
import { useNavigate } from "react-router"

export interface VerificationRequest {
    ID: number
    userId: number
    user: UserI
    attachments: string[]
    status: "pending" | "approved" | "cancelled"
}
const TOTAL_STEPS = 3

interface UploadedFile {
    file: File
    preview: string
}

// ---- reusable dropzone for image uploads (mobile-first: tap only, no drag/drop) ----
interface FileDropzoneProps {
    id: string
    label: string
    hint: string
    value: UploadedFile | null
    aspect?: string
    onSelect: (file: File) => void
    onRemove: () => void
}

const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const FileDropzone = ({ id, label, hint, value, aspect = "aspect-video", onSelect, onRemove }: FileDropzoneProps) => {
    // const [debug setDebug] = useState("waiting for tap")

    // Stop the gesture from bubbling to any ancestor handler that might call
    // preventDefault() and suppress the browser's native file-chooser action.
    const guard = (e: React.SyntheticEvent) => {
        e.stopPropagation()
    }

    const handleTap = (e: React.SyntheticEvent) => {
        guard(e)
        // setDebug("tapped — waiting for OS picker")
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        // setDebug(
        //     files && files.length > 0
        //         ? `got "${files[0].name}" (${formatSize(files[0].size)}, ${files[0].type})`
        //         : "onChange fired but no file (dialog cancelled?)"
        // )

        const file = files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            // setDebug(`rejected — "${file.name}" is not an image (${file.type})`)
            return
        }

        onSelect(file)
        // reset so selecting the same file again still fires onChange
        e.target.value = ""
    }

    return (
        <div className="rounded-2xl border border-text/10 bg-text/[0.02] p-3 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary shrink-0">
                    <IdentificationIcon className="h-4.5 w-4.5" />
                </span>
                <div className="flex flex-col leading-tight">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-text/40">{hint}</span>
                </div>
            </div>

            {value ? (
                <div className={`relative rounded-xl overflow-hidden ${aspect}`}>
                    <img src={value.preview} alt={label} className="w-full h-full object-cover" />

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent px-3 pt-6 pb-2 flex items-center justify-between gap-2 pointer-events-none">
                        <span className="text-white text-xs truncate">
                            {value.file.name} · {formatSize(value.file.size)}
                        </span>
                        <span className="flex items-center gap-1 text-white text-xs shrink-0">
                            <ArrowPathIcon className="h-3.5 w-3.5" />
                            Replace
                        </span>
                    </div>

                    <input
                        id={id}
                        type="file"
                        accept="image/*"
                        onClick={handleTap}
                        onTouchStart={guard}
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full opacity-0 z-10"
                        style={{ fontSize: "16px" }}
                    />

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            onRemove()
                            // setDebug("removed")
                        }}
                        aria-label={`Remove ${label.toLowerCase()}`}
                        className="absolute top-2 right-2 z-20 bg-black/60 text-white rounded-full p-1.5 active:bg-black/80 transition-colors"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div
                    className={`relative flex flex-col items-center justify-center gap-2 ${aspect} rounded-xl border-2 border-dashed border-text/15 bg-text/[0.015] active:border-primary active:bg-primary/5 transition-colors`}
                >
                    <span className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
                        <ArrowUpTrayIcon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium">Tap to upload</span>
                    <span className="text-xs text-text/40">PNG or JPG, up to 10MB</span>
                    <input
                        id={id}
                        type="file"
                        accept="image/*"
                        onClick={handleTap}
                        onTouchStart={guard}
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ fontSize: "16px" }}
                    />
                </div>
            )}

        </div>
    )
}

const Verify = () => {
    const [pending, setPending] = useState(false)
    const [activeStep, setActiveStep] = useState(0) // 0 = flow not open, 1..3 = active step
    const [error, setError] = useState("")

    // capture / upload state — all three use the same { file, preview } shape
    const [selfie, setSelfie] = useState<UploadedFile | null>(null)
    const [idFront, setIdFront] = useState<UploadedFile | null>(null)
    const [idBack, setIdBack] = useState<UploadedFile | null>(null)

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [loading, setLoading] = useState(false)

    const { getUser } = useUserStore()
    console.log(getUser()?.verification)
    const user = getUser()
    const verification = user?.verification
    const navigate = useNavigate()
    const alreadyHandled = verification === "approved" || verification === "pending"

    // ---- camera handling (step 1) ----
    useEffect(() => {
        if (activeStep !== 1 || selfie) return

        let cancelled = false

        if (!navigator.mediaDevices?.getUserMedia) {
            setError("Camera is not supported on this device or browser.")
            return
        }

        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: "user" } })
            .then((stream) => {
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop())
                    return
                }
                streamRef.current = stream
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                }
            })
            .catch(() => {
                setError("Camera access was denied. Please allow camera permissions to continue.")
            })

        return () => {
            cancelled = true
            streamRef.current?.getTracks().forEach((t) => t.stop())
            streamRef.current = null
        }
    }, [activeStep, selfie])

    const capturePhoto = () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(
            (blob) => {
                if (!blob) return
                const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" })
                const preview = URL.createObjectURL(file)
                setSelfie({ file, preview })
            },
            "image/jpeg",
            0.9
        )

        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
    }

    const retakePhoto = () => {
        setSelfie((prev) => {
            if (prev) URL.revokeObjectURL(prev.preview)
            return null
        })
    }

    // ---- id upload handling (step 2) ----
    const setIdFile = (side: "front" | "back", file: File) => {
        const preview = URL.createObjectURL(file)
        const uploaded: UploadedFile = { file, preview }

        if (side === "front") {
            setIdFront((prev) => {
                if (prev) URL.revokeObjectURL(prev.preview)
                return uploaded
            })
        } else {
            setIdBack((prev) => {
                if (prev) URL.revokeObjectURL(prev.preview)
                return uploaded
            })
        }
    }

    const removeIdFile = (side: "front" | "back") => {
        if (side === "front") {
            setIdFront((prev) => {
                if (prev) URL.revokeObjectURL(prev.preview)
                return null
            })
        } else {
            setIdBack((prev) => {
                if (prev) URL.revokeObjectURL(prev.preview)
                return null
            })
        }
    }

    // revoke all object URLs on unmount
    useEffect(() => {
        return () => {
            if (selfie) URL.revokeObjectURL(selfie.preview)
            if (idFront) URL.revokeObjectURL(idFront.preview)
            if (idBack) URL.revokeObjectURL(idBack.preview)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ---- navigation ----
    const canGoNext = useMemo(() => {
        if (activeStep === 1) return !!selfie
        if (activeStep === 2) return !!idFront && !!idBack
        return true
    }, [activeStep, selfie, idFront, idBack])

    const goNext = () => {
        setError("")
        if (!canGoNext) return
        setActiveStep((s) => Math.min(s + 1, TOTAL_STEPS))
    }

    const goBack = () => {
        setError("")
        setActiveStep((s) => Math.max(s - 1, 1))
    }

    const resetFlow = () => {
        setActiveStep(0)
        setSelfie((prev) => {
            if (prev) URL.revokeObjectURL(prev.preview)
            return null
        })
        setIdFront((prev) => {
            if (prev) URL.revokeObjectURL(prev.preview)
            return null
        })
        setIdBack((prev) => {
            if (prev) URL.revokeObjectURL(prev.preview)
            return null
        })
        setError("")
    }

    // ---- submission ----
    const handleRequest = async () => {
        if (alreadyHandled || pending) return

        // first click opens the step flow instead of submitting immediately
        if (activeStep === 0) {
            setActiveStep(1)
            return
        }

        // guard: shouldn't be reachable since Submit button is disabled until canGoNext,
        // but double-check before firing the request
        if (!selfie || !idFront || !idBack) {
            setError("Please complete all steps before submitting.")
            return
        }

        setPending(true)
        setError("")
        try {
            // TODO: replace with the real verification submission call, e.g.:
            // const form = new FormData()
            // form.append("selfie", selfie.file)
            // form.append("idFront", idFront.file)
            // form.append("idBack", idBack.file)
            // await api.post("/verification", form)

            // upload selfie 
            setLoading(true)
            const s = await compressImage(selfie.file, { maxWidthOrHeight: 400, quality: .5 })
            const s1 = await uploadToCloudinary(s, `approve-user-${getUser()?.ID}`, "selfie")
            const f = await compressImage(selfie.file, { maxWidthOrHeight: 400, quality: .5 })
            const f1 = await uploadToCloudinary(f, `approve-user-${getUser()?.ID}`, "front")
            const b = await compressImage(selfie.file, { maxWidthOrHeight: 400, quality: .5 })
            const b1 = await uploadToCloudinary(b, `approve-user-${getUser()?.ID}`, "back")
            const { msg, status } = await Post<{ attachments: string[] }, unknown>("requests", { attachments: [s1, f1, b1] })
            if (status != 200) {
                setError(msg)
                return
            }
            navigate(-1)

            // upload back 

            // upload front 



            resetFlow()
        } catch (e) {
            setError("Something went wrong submitting your request. Please try again.")
        } finally {
            setPending(false)
            setLoading(false)
        }
    }



    const steps: StepI[] = useMemo(
        () => [
            {
                id: 1,
                content: (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-text/60 text-sm text-center">
                            Position your face in the frame and capture a clear photo.
                        </p>
                        {selfie ? (
                            <>
                                <img
                                    src={selfie.preview}
                                    alt="Captured"
                                    className="rounded-2xl w-full aspect-square object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={retakePhoto}
                                    className="text-primary text-sm font-medium"
                                >
                                    Retake photo
                                </button>
                            </>
                        ) : (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="rounded-2xl w-full max-h-[30vh] aspect-square object-cover bg-black"
                                />
                                <canvas ref={canvasRef} className="hidden" />
                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    className="btn bg-primary text-white rounded-full w-full"
                                >
                                    Capture photo
                                </button>
                            </>
                        )}
                    </div>
                )
            },
            {
                id: 2,
                content: (
                    <div className="flex flex-col gap-4">
                        <p className="text-text/60 text-sm text-center">
                            Upload clear photos of the front and back of your ID.
                        </p>

                        <FileDropzone
                            id="id-front-input"
                            label="Front of ID"
                            hint="Make sure all four corners are visible"
                            value={idFront}
                            onSelect={(file) => setIdFile("front", file)}
                            onRemove={() => removeIdFile("front")}
                        />

                        <FileDropzone
                            id="id-back-input"
                            label="Back of ID"
                            hint="Make sure all four corners are visible"
                            value={idBack}
                            onSelect={(file) => setIdFile("back", file)}
                            onRemove={() => removeIdFile("back")}
                        />
                    </div>
                )
            },
            {
                id: 3,
                content: (
                    <div className="flex flex-col gap-4">
                        <p className="text-text/60 text-sm text-center">
                            Review your submission before sending it in.
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {selfie && (
                                <img src={selfie.preview} alt="Face" className="rounded-lg aspect-square object-cover" />
                            )}
                            {idFront && (
                                <img
                                    src={idFront.preview}
                                    alt="ID front"
                                    className="rounded-lg aspect-square object-cover"
                                />
                            )}
                            {idBack && (
                                <img
                                    src={idBack.preview}
                                    alt="ID back"
                                    className="rounded-lg aspect-square object-cover"
                                />
                            )}
                        </div>
                    </div>
                )
            }
        ],
        [selfie, idFront, idBack]
    )

    const currentStep = steps.find((s) => s.id === activeStep)

    return (
        <div>
            <Header back />
            <div className=" px-4">
                <div className="shadow-custom p-6 rounded-2xl dark:border border-text/10">
                    <h2 className="text-xl font-semibold">Face verification</h2>
                    <p className="leading-7 mt-2 text-text/50">
                        Verification earns you a <b>verification badge</b>, which represents you as an
                        authentic user of the platform.
                    </p>

                    {activeStep === 0 && (
                        <button
                            disabled={alreadyHandled || pending}
                            onClick={handleRequest}
                            className="btn bg-primary text-white mt-10 w-full rounded-full disabled:opacity-60"
                        >
                            <CheckBadgeIcon className="h-6 w-6" />
                            {
                                verification == "pending"
                                    ?
                                    "you have a pending request"
                                    :
                                    verification === "approved"
                                        ? "account verified"
                                        : verification === "cancelled"
                                            ? "request denied"
                                            : "request verification"}
                        </button>
                    )}

                    {activeStep > 0 && (
                        <div className="mt-8">
                            <div className="flex items-center gap-2 mb-6">
                                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 flex-1 rounded-full ${i < activeStep ? "bg-primary" : "bg-text/10"
                                            }`}
                                    />
                                ))}
                            </div>

                            {currentStep?.content}

                            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={activeStep === 1 ? resetFlow : goBack}
                                    disabled={pending}
                                    className="btn bg-text/10 text-text rounded-full flex-1 disabled:opacity-60"
                                >
                                    {activeStep === 1 ? "Cancel" : "Back"}
                                </button>

                                {activeStep < TOTAL_STEPS ? (
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        disabled={!canGoNext}
                                        className="btn bg-primary text-white rounded-full flex-1 disabled:opacity-60"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleRequest}
                                        disabled={pending}
                                        className="btn bg-primary text-white rounded-full flex-1 disabled:opacity-60"
                                    >
                                        <Loader loading={loading}>
                                            submit
                                        </Loader>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <br />
        </div>
    )
}

export default Verify