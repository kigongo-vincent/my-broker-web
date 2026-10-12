const DARK = "#0d121b";
const LIGHT = "#ffffff"; // use your light --color-paper; try "#fefefe" if pure white misbehaves

export function initThemeColor() {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
        let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "theme-color";
            document.head.appendChild(meta);
        }
        meta.content = mq.matches ? DARK : LIGHT;
    };

    apply();
    mq.addEventListener("change", apply);
}