// The home page opens with overlapping hand-offs: the sky resolves from
// coarse blocks (0 to 1 s); the column builds from about 0.6 s while it
// sharpens; the name's scan starts about 0.35 s later, once its box is
// there, and the name is resolved by about 2.2 s. The contours and the
// descent path are static parts of the landscape. Steps signal each other
// through window events, with a flag left behind so a late listener still
// hears them. Any input skips to the finished state, and the opening plays
// once per visit.

export const SKY_RESOLVING = "intro:sky-resolving";
export const COLUMN_DONE = "intro:column-done";
export const NAME_DONE = "intro:name-done";
export const SKIP = "intro:skip";
const SEEN_KEY = "intro-seen";

type IntroWindow = Window & { __intro?: Record<string, boolean> };

export function signal(name: string) {
  const w = window as IntroWindow;
  w.__intro = { ...w.__intro, [name]: true };
  window.dispatchEvent(new Event(name));
}

export function hasHappened(name: string) {
  return Boolean((window as IntroWindow).__intro?.[name]);
}

// Calls run once, when the step has happened (or the intro was skipped), or
// after fallbackMs at the latest, so a missing signal never stalls the page.
export function after(name: string, run: () => void, fallbackMs: number) {
  let done = false;
  const once = () => {
    if (done) return;
    done = true;
    window.removeEventListener(name, once);
    window.removeEventListener(SKIP, once);
    window.clearTimeout(timer);
    run();
  };
  const timer = window.setTimeout(once, hasHappened(name) || hasHappened(SKIP) ? 0 : fallbackMs);
  window.addEventListener(name, once);
  window.addEventListener(SKIP, once);
  return () => {
    done = true;
    window.removeEventListener(name, once);
    window.removeEventListener(SKIP, once);
    window.clearTimeout(timer);
  };
}

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
    // Storage blocked (private mode): the opening simply plays again next time.
  }
}

// Any click, tap, scroll or key ends the opening at once.
export function listenForSkipInput() {
  const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
  const remove = () => events.forEach((name) => window.removeEventListener(name, skip));
  const skip = () => {
    remove();
    markIntroSeen();
    signal(SKIP);
  };
  events.forEach((name) => window.addEventListener(name, skip, { passive: true }));
  return remove;
}

export function onSkip(run: () => void) {
  if (hasHappened(SKIP)) run();
  window.addEventListener(SKIP, run);
  return () => window.removeEventListener(SKIP, run);
}
