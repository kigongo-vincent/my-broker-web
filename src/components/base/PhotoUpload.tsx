import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useUserStore } from "../../store/auth"
import { CameraIcon } from "@heroicons/react/24/solid"
import { compressImage, uploadToCloudinary } from "../../hooks/posts"

export interface Props {
    value: string
    setValue: (v: string) => void
    readOnly?: boolean
}

interface UploadAvatarInput {
    image: File
    onProgress?: (progress: number) => void
}

const PhotoUpload = ({ value, setValue, readOnly }: Props) => {
    const { getUserPhoto } = useUserStore()
    const [file, setFile] = useState<File>()
    const [previewUrl, setPreviewUrl] = useState<string>("")
    const [uploadProgress, setUploadProgress] = useState<number>(0)

    const { mutate, isPending } = useMutation({
        mutationFn: async (input: UploadAvatarInput): Promise<string> => {
            const compressedBlob = await compressImage(input.image, {
                maxWidthOrHeight: 200,
                quality: 0.8,
                maxSizeMB: 0.1,
            })

            const avatarUrl = await uploadToCloudinary(
                compressedBlob,
                "avatars",
                `avatar-${Date.now()}`,
                input.onProgress
            )

            return avatarUrl
        },
    })

    useEffect(() => {
        if (!file) return

        const localUrl = URL.createObjectURL(file)
        setPreviewUrl(localUrl)

        mutate(
            {
                image: file,
                onProgress: (pct) => setUploadProgress(pct),
            },
            {
                onSuccess: (remoteUrl) => {
                    setValue(remoteUrl)
                },
                onError: (error) => {
                    console.error("Avatar upload failed:", error)
                },
            }
        )

        return () => URL.revokeObjectURL(localUrl)
    }, [file, mutate, setValue])

    const imageSrc = previewUrl || value || (getUserPhoto ? getUserPhoto("") : "") || "/fallback-avatar.png"

    return (
        <div className="relative h-30 w-30 overflow-hidden rounded-full ">
            {/* Main Avatar Image */}
            <img
                src={imageSrc}
                className={`h-full w-full absolute rounded-full object-cover transition-opacity duration-200 ${isPending ? "opacity-40" : "opacity-100"
                    }`}
                alt="Profile preview"
            />

            {/* Dynamic UI Overlay - Always visible dark backdrop */}
            <div className={`absolute h-full w-full flex flex-col items-center justify-center left-0 top-0 text-white transition-colors duration-200 ${isPending ? "bg-black/60" : "bg-black/40"
                }`}>
                {isPending ? (
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                        <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-1" />
                        <span className="text-[10px] font-mono font-semibold">{uploadProgress}%</span>
                    </div>
                ) : (
                    /* FIXED: Removed opacity-0 and group-hover states to keep icon visible */
                    <CameraIcon className={`h-10 w-10 pointer-events-none ${readOnly && "hidden"}`} />
                )}
            </div>

            {/* Invisible native input layered over the top */}
            <input
                type="file"
                accept="image/*"
                disabled={isPending}
                className="absolute h-full w-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                onChange={(e) => {
                    const selectedFile = e.currentTarget?.files?.[0]
                    if (selectedFile) setFile(selectedFile)
                }}
            />
        </div>
    )
}

export default PhotoUpload
