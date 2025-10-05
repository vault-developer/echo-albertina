import {WORKER_MESSAGES} from "./constants.ts";
import {TTSProcessor} from "./tts/TTSProcessor.ts";
import {MainProcessor} from "./main/MainProcessor.ts";
import {ProgressInfo} from "@huggingface/transformers";

const {IN, OUT} = WORKER_MESSAGES;

/** Load all models */
await MainProcessor.loadModels({
  onDownloadProgress: (value: ProgressInfo) => {
    self.postMessage({type: OUT.STATUS_LOADING, value });
  }
});
self.postMessage({type: OUT.STATUS_READY, voices: TTSProcessor.model!.voices});

const mainProcessor = new MainProcessor();

/** Handle incoming messages */
self.onmessage = async (event) => {
  const {type, buffer} = event.data;

  if (type !== IN.AUDIO) {
    console.debug('=> worker:', event.data);
  }

  const handleMessage = {
    [IN.START_CALL]: () => mainProcessor.startCall(),
    [IN.END_CALL]: () => mainProcessor.endCall(),
    [IN.AUDIO]: () => mainProcessor.processBuffer(buffer)
  }[type];

  if (!handleMessage) {
    return console.error(`=> worker: unsupported incoming message: ${type}`);
  }

  handleMessage()
}