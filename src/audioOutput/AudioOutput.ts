import {PLAYBACK_WORKLET_MESSAGES, PLAYBACK_WORKLET_NAME} from "./constants.ts";

export class AudioOutput {
  private context: AudioContext|null = null;
  private worklet: AudioWorkletNode|null = null;
  public analyzer: AnalyserNode|null = null;

  public subscribe = async () => {
    this.context = new AudioContext({sampleRate: 24000});
    this.context.resume();

    await this.context.audioWorklet.addModule(new URL("./playbackWorklet.ts", import.meta.url));

    this.worklet = new AudioWorkletNode(this.context, PLAYBACK_WORKLET_NAME);
    this.analyzer = this.context.createAnalyser();
    this.analyzer.fftSize = 256;

    this.worklet.connect(this.analyzer);
    this.worklet.connect(this.context.destination);
  }

  public unsubscribe = async () => {
    await this.context?.close();
    this.worklet?.disconnect();
  }

  public playbackPlay = (audio: any) => {
    this.worklet?.port.postMessage(audio);
  }

  public playbackStop = () => {
    this.worklet?.port.postMessage(PLAYBACK_WORKLET_MESSAGES.INCOMING.stopPlayback);
  }
}
