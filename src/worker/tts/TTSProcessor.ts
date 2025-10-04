import {KokoroTTS, TextSplitterStream} from "kokoro-js";
import {IModel} from "../main/constants.ts";

export class TTSProcessor {
  public static model: KokoroTTS | null = null;
  public voice: any = "af_heart";

  public static loadModel = async (model: IModel) => {
    this.model = await KokoroTTS.from_pretrained(model.name, {
      dtype: model.type as 'fp32',
      device: "webgpu",
    })

    return this.model;
  }

  public getTextStream = () => {
    return new TextSplitterStream();
  }

  public getSpeechStream = (textStream: TextSplitterStream) => {
    return TTSProcessor.model!.stream(textStream, {voice: this.voice});
  }
}