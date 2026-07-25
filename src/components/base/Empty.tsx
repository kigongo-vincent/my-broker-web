import { JSX } from "react/jsx-runtime"

export interface Props {
    title?: string
    caption?: string
    type: "default" | "posts" | "chats"
}

/** Reusable soft organic blob backdrop, matching the reference illustration set. */
const Blob = () => (
    <path
        d="M60 14c14.6 0 24.8 10.4 32.6 21.8 7.9 11.5 13.9 25 9.4 37.7-4.5 12.8-19.2 19-31.8 24.4-12.6 5.4-27 9.6-38.4 3.6-11.5-6-16.6-20.6-19.6-34.4-3-13.9-3.9-28.9 4.2-39.6C24.6 16.6 41.6 14 60 14Z"
        fill="url(#empty-sheen)"
    />
)

const sharedDefs = (
    <defs>
        <linearGradient id="empty-sheen" x1="18" y1="14" x2="102" y2="102" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.16" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.03" />
        </linearGradient>
    </defs>
)

/** default — search / no-results glyph */
const EmptyDefaultIllustration = () => (
    <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0 text-primary" aria-hidden="true">
        {sharedDefs}
        <Blob />
        {/* document */}
        <path
            d="M42 34h24l10 10v38a2 2 0 0 1-2 2H42a2 2 0 0 1-2-2V36a2 2 0 0 1 2-2Z"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.35"
            strokeWidth="1.75"
            strokeLinejoin="round"
        />
        <path
            d="M66 34v8a2 2 0 0 0 2 2h8"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.35"
            strokeWidth="1.75"
            strokeLinejoin="round"
        />
        <line x1="48" y1="58" x2="66" y2="58" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" strokeLinecap="round" />
        <line x1="48" y1="66" x2="60" y2="66" stroke="currentColor" strokeOpacity="0.16" strokeWidth="2" strokeLinecap="round" />
        {/* magnifier, overlapping bottom-right like the reference set */}
        <circle cx="74" cy="76" r="12" fill="var(--color-paper, #fff)" stroke="currentColor" strokeOpacity="0.55" strokeWidth="2.5" />
        <line x1="83" y1="85" x2="91" y2="93" stroke="currentColor" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round" />
        {/* accent spark */}
        <circle cx="88" cy="30" r="2.5" fill="currentColor" fillOpacity="0.4" />
        <path d="M88 25v3M84.5 27.5h7" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" strokeLinecap="round" />
    </svg>
)

/** posts — empty gallery / feed glyph */
const EmptyPostsIllustration = () => (
    <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0 text-primary" aria-hidden="true">
        {sharedDefs}
        <Blob />
        {/* back card */}
        <rect x="30" y="38" width="46" height="34" rx="4" fill="var(--color-paper, #fff)" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.75" />
        {/* front card */}
        <rect x="42" y="50" width="46" height="34" rx="4" fill="var(--color-paper, #fff)" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.75" />
        <circle cx="52" cy="60" r="4" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.75" />
        <path
            d="M46 78l10-10 6 6 10-12 12 16"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* accent spark */}
        <circle cx="88" cy="32" r="2.5" fill="currentColor" fillOpacity="0.4" />
        <path d="M88 27v3M84.5 29.5h7" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" strokeLinecap="round" />
    </svg>
)

/** chats — empty conversation glyph */
const EmptyChatsIllustration = () => (
    <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0 text-primary" aria-hidden="true">
        {sharedDefs}
        <Blob />
        {/* back bubble */}
        <path
            d="M32 44a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H44l-8 7v-7h-4a6 6 0 0 1-6-6Z"
            fill="var(--color-paper, #fff)"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="1.75"
            strokeLinejoin="round"
        />
        {/* front bubble */}
        <path
            d="M50 58a6 6 0 0 1 6-6h22a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H66l-9 8v-8h-1a6 6 0 0 1-6-6Z"
            fill="var(--color-paper, #fff)"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.75"
            strokeLinejoin="round"
        />
        <line x1="58" y1="64" x2="76" y2="64" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
        <line x1="58" y1="71" x2="70" y2="71" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" strokeLinecap="round" />
        {/* accent spark */}
        <circle cx="86" cy="30" r="2.5" fill="currentColor" fillOpacity="0.4" />
        <path d="M86 25v3M82.5 27.5h7" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" strokeLinecap="round" />
    </svg>
)

const ILLUSTRATIONS: Record<Props["type"], () => JSX.Element> = {
    default: EmptyDefaultIllustration,
    posts: EmptyPostsIllustration,
    chats: EmptyChatsIllustration,
}

const DEFAULT_COPY: Record<Props["type"], { title: string; caption: string }> = {
    default: { title: "No data found", caption: "Nothing is here, consider refreshing the page" },
    posts: { title: "No posts yet", caption: "Posts you create or save will show up here" },
    chats: { title: "No conversations yet", caption: "Start a chat and it will show up here" },
}

const Empty = ({ title, caption, type = "default" }: Props) => {
    const Illustration = ILLUSTRATIONS[type] ?? ILLUSTRATIONS.default
    const copy = DEFAULT_COPY[type] ?? DEFAULT_COPY.default

    return (
        <div className="rounded-xl flex items-center justify-center flex-col h-[30vh] min-h-[30vh] w-full gap-1 px-6 py-8">
            <Illustration />
            <h2 className="text-xl font-medium text-text mt-1">{title ?? copy.title}</h2>
            <p className="text-sm text-text/50 text-center max-w-md">{caption ?? copy.caption}</p>
        </div>
    )
}

export default Empty