import {DataType} from "@huggingface/transformers";

export interface IModel {
  name: string;
  type: DataType  | Record<string, DataType>
}

export const ONNX_MODELS = {
  VAD: {
    SILERO_L: {name: '/models/vad/silero-vad', type: 'fp32'},
    SILERO_R: {name: 'xnohat/silero-vad', type: 'fp32'}
  },
  STT: {
    WHISPER_BASE_R: {name: 'onnx-community/whisper-base', type: {encoder_model: "fp32", decoder_model_merged: "fp32"}},
    WHISPER_BASE_L: {name: '/models/stt/whisper-base', type: {encoder_model: "fp32", decoder_model_merged: "fp32"}},
    WHISPER_SMALL_R: {name: 'onnx-community/whisper-small', type: {encoder_model: "fp32", decoder_model_merged: "fp32"}},
    WHISPER_SMALL_L: {name: '/models/stt/whisper-small', type: {encoder_model: "fp32", decoder_model_merged: "fp32"}}
  },
  LLM: {
    SMOLLM2_R: {name: 'HuggingFaceTB/SmolLM2-1.7B-Instruct', type: 'q4f16'},
    SMOLLM2_L: {name: '/models/llm/smollm2-1,7b-instruct', type: 'q4f16'}
  },
  TTS: {
    KOKORO_L: {name: '/models/tts/kokoro-82m-v1.0-onnx', type: 'fp32'},
    KOKORO_R: {name: 'onnx-community/Kokoro-82M-v1.0-ONNX', type: 'fp32'}
  },
} as const;

