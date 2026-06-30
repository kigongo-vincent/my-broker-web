export interface Props {
    title?: string
    caption?: string
}

/** Inline empty-state illustration (replaces raster fallback). */
const EmptyIllustration = () => (
    <svg
        viewBox="0 0 120 120"
        className="h-28 w-28 shrink-0 text-primary"
        aria-hidden="true"
    >
        <defs>
            <linearGradient id="empty-sheen" x1="18" y1="22" x2="102" y2="98" gradientUnits="userSpaceOnUse">
                <stop stopColor="currentColor" stopOpacity="0.22" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0.04" />
            </linearGradient>
        </defs>
        {/* soft field */}
        <circle cx="60" cy="60" r="52" fill="url(#empty-sheen)" />
        <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.12"
            strokeWidth="1"
            strokeDasharray="4 6"
        />
        {/* tray / inbox */}
        <path
            d="M38 78 L60 88 L82 78 L82 52 L38 52 Z"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.35"
            strokeWidth="1.75"
            strokeLinejoin="round"
        />
        <path
            d="M38 52 L60 42 L82 52"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.35"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* “nothing here” lines */}
        <line x1="48" y1="64" x2="72" y2="64" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round" />
        <line x1="48" y1="70" x2="66" y2="70" stroke="currentColor" strokeOpacity="0.14" strokeWidth="2" strokeLinecap="round" />
        {/* accent spark */}
        <circle cx="84" cy="36" r="3" fill="currentColor" fillOpacity="0.45" />
        <path
            d="M84 30.5v3M80.5 33h7"
            stroke="currentColor"
            strokeOpacity="0.35"
            strokeWidth="1"
            strokeLinecap="round"
        />
    </svg>
)

const Empty = ({ title = "No data found", caption = "nothing is found, consider refreshing the page" }: Props) => {
    return (
        <div className="border border-text/10 rounded-xl flex items-center justify-center flex-col h-[30vh] w-full gap-1 px-6 py-8">
            <EmptyIllustration />
            <h2 className="text-xl font-medium text-text mt-1">{title}</h2>
            <p className="text-sm text-text/50 text-center max-w-md">{caption}</p>
        </div>
    )
}

export default Empty