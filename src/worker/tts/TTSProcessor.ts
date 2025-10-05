import {KokoroTTS, TextSplitterStream} from "kokoro-js";
import {IModel, IOnDownloadProgress} from "../main/constants.ts";

export class TTSProcessor {
  public static model: KokoroTTS | null = null;
  public voice: any = "af_heart";

  public static loadModel = async (model: IModel, onDownloadProgress: IOnDownloadProgress) => {
    this.model = await KokoroTTS.from_pretrained(model.name, {
      dtype: model.type as 'fp32',
      device: "webgpu",
      progress_callback: onDownloadProgress
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