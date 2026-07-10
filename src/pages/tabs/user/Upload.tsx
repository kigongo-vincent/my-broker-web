
import { GallerySolid, MapMarker5Solid, Trash3Solid, XmarkSolid } from "@lineiconshq/free-icons";
import Lineicons from "@lineiconshq/react-lineicons";
import { HTMLAttributes, ReactNode, useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import Modal from "../../../components/base/Modal";
import { useUploadImages, PostAsset } from "../../../hooks/posts";

import commercialIcon from "../../../assets/upload/commercial.png";
import residentialIcon from "../../../assets/upload/residential.png";
import hostelIcon from "../../../assets/upload/hostel.png";
import electricityIcon from "../../../assets/upload/electricity.png";
import waterIcon from "../../../assets/upload/water.png";
import parkingIcon from "../../../assets/upload/parking.png";
import trashIcon from "../../../assets/upload/trash.png";
import { Currency, PostAssetI, PostI, PostType } from "../../../components/pages/tabs/Post";
import { Post } from "../../../../api";

/* ---------------------------------------------------------------------- */
/* Geocode cache — reverse/forward Nominatim lookups cached in localStorage */
/* so the silent location warm-up + "use current location" tap + repeated */
/* typeahead queries don't hammer the API (Nominatim usage policy is strict) */
/* ---------------------------------------------------------------------- */

const CACHE_KEY = "geocode-cache-v1";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const COORD_PRECISION = 4; // ~11m grid — nearby GPS reads collapse to one entry

interface CacheEntry<T = any> {
    value: T;
    timestamp: number;
}
type CacheStore = Record<string, CacheEntry>;

let memoryCache: CacheStore | null = null;

function loadCache(): CacheStore {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? (JSON.parse(raw) as CacheStore) : {};
    } catch {
        return {};
    }
}

function saveCache(cache: CacheStore) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
        // storage full/blocked — memoryCache still works for this session
    }
}

function getCache(): CacheStore {
    if (!memoryCache) memoryCache = loadCache();
    return memoryCache;
}

function readCache<T>(key: string): T | null {
    const cache = getCache();
    const entry = cache[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        delete cache[key];
        saveCache(cache);
        return null;
    }
    return entry.value as T;
}

function writeCache<T>(key: string, value: T) {
    const cache = getCache();
    cache[key] = { value, timestamp: Date.now() };
    saveCache(cache);
}

function coordKey(lat: number, lon: number) {
    return `rev:${lat.toFixed(COORD_PRECISION)},${lon.toFixed(COORD_PRECISION)}`;
}

function queryKey(query: string) {
    return `fwd:${query.trim().toLowerCase()}`;
}

export async function reverseGeocode(lat: number, lon: number): Promise<any> {
    const key = coordKey(lat, lon);
    const cached = readCache<any>(key);
    if (cached) return cached;

    const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    const data = await res.json();
    writeCache(key, data);
    return data;
}

export async function searchAddress(query: string): Promise<any[]> {
    const key = queryKey(query);
    const cached = readCache<any[]>(key);
    if (cached) return cached;

    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
        )}&limit=5`
    );
    const data = await res.json();
    writeCache(key, data);
    return data;
}

/* ---------------------------------------------------------------------- */
/* Types / shared UI                                                       */
/* ---------------------------------------------------------------------- */

export interface CategoryI {
    label: string;
    icon: string;
    selected?: boolean;
}
export interface StepI {
    id: number;
    content: ReactNode;
}

interface ShellProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    onBack?: () => void;
    onNext?: () => void;
    nextText?: string;
    disabled?: boolean;
    globalProgress?: number;
    showProgressBar?: boolean;
}

interface FilePickerOptions {
    accept?: string;
    multiple?: boolean;
}

export const openFilePicker = ({
    accept = "*/*",
    multiple = false,
}: FilePickerOptions = {}): Promise<File[]> => {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.multiple = multiple;

        input.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const files = target.files ? Array.from(target.files) : [];
            resolve(files);
        };

        input.click();
    });
};

const LinearProgress = ({ value }: { value: number }) => {
    const indeterminate = value <= 0;
    return (
        <div className="relative w-full h-1.5 rounded-full overflow-hidden bg-primary/15">
            {indeterminate ? (
                <>
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-primary rounded-full"
                        style={{ width: "40%" }}
                        animate={{ x: ["-40%", "120%"] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-primary/50 rounded-full"
                        style={{ width: "25%" }}
                        animate={{ x: ["-25%", "150%"] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                    />
                </>
            ) : (
                <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(value, 100)}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                />
            )}
        </div>
    );
};

export const Shell = ({
    onBack,
    onNext,
    children,
    className,
    nextText,
    disabled,
    globalProgress,
    showProgressBar,
}: ShellProps) => {
    return (
        <div className={`flex h-screen flex-col p-4 justify-between ${className}`}>
            <div className="overflow-y-auto mb-24">{children}</div>

            <div className="flex fixed bottom-5 px-4 left-0 w-full flex-col items-center gap-2 z-50">
                {showProgressBar && (
                    <div className="w-full mb-1">
                        <LinearProgress value={globalProgress ?? 0} />
                        <p className="text-[11px] text-text/50 mt-1">
                            {globalProgress && globalProgress > 0 ? `Uploading… ${globalProgress}%` : "Uploading…"}
                        </p>
                    </div>
                )}

                <div className="flex w-full items-center justify-between">
                    {onBack ? (
                        <button type="button" onClick={() => onBack?.()} className="btn bg-pale rounded-full w-max">
                            back
                        </button>
                    ) : (
                        <div />
                    )}
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onNext?.()}
                        className="btn bg-primary rounded-full text-white w-max disabled:opacity-50"
                    >
                        {nextText || (!onBack ? "confirm" : "next")}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface AnimatedSelectProps {
    options: { label: string; icon: string; value: string }[];
    selectedValue: string;
    onChange: (value: string) => void;
}

export const AnimatedSelect = ({ options, selectedValue, onChange }: AnimatedSelectProps) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            {options.map((option) => {
                const isSelected = selectedValue === option.value;
                return (
                    <div
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className="h-40 bg-pale relative rounded-xl flex items-center justify-center flex-col cursor-pointer"
                    >
                        {isSelected && (
                            <motion.div
                                layoutId="activeSelectionRing"
                                className="absolute inset-0 border border-primary bg-primary/5 rounded-xl z-0"
                                transition={{ duration: 0.2 }}
                            />
                        )}
                        <div className="relative z-10 flex flex-col items-center justify-center">
                            <img src={option.icon} className="h-16 mb-3 object-contain" alt="" />
                            <span className="font-medium capitalize text-sm">{option.label}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const getCroppedImg = (
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = imageSrc;
        image.setAttribute("crossOrigin", "anonymous");
        image.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("No 2d context"));

            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;

            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );

            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error("Canvas is empty"));
                    const file = new File([blob], `cropped-${Date.now()}.jpg`, { type: "image/jpeg" });
                    resolve(file);
                },
                "image/jpeg",
                0.95
            );
        };
        image.onerror = (err) => reject(err);
    });
};

/* ---------------------------------------------------------------------- */
/* Currency formatting helpers                                            */
/* ---------------------------------------------------------------------- */
const formatUGX = (n: number) => {
    if (!n && n !== 0) return "";
    return new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n);
};

const parseFormattedNumber = (s: string) => {
    const digits = s.replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
};

/* ---------------------------------------------------------------------- */
/* Main Form Component                                                    */
/* ---------------------------------------------------------------------- */
const Upload = () => {
    const navigate = useNavigate();

    // Step 1: upload images only — never creates a post record.
    const { mutate: uploadImages, mutateAsync: uploadImagesAsync, isPending: isUploadingImages } =
        useUploadImages();
    // Final step: create the post — called exactly once, on final submit.

    const [currentStepID, setCurrentStepID] = useState<number>(1);
    const [showNegotiationModal, setShowNegotiationModal] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
    const [uploadError, setUploadError] = useState<string | null>(null);

    const [locationLoading, setLocationLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const locationBoxRef = useRef<HTMLDivElement>(null);
    const [uploading, setUploading] = useState(false)

    // Assets returned by the (single) image upload pass — filled in once,
    // on the step 1 -> step 2 transition, then reused at final submit.
    const [uploadedAssets, setUploadedAssets] = useState<PostAsset[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    // Camera stream — single ref, no stale closures on step transitions
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraStatus, setCameraStatus] = useState<"loading" | "ready" | "denied">("loading");

    // Custom months-upfront pad selection
    const [monthsPad, setMonthsPad] = useState<"2" | "3" | "4" | "other">("2");

    const globalProgress = useMemo(() => {
        const values = Object.values(uploadProgress);
        if (!values.length) return 0;
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }, [uploadProgress]);

    const previewUrls = useMemo(() => {
        return selectedFiles.map((file) => URL.createObjectURL(file));
    }, [selectedFiles]);

    useEffect(() => {
        return () => {
            previewUrls.forEach((u) => URL.revokeObjectURL(u));
        };
    }, [previewUrls]);

    const [form, setForm] = useState({
        type: "residential",
        bathrooms: 0,
        bedrooms: 0,
        toilets: 0,
        negotiable: false,
        months: 2,
        units: 1,
        price: { Amount: 0, Currency: "UGX" },
        location: { Name: "", Coordinates: { Lat: 0.3476, Lon: 32.5825 } },
        amenities: [] as string[],
        extras: [] as string[],
    });

    /* -------------------------------------------------------------- */
    /* Location pre-fetch — cached by rounded coords, so the silent   */
    /* warm-up call and a later "use current location" tap from       */
    /* (roughly) the same spot only ever hit the network once.         */
    /* -------------------------------------------------------------- */
    const handleGetCurrentLocation = useCallback((silent = false) => {
        if (!navigator.geolocation) return;
        if (!silent) setLocationLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    const data = await reverseGeocode(latitude, longitude);
                    setForm((p) => ({
                        ...p,
                        location: {
                            Name: data.display_name || `${latitude}, ${longitude}`,
                            Coordinates: { Lat: latitude, Lon: longitude },
                        },
                    }));
                } catch {
                    setForm((p) => ({
                        ...p,
                        location: {
                            Name: `Coordinates: ${latitude}, ${longitude}`,
                            Coordinates: { Lat: latitude, Lon: longitude },
                        },
                    }));
                }
                if (!silent) setLocationLoading(false);
                setShowSuggestions(false);
            },
            () => {
                if (!silent) setLocationLoading(false);
            }
        );
    }, []);

    // Initial silent warm-up so location is pre-filled by the time the user hits step 2
    useEffect(() => {
        handleGetCurrentLocation(true);
    }, [handleGetCurrentLocation]);

    /* -------------------------------------------------------------- */
    /* Camera lifecycle — video element always mounted (ref never     */
    /* null), stream started/stopped on step change + tab visibility. */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        let activeStream: MediaStream | null = null;
        let isCancelled = false;

        const syncStartStream = async () => {
            if (currentStepID !== 1 || document.hidden) return;

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }

            try {
                const constraints = {
                    video: {
                        facingMode: { ideal: "environment" },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);

                if (isCancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                activeStream = stream;
                const videoEl = videoRef.current;

                if (videoEl) {
                    videoEl.srcObject = stream;
                    setCameraStatus("ready");

                    videoEl.onloadedmetadata = () => {
                        if (!isCancelled && videoEl) {
                            videoEl.play().catch((err) => {
                                console.warn("Stream presentation play call deferred:", err);
                            });
                        }
                    };
                } else {
                    // Video element not yet mapped by React — poll briefly
                    let attempts = 0;
                    const pollInterval = setInterval(() => {
                        attempts++;
                        const nestedVideoEl = videoRef.current;
                        if (nestedVideoEl) {
                            nestedVideoEl.srcObject = stream;
                            setCameraStatus("ready");
                            nestedVideoEl.play().catch(() => { });
                            clearInterval(pollInterval);
                        }
                        if (attempts > 10) clearInterval(pollInterval);
                    }, 100);
                }
            } catch (err) {
                console.error("Camera resolution critical fallback pipeline caught exception:", err);
                try {
                    const fallbackStream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false,
                    });
                    if (!isCancelled && videoRef.current) {
                        activeStream = fallbackStream;
                        videoRef.current.srcObject = fallbackStream;
                        setCameraStatus("ready");
                        videoRef.current.play().catch(() => { });
                    }
                } catch (fallbackErr) {
                    if (!isCancelled) setCameraStatus("denied");
                }
            }
        };

        // Push past React's initial DOM layout pass
        const macroTimer = setTimeout(() => {
            syncStartStream();
        }, 60);

        const cleanUpStream = () => {
            isCancelled = true;
            clearTimeout(macroTimer);
            setCameraStatus("loading");
            if (activeStream) {
                activeStream.getTracks().forEach((track) => track.stop());
                activeStream = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
                videoRef.current.onloadedmetadata = null;
            }
        };

        const handleVisibility = () => {
            if (document.hidden) {
                cleanUpStream();
            } else {
                syncStartStream();
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            cleanUpStream();
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [currentStepID]);

    const capturePhotoFromCamera = () => {
        if (videoRef.current && cameraStatus === "ready") {
            const video = videoRef.current;
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            const context = canvas.getContext("2d");
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL("image/jpeg");
                setImageToCrop(dataUrl);
            }
        }
    };

    const galleryPicker = async () => {
        try {
            const files = await openFilePicker({ accept: "image/*", multiple: false });
            if (files && files.length > 0) {
                const file = files[0];
                const reader = new FileReader();
                reader.onload = () => {
                    setImageToCrop(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        } catch (e) {
            console.error("File choice engine mapping failure:", e);
        }
    };

    const onCropComplete = useCallback((_croppedArea: any, currentPixels: any) => {
        setCroppedAreaPixels(currentPixels);
    }, []);

    const saveCroppedPhoto = useCallback(async () => {
        if (imageToCrop && croppedAreaPixels) {
            try {
                const croppedFile = await getCroppedImg(imageToCrop, croppedAreaPixels);
                setSelectedFiles((prev) => [...prev, croppedFile]);
                setImageToCrop(null);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setCroppedAreaPixels(null);
            } catch (e) {
                console.error("Canvas matrix transformation failed:", e);
            }
        }
    }, [imageToCrop, croppedAreaPixels]);

    /* -------------------------------------------------------------- */
    /* Location typeahead — forward geocode calls cached by the       */
    /* normalized query string.                                       */
    /* -------------------------------------------------------------- */
    const fetchLocationSuggestions = async (query: string) => {
        try {
            const data = await searchAddress(query);
            setSuggestions(data);
            setShowSuggestions(true);
        } catch (e) {
            console.error(e);
        }
    };

    const handleLocationTyping = (query: string) => {
        setForm((p) => ({ ...p, location: { ...p.location, Name: query } }));
        if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
        if (query.trim().length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        locationDebounceRef.current = setTimeout(() => {
            fetchLocationSuggestions(query);
        }, 350);
    };

    const handleLocationFocus = () => {
        if (form.location.Name.trim().length >= 3) {
            if (suggestions.length > 0) {
                setShowSuggestions(true);
            } else {
                fetchLocationSuggestions(form.location.Name);
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (locationBoxRef.current && !locationBoxRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /* -------------------------------------------------------------- */
    /* Step 1 -> Step 2: upload images only. This never creates a      */
    /* post record — it just gets the asset URLs ready so final       */
    /* submit doesn't have to re-compress/re-upload anything.          */
    /* -------------------------------------------------------------- */
    const beginBackgroundUpload = useCallback(() => {
        if (isUploadingImages || selectedFiles.length === 0) return;
        setUploadError(null);

        uploadImages(
            {
                images: selectedFiles,
                onProgress: (progress) => setUploadProgress(progress),
            },
            {
                onSuccess: (assets) => {
                    setUploadedAssets(assets);
                },
                onError: (err: any) => {
                    setUploadError(err?.message || "Image upload failed");
                },
            }
        );
    }, [uploadImages, selectedFiles, isUploadingImages]);

    const goToStep2 = useCallback(() => {
        beginBackgroundUpload();
        setCurrentStepID(2);
    }, [beginBackgroundUpload]);

    const handleBackToStep1 = useCallback(() => {
        setImageToCrop(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setCurrentStepID(1);
    }, []);

    /* -------------------------------------------------------------- */
    /* Final submit: creates the post exactly once. If the background  */
    /* upload from step 1 hasn't finished (or failed / was skipped),   */
    /* upload here first — but still only ONE call to create the post, */
    /* and images are never uploaded twice.                            */
    /* -------------------------------------------------------------- */
    const handleFinalSubmit = async () => {
        setUploading(true)
        try {
            let assets = uploadedAssets;

            if (assets.length === 0 && selectedFiles.length > 0) {
                assets = await uploadImagesAsync({
                    images: selectedFiles,
                    onProgress: (progress) => setUploadProgress(progress),
                });
                setUploadedAssets(assets);
            }

            // createPost(
            //     { ...form, assets },
            //     {
            //         onSuccess: () => navigate("/tabs/user"),
            //         onError: (err: any) => alert(err?.message || "Post creation failed"),
            //     }
            // );
            const newPost: Partial<PostI> = {
                type: form?.type as PostType,
                assets: assets?.map(a => ({ url: a?.URL, type: a?.Type } as PostAssetI)),
                price: {
                    amount: form.price.Amount,
                    currency: form.price.Currency as Currency
                },
                location: {
                    name: form.location?.Name,
                    cordinates: { lat: form?.location?.Coordinates?.Lat, lon: form?.location?.Coordinates?.Lon }
                },
                bathrooms: form?.bathrooms,
                bedrooms: form?.bedrooms,
                toilets: form?.toilets,
                amenities: form?.amenities,
                negotiable: form?.negotiable,
                extras: form?.extras,
                months: form?.months,
                units: form?.units,
                available: true
            }
            console.log(newPost)
            const { status, msg } = await Post<Partial<PostI>, PostI>("posts", newPost)
            console.log(status)
            if (status != 201) {
                setUploadError(msg)
                return
            }
            navigate("/tabs/user")
        } catch (err: any) {
            setUploadError(err?.message || "Image upload failed");
        } finally {
            setUploading(false)
        }
    }

    const categories = [
        { icon: commercialIcon, label: "commercial", value: "commercial" },
        { icon: residentialIcon, label: "residential", value: "residential" },
        { icon: hostelIcon, label: "hostel", value: "hostel" },
    ];

    const monthsPadOptions = ["2", "3", "4", "other"] as const;

    const cameraStep = (
        <div className="h-screen relative bg-neutral-950 overflow-hidden">
            {/* Video always renders so videoRef.current is never null */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 h-full w-full object-cover z-0 transition-opacity duration-300 ${cameraStatus === "ready" ? "opacity-100" : "opacity-0"
                    }`}
            />

            {cameraStatus !== "ready" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white/60 z-10 gap-3">
                    <p className="text-sm font-medium tracking-wide">
                        {cameraStatus === "loading"
                            ? "Connecting to Camera Stream..."
                            : "Camera access was denied or hardware resource is locked by another window."}
                    </p>
                </div>
            )}

            {previewUrls.length > 0 && (
                <div className="fixed z-40 bottom-[22vh] left-4 right-4">
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {previewUrls.map((url, index) => (
                            <div
                                key={index}
                                className="h-20 w-20 relative flex-shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-2xl"
                            >
                                <img src={url} alt="" className="h-full w-full object-cover absolute" />
                                <div
                                    onClick={() => setSelectedFiles((p) => p.filter((_, i) => i !== index))}
                                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center cursor-pointer transition"
                                >
                                    <Lineicons icon={Trash3Solid} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end z-10">
                <div className="flex flex-col gap-6 items-center fixed w-full text-white bottom-0 p-10 backdrop-blur-sm bg-black/40">
                    <div className="flex items-center w-full justify-around">
                        <button
                            type="button"
                            onClick={galleryPicker}
                            className="bg-white/10 p-5 rounded-full hover:bg-white/20 active:scale-95 transition"
                            aria-label="Open gallery"
                        >
                            <Lineicons icon={GallerySolid} size={30} />
                        </button>

                        <div className="p-1 flex items-center justify-center border-2 border-white rounded-full">
                            <button
                                type="button"
                                disabled={cameraStatus !== "ready"}
                                onClick={capturePhotoFromCamera}
                                className="bg-white h-20 rounded-full w-20 active:scale-90 transition disabled:opacity-40"
                                aria-label="Take photo"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate("/tabs/user")}
                            className="bg-white/10 p-5 rounded-full hover:bg-white/20 active:scale-95 transition"
                            aria-label="Cancel"
                        >
                            <Lineicons icon={XmarkSolid} size={30} />
                        </button>
                    </div>

                    {selectedFiles.length > 0 && (
                        <motion.button
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            type="button"
                            onClick={goToStep2}
                            className="w-full py-4 bg-primary rounded-full text-white text-center shadow-lg"
                        >
                            Next Step ({selectedFiles.length} images)
                        </motion.button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {imageToCrop && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black z-50 flex flex-col"
                    >
                        <div className="relative flex-1 bg-neutral-900">
                            <Cropper
                                image={imageToCrop}
                                crop={crop}
                                zoom={zoom}
                                aspect={4 / 3}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>
                        <div className="p-6 bg-neutral-950 flex justify-between gap-4">
                            <button
                                type="button"
                                onClick={() => setImageToCrop(null)}
                                className="w-1/2 py-3 bg-white/10 text-white rounded-full text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={saveCroppedPhoto}
                                className="w-1/2 py-3 bg-primary text-white rounded-full text-sm font-medium"
                            >
                                Crop & Save
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <>
            {currentStepID === 1 && cameraStep}

            {currentStepID === 2 && (
                <Shell
                    onBack={handleBackToStep1}
                    onNext={() => setCurrentStepID(3)}
                    disabled={!form.location.Name}
                    globalProgress={globalProgress}
                    showProgressBar={isUploadingImages}
                >
                    <div className="flex gap-4 flex-col relative" ref={locationBoxRef}>
                        <div>
                            <p className="text-xl font-semibold">Property Location</p>
                            <p className="text-text/50 text-sm mt-1">Provide location data</p>
                        </div>

                        {uploadError && (
                            <p className="text-red-500 text-xs -mt-2">
                                {uploadError} — we'll retry on submission.
                            </p>
                        )}

                        <div className="bg-pale w-full rounded-full h-15 flex gap-1 items-center px-6 relative">
                            <Lineicons icon={MapMarker5Solid} className="text-text/50" />
                            <input
                                type="text"
                                value={form.location.Name}
                                onFocus={handleLocationFocus}
                                onChange={(e) => handleLocationTyping(e.target.value)}
                                placeholder="Type address..."
                                className="flex-1 text-base outline-0 bg-transparent"
                            />
                        </div>

                        <button
                            type="button"
                            disabled={locationLoading}
                            onClick={() => handleGetCurrentLocation(false)}
                            className="btn bg-primary w-full rounded-full text-white"
                        >
                            <span>{locationLoading ? "Fetching..." : "Use current location"}</span>
                        </button>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="bg-pale rounded flex flex-col divide-y divide-text/5 overflow-hidden absolute top-[calc(100%-1rem)] left-0 right-0 z-20 shadow-lg max-h-64 overflow-y-auto">
                                {suggestions.map((item, i) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            setForm((p) => ({
                                                ...p,
                                                location: {
                                                    Name: item.display_name,
                                                    Coordinates: { Lat: parseFloat(item.lat), Lon: parseFloat(item.lon) },
                                                },
                                            }));
                                            setSuggestions([]);
                                            setShowSuggestions(false);
                                        }}
                                        className="p-4 text-text/80 hover:bg-black/5 cursor-pointer text-sm"
                                    >
                                        {item.display_name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Shell>
            )}

            {currentStepID === 3 && (
                <Shell
                    onBack={() => setCurrentStepID(2)}
                    onNext={() => setCurrentStepID(4)}
                    globalProgress={globalProgress}
                    showProgressBar={isUploadingImages}
                >
                    <div>
                        <p className="text-xl font-semibold">Property Type</p>
                        <br />
                        <AnimatedSelect
                            options={categories}
                            selectedValue={form.type}
                            onChange={(val) => setForm((p) => ({ ...p, type: val }))}
                        />
                    </div>
                </Shell>
            )}

            {currentStepID === 4 && (
                <Shell
                    onBack={() => setCurrentStepID(3)}
                    onNext={() => setCurrentStepID(5)}
                    globalProgress={globalProgress}
                    showProgressBar={isUploadingImages}
                >
                    <div>
                        <p className="text-xl font-semibold">Bedrooms, Bathrooms & Toilets</p>
                        <div className="flex flex-col gap-4 mt-6">
                            {(["bedrooms", "bathrooms", "toilets"] as const).map((field) => (
                                <div key={field} className="flex flex-col gap-2">
                                    <span className="text-sm capitalize">{field}</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form[field] || ""}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, [field]: Number(e.target.value) }))
                                        }
                                        placeholder={`number of ${field}`}
                                        className="outline-0 bg-pale h-14 rounded-lg px-6"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </Shell>
            )}

            {currentStepID === 5 && (
                <Shell
                    onBack={() => setCurrentStepID(4)}
                    onNext={() => setShowNegotiationModal(true)}
                    globalProgress={globalProgress}
                    showProgressBar={isUploadingImages}
                >
                    <div>
                        <p className="text-xl font-semibold">Property Pricing</p>
                        <div className="flex flex-col gap-2 mt-4">
                            <span className="text-sm">Price Amount (UGX)</span>
                            <div className="bg-pale h-14 rounded-lg px-6 flex items-center gap-2">
                                <span className="text-text/50 text-sm font-medium">UGX</span>
                                <input
                                    inputMode="numeric"
                                    placeholder="how much is rent per month"
                                    value={formatUGX(form.price.Amount)}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            price: { ...p.price, Amount: parseFormattedNumber(e.target.value) },
                                        }))
                                    }
                                    className="outline-0 bg-transparent flex-1 h-full"
                                />
                            </div>
                        </div>
                    </div>
                </Shell>
            )}

            {currentStepID === 6 && (
                <Shell
                    onBack={() => setCurrentStepID(5)}
                    onNext={() => setCurrentStepID(7)}
                    globalProgress={globalProgress}
                    showProgressBar={isUploadingImages}
                >
                    <div>
                        <p className="text-xl font-semibold">Amenities</p>
                        <div className="grid gap-4 grid-cols-2 mt-4">
                            {[
                                { icon: waterIcon, label: "water" },
                                { icon: electricityIcon, label: "electricity" },
                                { icon: trashIcon, label: "trash" },
                                { icon: parkingIcon, label: "parking" },
                            ].map((a) => {
                                const isSelected = form.amenities.includes(a.label);
                                return (
                                    <div
                                        key={a.label}
                                        onClick={() =>
                                            setForm((p) => ({
                                                ...p,
                                                amenities: isSelected
                                                    ? p.amenities.filter((item) => item !== a.label)
                                                    : [...p.amenities, a.label],
                                            }))
                                        }
                                        className={`flex px-4 py-10 rounded-xl bg-pale flex-col items-center justify-center cursor-pointer border-2 ${isSelected ? "border-primary/40 bg-primary/5" : "border-transparent"
                                            }`}
                                    >
                                        <img src={a.icon} className="h-20 object-contain" alt="" />
                                        <p className="mt-6 capitalize font-medium">{a.label}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Shell>
            )}

            {currentStepID === 7 && (
                <Shell
                    onBack={() => setCurrentStepID(6)}
                    onNext={() => setCurrentStepID(8)}
                    disabled={monthsPad === "other" && (!form.months || form.months < 1)}
                    globalProgress={globalProgress}
                    showProgressBar={isUploadingImages}
                >
                    <div>
                        <p className="text-xl font-semibold">Initial Payment</p>
                        <p className="text-text/50 text-sm mt-1">Months upfront collection threshold</p>

                        <div className="grid grid-cols-4 gap-3 mt-4">
                            {monthsPadOptions.map((opt) => {
                                const isSelected = monthsPad === opt;
                                return (
                                    <div
                                        key={opt}
                                        onClick={() => {
                                            setMonthsPad(opt);
                                            if (opt !== "other") {
                                                setForm((p) => ({ ...p, months: Number(opt) }));
                                            }
                                        }}
                                        className="relative h-16 bg-pale rounded-xl flex items-center justify-center cursor-pointer"
                                    >
                                        {isSelected && (
                                            <motion.div
                                                layoutId="monthsPadRing"
                                                className="absolute inset-0 border border-primary bg-primary/5 rounded-xl z-0"
                                                transition={{ duration: 0.2 }}
                                            />
                                        )}
                                        <span className="relative z-10 font-medium capitalize text-sm">
                                            {opt === "other" ? "Other" : opt}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {monthsPad === "other" && (
                            <div className="flex flex-col gap-2 mt-4">
                                <span className="text-sm">Custom number of months</span>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.months || ""}
                                    onChange={(e) => setForm((p) => ({ ...p, months: Number(e.target.value) }))}
                                    placeholder="e.g. 6"
                                    className="outline-0 bg-pale h-14 rounded-lg px-6"
                                />
                            </div>
                        )}
                    </div>
                </Shell>
            )}

            {currentStepID === 8 && (
                <Shell
                    onBack={() => setCurrentStepID(7)}
                    onNext={handleFinalSubmit}
                    nextText={
                        uploading ? "Publishing..." : isUploadingImages ? "Finishing upload..." : "Publish Post"
                    }
                    disabled={uploading || isUploadingImages}
                    globalProgress={globalProgress}
                    showProgressBar={isUploadingImages || uploading}
                >
                    <div>
                        <p className="text-xl font-semibold">Extra Features</p>
                        <p className="text-text/50 text-sm mt-1">Add anything else that stands out</p>
                        <div className="grid gap-4 grid-cols-2 mt-4">
                            {[
                                "Fenced Compound",
                                "Wall Fence",
                                "Water Tank Included",
                                "CCTV",
                                "Backup Generator",
                                "Garden",
                            ].map((label) => {
                                const isSelected = form.extras.includes(label);
                                return (
                                    <div
                                        key={label}
                                        onClick={() =>
                                            setForm((p) => ({
                                                ...p,
                                                extras: isSelected
                                                    ? p.extras.filter((e) => e !== label)
                                                    : [...p.extras, label],
                                            }))
                                        }
                                        className={`flex px-4 py-6 rounded-xl bg-pale items-center justify-center cursor-pointer border-2 text-sm font-medium text-center ${isSelected ? "border-primary/40 bg-primary/5" : "border-transparent"
                                            }`}
                                    >
                                        {label}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Shell>
            )}

            <Modal
                className="p-10"
                actions={
                    <>
                        <button
                            onClick={() => {
                                setForm((p) => ({ ...p, negotiable: false }));
                                setCurrentStepID(6);
                                setShowNegotiationModal(false);
                            }}
                            className="btn bg-pale"
                        >
                            no
                        </button>
                        <button
                            onClick={() => {
                                setForm((p) => ({ ...p, negotiable: true }));
                                setCurrentStepID(6);
                                setShowNegotiationModal(false);
                            }}
                            className="btn bg-primary text-white"
                        >
                            yes
                        </button>
                    </>
                }
                open={showNegotiationModal}
                onClose={() => setShowNegotiationModal(false)}
            >
                <p className="text-xl font-semibold">Negotiation terms</p>
                <p className="text-text/50 text-sm mt-1">Is the price layout of this property negotiable?</p>
            </Modal>
        </>
    );
};

export default Upload;