import {
  AutoModelForCausalLM,
  AutoTokenizer,
  InterruptableStoppingCriteria,
  PreTrainedModel,
  PreTrainedTokenizer, TextStreamer
} from "@huggingface/transformers";
import {IModel, IOnDownloadProgress} from "../main/constants.ts";

type IChat = {
  role: 'user' | 'system' | 'assistant';
  content: string;
}[]

const createChat = (): IChat => [{
  role: "system",
  content: "You're a helpful and conversational voice assistant. Keep your responses short, clear, and casual.",
}];

export class LLMProcessor {
  public static model: PreTrainedModel | null = null;
  public static tokenizer: PreTrainedTokenizer | null = null;
  public history: IChat = createChat();
  public pastKeyValuesCache: any = null;
  public stoppingCriteria: InterruptableStoppingCriteria | null = null;

  public static loadModel = async (config: IModel, onDownloadProgress: IOnDownloadProgress) => {
    const model = await AutoModelForCausalLM.from_pretrained(config.name, {
      dtype: config.type,
      device: "webgpu",
      local_files_only: false,
      progress_callback: onDownloadProgress
    });
    const tokenizer = await AutoTokenizer.from_pretrained(config.name, {
      local_files_only: false,
      progress_callback: onDownloadProgress
    });
    await model.generate({ ...tokenizer("x"), max_new_tokens: 1 });

    this.model = model;
    this.tokenizer = tokenizer;
    return {model, tokenizer};
  }

  public addUserMessage = (content: string) => {
    this.history.push({role: 'user', content});
    console.debug('llm:history:', this.history);
  }

  public addAssistantMessage = (content: string) => {
    this.history.push({role: 'assistant', content});
    console.debug('llm:history:', this.history);
  }

  public resetState = () => {
    this.history = createChat();
    this.pastKeyValuesCache = null;
    this.stoppingCriteria = null;
  }

  public interrupt = () => {
    this.stoppingCriteria?.interrupt();
  }

  public response = async (onTextChunk: any) => {
    const inputs: any = LLMProcessor.tokenizer!.apply_chat_template(this.history, {
      add_generation_prompt: true,
      return_dict: true,
    });

    const streamer = new TextStreamer(LLMProcessor.tokenizer!, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: onTextChunk,
      token_callback_function: () => {},
    });

    const stoppingCriteria = new InterruptableStoppingCriteria();

    const { past_key_values, sequences } = await LLMProcessor.model!.generate({
      ...inputs,
      past_key_values: this.pastKeyValuesCache,
      do_sample: false,
      max_new_tokens: 1024,
      streamer,
      stopping_criteria: stoppingCriteria,
      return_dict_in_generate: true,
    }) as any;

    const [decoded] = LLMProcessor.tokenizer!.batch_decode(
      sequences.slice(null, [inputs.input_ids.dims[1], null]),
      { skip_special_tokens: true },
    );

    this.pastKeyValuesCache = past_key_values;
    this.stoppingCriteria = stoppingCriteria;

    this.addAssistantMessage(decoded)

    return decoded;
  }
}