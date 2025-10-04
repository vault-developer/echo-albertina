import {SceneStateConfig} from "./types.ts";

export const LERP_FACTOR = 0.05;
export const MOUSE_INFLUENCE_X = 0.05;
export const MOUSE_INFLUENCE_Y = 0.5;

export const SLEEPING_CONFIG: SceneStateConfig = {
  red: 0.35,
  green: 0.35,
  blue: 0.35,
  bloom: 0.4,
  cameraZ: 18,
  frequency: 10
}

export const ACTIVE_CONFIG: SceneStateConfig = {
  red: 1.0,
  green: 0.6,
  blue: 1.0,
  bloom: 0.6,
  cameraZ: 14,
  frequency: 30
}
