/**
 * Purpose: Hide the whole world behind absolute white, and reveal it again.
 * Context: A show waits in white before Play; a DOM overlay is invisible in XR.
 * Responsibility: Own the head-following veil sphere, its material, and its opacity.
 * Boundary: When the veil is up and how fast it lifts is Run's decision.
 */

import {
  BackSide,
  Mesh,
  MeshBasicMaterial,
  type Scene,
  SphereGeometry,
} from "three";
import type { WorldModule } from "../../world/module-runtime";
import type { Viewpoint } from "../../world/viewpoint";

/** Inside every camera's far plane, outside its near plane and any head offset. */
const VEIL_RADIUS_METERS = 1;
/** Drawn after everything else, so nothing in the world can paint over it. */
const VEIL_RENDER_ORDER = 10_000;

export interface WhiteVeilOptions {
  readonly scene: Scene;
  readonly viewpoint: Viewpoint;
}

export interface WhiteVeilHandle {
  readonly module: WorldModule;
  /** 0 shows the world untouched; 1 is absolute white in every eye. */
  readonly setPresence: (presence: number) => void;
}

/**
 * One small sphere around the head, seen from inside, with depth test off.
 * Following the viewpoint rather than parenting to the camera keeps it right
 * in an immersive session, where the head pose is written inside `render`.
 */
export function createWhiteVeil(options: WhiteVeilOptions): WhiteVeilHandle {
  let veil: Mesh<SphereGeometry, MeshBasicMaterial> | undefined;
  let presence = 1;
  let active = false;

  function applyPresence(): void {
    if (!veil) return;
    veil.material.opacity = presence;
    // Hidden rather than drawn at zero, so a lifted veil costs no draw.
    veil.visible = active && presence > 0;
  }

  return {
    setPresence: (next) => {
      presence = Math.min(1, Math.max(0, next));
      applyPresence();
    },
    module: {
      load: () => {
        veil = new Mesh(
          new SphereGeometry(VEIL_RADIUS_METERS, 16, 8),
          new MeshBasicMaterial({
            color: 0xffffff,
            side: BackSide,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            fog: false,
            toneMapped: false,
          }),
        );
        veil.renderOrder = VEIL_RENDER_ORDER;
        veil.frustumCulled = false;
        veil.position.copy(options.viewpoint.worldPosition);
        options.scene.add(veil);
        applyPresence();
      },
      activate: () => {
        active = true;
        applyPresence();
      },
      update: () => {
        veil?.position.copy(options.viewpoint.worldPosition);
      },
      deactivate: () => {
        active = false;
        applyPresence();
      },
      unload: () => {
        if (!veil) return;
        options.scene.remove(veil);
        veil.geometry.dispose();
        veil.material.dispose();
        veil = undefined;
      },
    },
  };
}
