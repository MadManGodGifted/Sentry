"use client";

import { useEffect } from "react";
import {
  animateAmbient,
  animateNotifications,
  animatePalette,
  animateShellBoot,
  animateWorkspaceFrame
} from "@/lib/animations";

type AnimationHandle = {
  cancel?: () => unknown;
  revert?: () => unknown;
};

type SentryMotionProps = {
  activeSection: string;
  commandPaletteOpen: boolean;
  notificationCount: number;
};

function stopAnimations(handles: AnimationHandle[]) {
  handles.forEach((handle) => {
    if (typeof handle.cancel === "function") {
      handle.cancel();
      return;
    }

    handle.revert?.();
  });
}

export function SentryMotion({ activeSection, commandPaletteOpen, notificationCount }: SentryMotionProps) {
  useEffect(() => {
    const handles = [...animateShellBoot(), ...animateAmbient()];
    return () => stopAnimations(handles);
  }, []);

  useEffect(() => {
    let handles: AnimationHandle[] = [];
    const frame = window.requestAnimationFrame(() => {
      handles = animateWorkspaceFrame();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      stopAnimations(handles);
    };
  }, [activeSection]);

  useEffect(() => {
    let handles: AnimationHandle[] = [];
    const frame = window.requestAnimationFrame(() => {
      handles = animatePalette(commandPaletteOpen);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      stopAnimations(handles);
    };
  }, [commandPaletteOpen]);

  useEffect(() => {
    let handles: AnimationHandle[] = [];
    const frame = window.requestAnimationFrame(() => {
      handles = animateNotifications();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      stopAnimations(handles);
    };
  }, [notificationCount]);

  return null;
}
