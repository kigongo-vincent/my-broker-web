import { useEffect, useRef, useState } from "react";
import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/solid";

interface Props {
  url: string;
  poster?: string; // shown lightly blurred with a spinner until playback starts
  title?: string;
}

export function getSafeTikTokVideoUrl(value: string): string | undefined {
  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== "https:" ||
      !["tiktok.com", "www.tiktok.com", "m.tiktok.com"].includes(
        parsed.hostname.toLowerCase()
      )
    ) {
      return undefined;
    }
    return parsed.pathname.match(/\/video\/\d+(?:\/|$)/) ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

/* ------------------------------------------------------------------ */
/* Cropping                                                            */
/* ------------------------------------------------------------------ */
// This component fills its parent (absolute inset-0). The PARENT sets the
// height, e.g. `relative aspect-[636/414] overflow-hidden`.
//
// TikTok draws its own chrome (author header, logo, like/comment/share, gear)
// at fixed pixel positions around a 9:16 video. We size the iframe so the
// video column is exactly as wide as the card, then let overflow-hidden crop
// everything outside that column and above/below the visible band.
// Sizes use the wrapper's container units (cqw / cqh).

const VIDEO_RATIO = 9 / 16;
// Which part of the video the card shows: 0 = top, 0.5 = middle, 1 = bottom.
const FOCUS_Y = 0.5;
// Never show less than this many pixels of trim at the top (hides the author
// header even when the card is tall).
const OVERLAY_TOP_PX = 110;
// Player height such that the 9:16 video column is as wide as the card.
const PLAYER_H = `calc(100cqw / ${VIDEO_RATIO})`;

const PLAYER_STYLE: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  transform: "translateX(-50%)",
  // Wider than 9:16 so the video fits by height and the overlays land in the
  // blurred side areas, which the wrapper crops.
  width: `calc(${PLAYER_H} * 0.92)`,
  height: PLAYER_H,
  maxWidth: "none",
  top: `calc(-1 * min(max(${OVERLAY_TOP_PX}px, ${FOCUS_Y} * (${PLAYER_H} - 100cqh)), ${PLAYER_H} - 100cqh))`,
};

// Share of the card that must be visible before the video plays.
const PLAY_VISIBLE_RATIO = 0.6;

const TikTokVideo = ({ url, poster, title = "TikTok property video" }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const playerReady = useRef(false);
  const inViewRef = useRef(false);
  const pendingCommand = useRef<"play" | "pause" | null>(null);
  const retryTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const safeUrl = getSafeTikTokVideoUrl(url);
  const videoId = safeUrl?.match(/\/video\/(\d+)(?:\/|$)/)?.[1];

  const postToPlayer = (type: string) => {
    playerRef.current?.contentWindow?.postMessage(
      { "x-tiktok-player": true, type },
      "*"
    );
  };

  const setPlayback = (command: "play" | "pause") => {
    setIsPlaying(command === "play");
    pendingCommand.current = command;
    postToPlayer(command);

    if (!playerReady.current) {
      if (retryTimer.current) clearInterval(retryTimer.current);
      let attempts = 0;
      retryTimer.current = setInterval(() => {
        if (playerReady.current || attempts >= 8) {
          if (retryTimer.current) clearInterval(retryTimer.current);
          retryTimer.current = null;
          return;
        }
        attempts += 1;
        postToPlayer(command);
      }, 250);
    }
  };

  // Player -> host messages
  useEffect(() => {
    const handlePlayerMessage = (event: MessageEvent) => {
      if (
        event.origin !== "https://www.tiktok.com" ||
        event.source !== playerRef.current?.contentWindow ||
        typeof event.data !== "object" ||
        event.data === null ||
        event.data["x-tiktok-player"] !== true
      ) {
        return;
      }

      const { type, value } = event.data;

      if (type === "onPlayerReady") {
        playerReady.current = true;
        const command = pendingCommand.current;
        if (command) {
          postToPlayer(command);
          pendingCommand.current = null;
        }
        if (retryTimer.current) {
          clearInterval(retryTimer.current);
          retryTimer.current = null;
        }
      } else if (type === "onStateChange") {
        if (value === 1) {
          // The URL autoplays on load. If the card is off screen, stop it
          // right away and keep the skeleton up until it is actually seen.
          if (!inViewRef.current) {
            postToPlayer("pause");
          } else {
            setHasStarted(true);
            setIsPlaying(true);
          }
          pendingCommand.current = null;
        }
        if (value === 0 || value === 2) {
          setIsPlaying(false);
          pendingCommand.current = null;
        }
      } else if (type === "onMute") {
        setIsMuted(Boolean(value));
      } else if (type === "onPlayerError") {
        // Autoplay blocked by the browser: reveal the player so the person
        // can tap play instead of staring at the skeleton.
        const code = event.data.errorCode ?? value?.errorCode;
        if (code === 3002) setHasStarted(true);
      }
    };

    window.addEventListener("message", handlePlayerMessage);
    return () => {
      window.removeEventListener("message", handlePlayerMessage);
      if (retryTimer.current) clearInterval(retryTimer.current);
    };
  }, []);

  // Play when the card is mostly in view, pause when it leaves
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.intersectionRatio >= PLAY_VISIBLE_RATIO;
        if (visible === inViewRef.current) return;
        inViewRef.current = visible;
        setPlayback(visible ? "play" : "pause");
      },
      { threshold: [0, PLAY_VISIBLE_RATIO] }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const togglePlayback = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setPlayback(isPlaying ? "pause" : "play");
  };

  const toggleMute = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    postToPlayer(isMuted ? "unMute" : "mute");
    setIsMuted(!isMuted);
  };

  if (!videoId) {
    return (
      <a
        href="https://www.tiktok.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 flex items-center justify-center bg-pale text-text"
      >
        Open TikTok to watch this video
      </a>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 isolate z-0 overflow-hidden bg-paper"
      style={{ containerType: "size" }}
    >
      <iframe
        ref={playerRef}
        src={`https://www.tiktok.com/player/v1/${videoId}?autoplay=1&muted=1&loop=1&controls=0&progress_bar=0&play_button=0&volume_control=0&fullscreen_button=0&timestamp=0&music_info=0&description=0&rel=0&native_context_menu=0&closed_caption=0`}
        title={title}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        className={`pointer-events-none border-0 transition-opacity duration-300 ${hasStarted ? "opacity-100" : "opacity-0"
          }`}
        style={PLAYER_STYLE}
      />

      {/* Loading state: blurred thumbnail + spinner (covers TikTok's own loader) */}
      {!hasStarted && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] overflow-hidden bg-pale"
        >
          {poster ? (
            <img
              src={poster}
              alt=""
              className="absolute inset-0 h-full w-full scale-105 object-cover "
              style={{ objectPosition: `50% ${FOCUS_Y * 100}%` }}
            />
          ) : (
            // <div className="absolute inset-0 animate-pulse bg-text/5" />
            <></>
          )}
          <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/40">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={togglePlayback}
        aria-label={isPlaying ? "Pause video" : "Play video"}
        title={isPlaying ? "Pause video" : "Play video"}
        className="absolute inset-0 z-[2] cursor-pointer bg-transparent focus-visible:outline-2 focus-visible:outline-white"
      >
        {hasStarted && !isPlaying && (
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
          >
            <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8 fill-current">
              <path d="M7 4.5v15l12-7.5z" />
            </svg>
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={toggleMute}
        aria-label={isMuted ? "Unmute video" : "Mute video"}
        title={isMuted ? "Unmute video" : "Mute video"}
        className="absolute bottom-3 left-3 z-[3] flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white"
      >
        {isMuted ? (
          <SpeakerXMarkIcon aria-hidden="true" className="h-6 w-6" />
        ) : (
          <SpeakerWaveIcon aria-hidden="true" className="h-6 w-6" />
        )}
      </button>
    </div>
  );
};

export default TikTokVideo;