import Lineicons from "@lineiconshq/react-lineicons";
import { useInstallPrompt } from "../../hooks/install";
import { CloudDownloadSolid } from "@lineiconshq/free-icons";

export function InstallButton() {
    const { canInstall, showIOSHint, install } = useInstallPrompt();

    if (canInstall) {
        return (
            <button
                onClick={install}
                className="btn bg-primary"
            >
                <Lineicons icon={CloudDownloadSolid} />
                Install app
            </button>
        );
    }

    if (showIOSHint) {
        return (
            <p className="text-sm text-gray-600">
                To install: tap the <strong>Share</strong> icon, then{" "}
                <strong>Add to Home Screen</strong>.
            </p>
        );
    }

    return null; // already installed or not supported
}