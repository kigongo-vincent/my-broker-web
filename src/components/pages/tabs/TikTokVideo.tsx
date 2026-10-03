import { useEffect, useRef, useState } from "react";
import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/solid";

interface Props {
  url: string;
  poster?: string;
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

const TikTokVideo = ({ url, poster, title = "TikTok property video" }: Props) => {
  const playerRef = useRef<HTMLIFrameElement>(null);
  const playerReady = useRef(false);
  const pendingCommand = useRef<"play" | "pause" | null>(null);
  const retryTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const safeUrl = getSafeTikTokVideoUrl(url);
  const videoId = safeUrl?.match(/\/video\/(\d+)(?:\/|$)/)?.[1];

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

      if (event.data.type === "onPlayerReady") {
        playerReady.current = true;
        const command = pendingCommand.current;
        if (command) {
          playerRef.current?.contentWindow?.postMessage(
            { "x-tiktok-player": true, type: command },
            "*"
          );
          pendingCommand.current = null;
        }
        if (retryTimer.current) {
          clearInterval(retryTimer.current);
          retryTimer.current = null;
        }
      } else if (event.data.type === "onStateChange") {
        if (playbackTimeout.current) {
          clearTimeout(playbackTimeout.current);
          playbackTimeout.current = null;
        }
        setIsBuffering(false);
        if (event.data.value === 1) {
          setIsPlaying(true);
          pendingCommand.current = null;
        }
        if (event.data.value === 0 || event.data.value === 2) {
          setIsPlaying(false);
          pendingCommand.current = null;
        }
      } else if (event.data.type === "onMute") {
        setIsMuted(Boolean(event.data.value));
      }
    };

    window.addEventListener("message", handlePlayerMessage);
    return () => {
      window.removeEventListener("message", handlePlayerMessage);
      if (retryTimer.current) clearInterval(retryTimer.current);
      if (playbackTimeout.current) clearTimeout(playbackTimeout.current);
    };
  }, []);

  const togglePlayback = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const command = isPlaying ? "pause" : "play";
    setIsPlaying(!isPlaying);
    setIsBuffering(command === "play");
    if (playbackTimeout.current) clearTimeout(playbackTimeout.current);
    playbackTimeout.current =
      command === "play"
        ? setTimeout(() => setIsBuffering(false), 5000)
        : null;

    pendingCommand.current = command;
    const sendCommand = () => {
      playerRef.current?.contentWindow?.postMessage(
        { "x-tiktok-player": true, type: command },
        "*"
      );
    };
    sendCommand();

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
        sendCommand();
      }, 250);
    }
  };

  const toggleMute = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const type = isMuted ? "unMute" : "mute";
    playerRef.current?.contentWindow?.postMessage(
      { "x-tiktok-player": true, type },
      "*"
    );
    setIsMuted(!isMuted);
  };

  if (!videoId) {
    return (
      <a
        href="https://www.tiktok.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 flex items-center justify-center bg-black text-white"
      >
        Open TikTok to watch this video
      </a>
    );
  }

  return (
    <div className="absolute inset-0 isolate z-0 bg-black">
      {poster && (
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <iframe
        ref={playerRef}
        src={`https://www.tiktok.com/player/v1/${videoId}?autoplay=1&muted=1&loop=1&controls=0&progress_bar=0&play_button=0&volume_control=0&fullscreen_button=0&timestamp=0&music_info=0&description=0&rel=0&native_context_menu=0&closed_caption=0`}
        title={title}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        className="pointer-events-none absolute inset-0 z-0 h-full w-full border-0"
      />
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={
          isBuffering
            ? "Loading TikTok video"
            : isPlaying
              ? "Pause TikTok video"
              : "Play TikTok video"
        }
        title={isPlaying ? "Pause video" : "Play video"}
        className="absolute inset-0 z-[1] cursor-pointer bg-transparent focus-visible:outline-2 focus-visible:outline-white"
      >
        {isBuffering ? (
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-4 border-white/40 border-t-white"
          />
        ) : !isPlaying && (
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
        aria-label={isMuted ? "Unmute TikTok video" : "Mute TikTok video"}
        title={isMuted ? "Unmute video" : "Mute video"}
        className="absolute bottom-3 left-3 z-[2] flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white"
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
