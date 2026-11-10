// The opening: one hero moment (the name resolving) and a page that is
// finished in about 1.2 s. The scene is there from the first frame and
// brightens; the name's points sweep in from 150 ms; the frame fades in as
// one piece at 400 ms; the contours and the descent path arrive quietly
// afterwards. Any input skips to the finished state, and it plays once per
// visit: later loads in the same session start finished.

export const SKIP = "intro:skip";
const SEEN_KEY = "intro-seen";

export function introSeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage blocked (private mode): the intro simply plays again next time.
  }
}

// Any click, tap, scroll or key ends the intro at once.
export function listenForSkipInput() {
  const skip = () => {
    markIntroSeen();
    window.dispatchEvent(new Event(SKIP));
    remove();
  };
  const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
  const remove = () => events.forEach((name) => window.removeEventListener(name, skip));
  events.forEach((name) => window.addEventListener(name, skip, { passive: true }));
  return remove;
}

export function onSkip(run: () => void) {
  window.addEventListener(SKIP, run);
  return () => window.removeEventListener(SKIP, run);
}
