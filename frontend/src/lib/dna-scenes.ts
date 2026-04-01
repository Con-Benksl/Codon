import type { DnaSceneParams } from "../components/DnaParticles";

/**
 * DNA particle scene presets per route.
 * DnaParticles interpolates smoothly between these on navigation.
 *
 * - home:     full opacity, right offset, slow rotation — hero backdrop
 * - app:      dimmed, centered, faster spin — subtle workspace ambiance
 */
export const dnaScenes: Record<string, DnaSceneParams> = {
  home: {
    opacity: 1.0,
    posX: 6,
    rotZ: 0.35,
    speed: 0.06,
  },
  projects: {
    opacity: 0.35,
    posX: 8,
    rotZ: 0.5,
    speed: 0.04,
  },
  designer: {
    opacity: 0.25,
    posX: 10,
    rotZ: 0.6,
    speed: 0.03,
  },
  chat: {
    opacity: 0.2,
    posX: 12,
    rotZ: 0.4,
    speed: 0.08,
  },
  analysis: {
    opacity: 0.3,
    posX: 9,
    rotZ: 0.55,
    speed: 0.05,
  },
  login: {
    opacity: 0.08,
    posX: 0,
    rotZ: 0.2,
    speed: 0.02,
  },
};

/** Resolve pathname to a scene key */
export function getSceneForPath(pathname: string): DnaSceneParams {
  if (pathname === "/") return dnaScenes.home;
  const key = pathname.split("/")[1];
  return dnaScenes[key] ?? dnaScenes.home;
}
