import {INPUT_WORKLET_PROCESSOR_NAME} from "./constants.ts";
import {INPUT_SAMPLE_RATE_S} from "../constants.ts";
import recordWorkletUrl from './recordWorklet.ts?worker&url';

export class AudioInput {
  private context: AudioContext|null = null;
  private source: MediaStreamAudioSourceNode|null = null;
  private worklet: AudioWorkletNode|null = null;
  private readonly onRecord: (buffer: any) => void = () => {};

  public analyzer: AnalyserNode|null = null;

  constructor({onRecord}: {onRecord: (buffer: any) => void}) {
    this.onRecord = onRecord;
  }

  public subscribe = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true,
        sampleRate: INPUT_SAMPLE_RATE_S,
      },
    });
    if (!mediaStream) return;
    this.context = new window.AudioContext({sampleRate: INPUT_SAMPLE_RATE_S});
    this.analyzer = this.context.createAnalyser();
    this.analyzer.fftSize = 256;
    this.source = this.context.createMediaStreamSource(mediaStream);
    this.source.connect(this.analyzer);

    await this.context.audioWorklet.addModule(recordWorkletUrl);

    this.worklet = new AudioWorkletNode(this.context, INPUT_WORKLET_PROCESSOR_NAME, {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      channelCount: 1,
      channelCountMode: "explicit",
      channelInterpretation: "discrete",
    });

    this.source.connect(this.worklet);
    this.worklet.port.onmessage = (event: { data: { buffer: any; }; }) => {
      const {buffer} = event.data;
      this.onRecord(buffer);
    };
  }

  public unsubscribe = async () => {
    await this.context?.close();
    this.worklet?.disconnect();
    this.source?.disconnect();
  }
}