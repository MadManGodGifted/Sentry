"use client";

import { animate, createTimeline, stagger } from "animejs";

export const motionDurations = {
  fast: 150,
  medium: 260,
  large: 420,
  ambient: 6400
} as const;

export const motionEasings = {
  out: "outCubic",
  inOut: "inOutCubic",
  snap: "outExpo",
  ambient: "inOutSine"
} as const;

export const motionSprings = {
  soft: "spring(1, 80, 12, 0)",
  firm: "spring(1, 100, 14, 0)",
  precise: "spring(1, 120, 18, 0)"
} as const;

export const motionOffsets = {
  micro: 4,
  panel: 8,
  window: 14
} as const;

export function prefersReducedMotion() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function animateShellBoot(root: ParentNode = document) {
  if (prefersReducedMotion()) {
    return [];
  }

  const timeline = createTimeline({
    defaults: {
      ease: motionEasings.out
    }
  });

  timeline
    .add(root.querySelectorAll(".sentry-window"), {
      opacity: [0.94, 1],
      translateY: [motionOffsets.micro, 0],
      duration: motionDurations.medium
    })
    .add(
      root.querySelectorAll(".command-bar > *, .rail-link, .empty-module-frame, .workspace-meta-frame"),
      {
        opacity: [0, 1],
        translateY: [motionOffsets.panel, 0],
        duration: motionDurations.medium,
        delay: stagger(18)
      },
      "-=120"
    )
    .add(
      root.querySelectorAll(".sentry-dock button"),
      {
        opacity: [0, 1],
        translateY: [motionOffsets.panel, 0],
        duration: motionDurations.fast,
        delay: stagger(14)
      },
      "-=120"
    );

  return [timeline];
}

export function animateWorkspaceFrame(root: ParentNode = document) {
  if (prefersReducedMotion()) {
    return [];
  }

  const animations = [
    animate(root.querySelectorAll(".workspace-live-header, .viz-stats-strip section"), {
      opacity: [0, 1],
      translateY: [motionOffsets.micro, 0],
      duration: motionDurations.fast,
      delay: stagger(16),
      ease: motionEasings.out
    }),
    animate(root.querySelectorAll(".viz-chart-frame, .viz-timeline-frame, .viz-inspector-frame, .viz-table-frame, .viz-gauge-frame, .viz-panel, .viz-state-frame"), {
      opacity: [0, 1],
      translateY: [motionOffsets.panel, 0],
      duration: motionDurations.medium,
      delay: stagger(24),
      ease: motionEasings.out
    })
  ];

  return animations;
}

export function animatePalette(open: boolean, root: ParentNode = document) {
  if (!open || prefersReducedMotion()) {
    return [];
  }

  return [
    animate(root.querySelectorAll(".command-palette"), {
      opacity: [0, 1],
      translateY: [-motionOffsets.panel, 0],
      scale: [0.985, 1],
      duration: motionDurations.fast,
      ease: motionEasings.snap
    }),
    animate(root.querySelectorAll(".palette-results button"), {
      opacity: [0, 1],
      translateX: [-motionOffsets.micro, 0],
      duration: motionDurations.fast,
      delay: stagger(12),
      ease: motionEasings.out
    })
  ];
}

export function animateNotifications(root: ParentNode = document) {
  if (prefersReducedMotion()) {
    return [];
  }

  return [
    animate(root.querySelectorAll(".sentry-notification"), {
      opacity: [0, 1],
      translateX: [motionOffsets.window, 0],
      duration: motionDurations.fast,
      delay: stagger(18),
      ease: motionEasings.out
    })
  ];
}

export function animateAmbient(root: ParentNode = document) {
  if (prefersReducedMotion()) {
    return [];
  }

  return [
    animate(root.querySelectorAll(".screen-noise"), {
      opacity: [0.12, 0.2],
      duration: motionDurations.ambient,
      alternate: true,
      loop: true,
      ease: motionEasings.ambient
    }),
    animate(root.querySelectorAll(".brand-mark, .globe-status-led, .status-led"), {
      filter: ["brightness(0.9)", "brightness(1.14)"],
      duration: motionDurations.ambient,
      alternate: true,
      loop: true,
      ease: motionEasings.ambient
    })
  ];
}
