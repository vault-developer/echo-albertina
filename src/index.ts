import './render/render.ts';
import {useWorker} from "./worker/useWorker.ts";
import {AudioInput} from "./audioInput/AudioInput.ts";
import {AudioOutput} from "./audioOutput/AudioOutput.ts";
import {Render} from "./render/render.ts";

const audioInput = new AudioInput({
  onRecord: audio => wAction({type: "audio", buffer: audio})
});
const audioOutput = new AudioOutput();
const ui = new Render();

const wAction = useWorker({
  onReady: () => ui.start({onCallEnd, onCallStart, audioInput, audioOutput}),
  onInterrupt: () => audioOutput.playbackStop(),
  onOutput: (audio:any) => audioOutput.playbackPlay(audio),
})

async function onCallStart() {
  try {
    await audioInput.subscribe();
    await audioOutput.subscribe();
    wAction({type: "start_call"});
  } catch (err: any) {
    console.error(err);
  }
}

async function onCallEnd() {
  wAction({type: "end_call"});
  await audioInput.unsubscribe();
  await audioOutput.unsubscribe();
}