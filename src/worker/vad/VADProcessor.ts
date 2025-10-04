import {AutoConfig, AutoModel, PreTrainedModel, Tensor} from "@huggingface/transformers";
import {INPUT_SAMPLE_RATE_S} from "../../constants.ts";
import {createDebounce} from "./utils/debounce.ts";
import {ManagedBuffer} from "./utils/ManagedBuffer.ts";
import {IModel} from "../main/constants.ts";

// Probabilities above this value are considered as speech
export const SPEECH_THRESHOLD = 0.1;
// Consider speech as not stopped until MAX_SILENCE_BETWEEN_WORDS_S is reached
export const MAX_SILENCE_BETWEEN_WORDS_MS = 500;

export class VADProcessor {
  private static model: PreTrainedModel | null = null;
  private state = new Tensor("float32", new Float32Array(2 * 1 * 128), [2, 1, 128]);
  private sampleRate = new Tensor("int64", [INPUT_SAMPLE_RATE_S], []);

  private readonly onSpeechStart: VoidFunction = () => undefined;
  private readonly onSpeechEnd: (buffer: Float32Array) => void = (_buffer: Float32Array) => undefined;

  private isSpeech: boolean = false;
  private mBuffer = new ManagedBuffer();

  constructor({
    onSpeechStart,
    onSpeechEnd
  }: {
    onSpeechStart: VoidFunction;
    onSpeechEnd: (buffer: Float32Array) => void;
  }) {
    this.onSpeechStart = onSpeechStart;
    this.onSpeechEnd = onSpeechEnd;
  }

  public static loadModel = async (model: IModel) => {
    const config = await AutoConfig.from_pretrained(model.name, {
      local_files_only: false,
    });
    this.model = await AutoModel.from_pretrained(model.name, {
      config,
      dtype: model.type,
    })
  }

  public process = async (buffer: Float32Array) => {
    const isSpeech = await this.runModel(buffer);
    const wasSpeech = this.isSpeech;

    // skip silence block
    if (!isSpeech) {
      return;
    }

    // handle speech start
    if (!wasSpeech) {
      this.onSpeechStart();
      this.isSpeech = isSpeech;
    }

    this.mBuffer.append(buffer);
    this.debouncedDispatch();
  }

  private runModel = async (buffer: Float32Array) => {
    const { stateN, output } = await VADProcessor.model!({
      input: new Tensor("float32", buffer, [1, buffer.length]),
      sr: this.sampleRate,
      state: this.state,
    });

    this.state = stateN;
    const confidence = output.data[0];
    return confidence >= SPEECH_THRESHOLD;
  }

  private debouncedDispatch = createDebounce(() => {
    this.onSpeechEnd(this.mBuffer.data);
    this.mBuffer.reset();
    this.isSpeech = false;
  }, MAX_SILENCE_BETWEEN_WORDS_MS)
}