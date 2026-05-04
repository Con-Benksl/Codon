import type { DnaSceneParams } from "../components/DnaParticles";

// morphTarget values:
// 'none'   — no morph, DNA helix stays as-is
// 'sphere' — scroll-driven scatter + sphere morph (other routes)
// 'logo'   — five-act narrative: dissolve → cinch → wrap → logo sphere

/**
 * DNA particle scene presets.
 *
 * The global scene is the default runtime background. It intentionally does not
 * change during route transitions, so navigation feels like foreground pages
 * moving over a stable, continuously rotating DNA stage.
 *
 * - home:     full opacity, right offset, slow rotation — hero backdrop
 * - app:      dimmed, centered, faster spin — subtle workspace ambiance
 */
export const globalDnaScene: DnaSceneParams = {
  opacity: 0.62,
  posX: 8,
  rotZ: 0.48,
  speed: 0.045,
  scrollMorphEnabled: true,
  maxScatterAmplitude: 3.0,
  morphTarget: 'logo',
};

export const dnaScenes: Record<string, DnaSceneParams> = {
  home: {
    opacity: 0.85,
    posX: 6,
    rotZ: 0.35,
    speed: 0.06,
    scrollMorphEnabled: true,
    maxScatterAmplitude: 3.0,
    morphTarget: 'logo',
  },
  projects: {
    opacity: 0.55,
    posX: 8,
    rotZ: 0.5,
    speed: 0.04,
    scrollMorphEnabled: true,
    maxScatterAmplitude: 5.0,
    morphTarget: 'none',
  },
  designer: {
    opacity: 0.45,
    posX: 10,
    rotZ: 0.6,
    speed: 0.03,
    scrollMorphEnabled: true,
    maxScatterAmplitude: 3.5,
    morphTarget: 'none',
  },
  chat: {
    opacity: 0.4,
    posX: 12,
    rotZ: 0.4,
    speed: 0.08,
    scrollMorphEnabled: true,
    maxScatterAmplitude: 3.5,
    morphTarget: 'none',
  },
  analysis: {
    opacity: 0.5,
    posX: 9,
    rotZ: 0.55,
    speed: 0.05,
    scrollMorphEnabled: true,
    maxScatterAmplitude: 5.0,
    morphTarget: 'none',
  },
  login: {
    opacity: 0.15,
    posX: 0,
    rotZ: 0.2,
    speed: 0.02,
    scrollMorphEnabled: false,
    maxScatterAmplitude: 0,
    morphTarget: 'none',
  },
};

/** Resolve pathname to a scene key */
export function getSceneForPath(pathname: string): DnaSceneParams {
  if (pathname === "/") return dnaScenes.home;
  const key = pathname.split("/")[1];
  return dnaScenes[key] ?? dnaScenes.home;
}
