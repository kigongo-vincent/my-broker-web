import Lineicons from "@lineiconshq/react-lineicons";
import { CloudDownloadSolid } from "@lineiconshq/free-icons";
import { useInstall } from "../../hooks/install";

export function InstallButton() {
    const { installed, canPrompt, iosHint, install } = useInstall();

    // already installed (running standalone)
    if (installed) return null;

    // Android / desktop Chromium: real install prompt
    if (canPrompt) {
        return (
            <button onClick={install} className="btn bg-primary text-white">
                <Lineicons icon={CloudDownloadSolid} />
                Install app
            </button>
        );
    }

    // iOS Safari: no install event, so show instructions
    if (iosHint) {
        return (
            <p className="text-sm text-text/60">
                To install: tap the <strong>Share</strong> icon, then{" "}
                <strong>Add to Home Screen</strong>.
            </p>
        );
    }

    return null; // not installable or not supported
}