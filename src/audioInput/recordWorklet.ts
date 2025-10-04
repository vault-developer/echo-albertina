import {INPUT_WORKLET_PROCESSOR_NAME} from "./constants.ts";

const MIN_CHUNK_SIZE = 512;
let globalPointer = 0;
let globalBuffer = new Float32Array(MIN_CHUNK_SIZE);

class RecordWorklet extends AudioWorkletProcessor {
  process(inputs: any) {
    const buffer = inputs[0][0];
    if (!buffer) return;

    globalBuffer.set(buffer, globalPointer);
    globalPointer += buffer.length;

    if (globalPointer >= MIN_CHUNK_SIZE) {
      this.port.postMessage({ buffer: globalBuffer });
      globalBuffer.fill(0);
      globalPointer = 0;
    }

    return true;
  }
}

registerProcessor(INPUT_WORKLET_PROCESSOR_NAME, RecordWorklet as any);
