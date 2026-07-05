type GlobeControls = {
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  enableDamping?: boolean;
  maxDistance?: number;
  minDistance?: number;
};

export function applyGlobeControls(globe: { controls?: () => GlobeControls }) {
  const controls = globe.controls?.();
  if (!controls) {
    return;
  }

  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.18;
  controls.enableDamping = true;
  controls.minDistance = 160;
  controls.maxDistance = 520;
}
