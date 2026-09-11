const INTERCEPT_EVENTS = ["click", "mousedown", "mouseup", "pointerdown", "pointerup"];
export class EventManager {
    isCapturing = false;
    clickInterceptor;
    keydownInterceptor;
    navHandlers;
    constructor(onSelect, navHandlers) {
        this.navHandlers = navHandlers;
        this.clickInterceptor = (e) => {
            if (!this.isCapturing)
                return;
            // Ignore clicks originating from inside Copage Shadow DOM
            const path = e.composedPath();
            for (const el of path) {
                if (el instanceof HTMLElement && el.tagName.toLowerCase() === "copage-inspector-root") {
                    return;
                }
            }
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            if (e.type === "click" && e.target instanceof HTMLElement) {
                onSelect(e.target);
            }
        };
        this.keydownInterceptor = (e) => {
            if (!this.isCapturing)
                return;
            // If typing inside an input/textarea inside our dock, do not intercept navigation keys
            const active = document.activeElement;
            if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")) {
                if (e.key === "Escape") {
                    this.navHandlers.onCancel();
                }
                return;
            }
            switch (e.key) {
                case "ArrowUp":
                    e.preventDefault();
                    this.navHandlers.onParent();
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    this.navHandlers.onChild();
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    this.navHandlers.onPrevSibling();
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    this.navHandlers.onNextSibling();
                    break;
                case "Enter":
                    e.preventDefault();
                    this.navHandlers.onConfirm();
                    break;
                case "Escape":
                    e.preventDefault();
                    this.navHandlers.onCancel();
                    break;
            }
        };
    }
    enable() {
        this.isCapturing = true;
        INTERCEPT_EVENTS.forEach((evt) => {
            window.addEventListener(evt, this.clickInterceptor, { capture: true });
        });
        window.addEventListener("keydown", this.keydownInterceptor, { capture: true });
    }
    disable() {
        this.isCapturing = false;
        INTERCEPT_EVENTS.forEach((evt) => {
            window.removeEventListener(evt, this.clickInterceptor, { capture: true });
        });
        window.removeEventListener("keydown", this.keydownInterceptor, { capture: true });
    }
}
