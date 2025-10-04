import {VADProcessor} from "../vad/VADProcessor.ts";
import {STTProcessor} from "../sst/STTProcessor.ts";
import {TTSProcessor} from "../tts/TTSProcessor.ts";
import {LLMProcessor} from "../llm/LLMProcessor.ts";
import {WORKER_MESSAGES} from "../constants.ts";
import {env} from '@huggingface/transformers';
import {ONNX_MODELS} from "./constants.ts";
import {Scheduler} from "./Scheduler.ts";

env.allowLocalModels = true;

const {OUT} = WORKER_MESSAGES;
const {VAD, TTS, STT, LLM} = ONNX_MODELS;

export class MainProcessor {
  public vad: VADProcessor;
  public stt: STTProcessor;
  public llm: LLMProcessor;
  public tts: TTSProcessor;

  private scheduler = new Scheduler();

  static loadModels = async () => {
    await Promise.all([
      LLMProcessor.loadModel(LLM.SMOLLM2_R),
      TTSProcessor.loadModel(TTS.KOKORO_R),
      STTProcessor.loadModel(STT.WHISPER_SMALL_R),
      VADProcessor.loadModel(VAD.SILERO_R)
    ]);
  }

  constructor() {
    this.vad = new VADProcessor(this.getVadCallbacks());
    this.stt = new STTProcessor();
    this.llm = new LLMProcessor();
    this.tts = new TTSProcessor();
  }

  public startCall = async () => {
    const text = 'Hey there, my name is Albertina! How can I help you today?';

    // 2. Set up text streaming
    const ttsIncomingStream = this.tts.getTextStream();
    const ttsOutcomingStream = this.tts.getSpeechStream(ttsIncomingStream);
    ttsIncomingStream.push(text);
    ttsIncomingStream.close();

    for await (const chunk of ttsOutcomingStream) {
      const {text, audio} = chunk;
      self.postMessage({type: OUT.OUTPUT, text, result: audio});
    }

    this.llm.addAssistantMessage(text);
    return;
  }

  public endCall = () => {
    this.llm.resetState();
  }

  public processBuffer = (buffer: Float32Array) => {
    this.scheduler.add(() => this.vad.process(buffer));
  }

  private getVadCallbacks = () => ({
    onSpeechStart: () => {
      self.postMessage({type: OUT.STATUS_SPEECH_START})
    },
    onSpeechEnd: (buffer: Float32Array) => {
      this.scheduler.add(async () => {
        self.postMessage({type: OUT.STATUS_SPEECH_END})

        // 1. Transcription Pipeline
        const {success, text} = await this.stt.process(buffer);
        if (!success) return;
        this.llm.addUserMessage(text);

        // 2. Set up text streaming
        const ttsIncomingStream = this.tts.getTextStream();
        const ttsOutcomingStream = this.tts.getSpeechStream(ttsIncomingStream);

        // 3. LLM Pipeline
        await this.llm.response((text: any) => ttsIncomingStream.push(text));

        // 4. Output audio
        ttsIncomingStream.close();
        for await (const chunk of ttsOutcomingStream) {
          const {text, audio} = chunk;
          self.postMessage({type: OUT.OUTPUT, text, result: audio});
        }
      })
    },
  })
}