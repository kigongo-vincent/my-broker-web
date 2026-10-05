import { BottomSheet } from "react-spring-bottom-sheet";
import "react-spring-bottom-sheet/dist/style.css";
import { useAppStore } from "../../store/app";
import { useInstall } from "../../hooks/install";

const InstallSheet = ({ enabled = true }: { enabled?: boolean }) => {
    const { showInstall, setShowInstall } = useAppStore();
    const { installed, canPrompt, iosHint, install } = useInstall();

    const open = enabled && showInstall && !installed && (canPrompt || iosHint);

    const close = () => setShowInstall(false);

    const handleInstall = async () => {
        const accepted = await install();
        if (accepted) close();
    };

    return (
        <BottomSheet open={open} onDismiss={close}>
            <div className="py-10 px-4 flex flex-col gap-4">
                <h3 className="text-xl font-semibold">Install My Broker</h3>

                {canPrompt ? (
                    <p className="text-text/60 leading-7">
                        Add the app to your home screen for faster access and a
                        full-screen experience.
                    </p>
                ) : (
                    <p className="text-text/60 leading-7">
                        To install, tap the <strong>Share</strong> icon in Safari, then
                        choose <strong>Add to Home Screen</strong>.
                    </p>
                )}

                {canPrompt ? (
                    <button
                        onClick={handleInstall}
                        className="btn outline-0 bg-primary text-white w-full rounded-full"
                    >
                        Install app
                    </button>
                ) : (
                    <button
                        onClick={close}
                        className="btn outline-0 bg-primary text-white w-full rounded-full"
                    >
                        Got it
                    </button>
                )}

                <button onClick={close} className="btn outline-0 bg-pale w-full rounded-full">
                    Not now
                </button>
            </div>
        </BottomSheet>
    );
};

export default InstallSheet;