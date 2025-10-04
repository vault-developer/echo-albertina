import {AudioOutput} from "../audioOutput/AudioOutput.ts";
import {AudioInput} from "../audioInput/AudioInput.ts";

export type SceneStateConfig = {
  red: number;
  green: number;
  blue: number;
  bloom: number;
  cameraZ: number;
  frequency: number;
}

export interface RenderSceneParams {
  onCallStart: () => void;
  onCallEnd: () => void;
  audioInput: AudioInput;
  audioOutput: AudioOutput;
}