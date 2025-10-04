import {pipeline} from "@huggingface/transformers";
import {INPUT_SAMPLE_RATE_S} from "../../constants.ts";
import {IModel} from "../main/constants.ts";

export class STTProcessor {
  public static model: any = null;

  public static loadModel = async (model: IModel) => {
    const pipe = await pipeline(
      "automatic-speech-recognition",
      model.name,
      {
        device: "webgpu",
        local_files_only: false,
        dtype: model.type
      },
    );

    await pipe(new Float32Array(INPUT_SAMPLE_RATE_S));
    this.model = pipe;
    return pipe;
  }

  public process = async (buffer: Float32Array) => {
    try {
      const { text } = await STTProcessor.model(buffer);
      const trimmedText = text.trim();

      // Check if transcription is empty or blank
      if (["", "[BLANK_AUDIO]"].includes(trimmedText)) {
        return {
          success: false,
          text: null
        };
      }

      return {
        success: true,
        text: trimmedText
      };
    } catch (error) {
      console.error("Transcription error:", error);
      return {
        success: false,
        text: null
      };
    }
  }
}