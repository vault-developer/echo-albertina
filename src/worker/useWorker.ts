import {WORKER_MESSAGES} from "./constants.ts";

const {OUT, IN} = WORKER_MESSAGES;

type IWorkerIncomingMessage =
  | { type: typeof IN.START_CALL }
  | { type: typeof IN.AUDIO; buffer: Float32Array }
  | { type: typeof IN.END_CALL};

export const useWorker = ({
 onInterrupt,
 onReady,
 onOutput,
}: {
  onInterrupt: () => void,
  onReady: () => void,
  onOutput: (audio: any) => void,
}) => {
  const worker = new Worker(new URL("./worker.ts", import.meta.url), {type: "module"});
  const wAction = (message: IWorkerIncomingMessage) => worker.postMessage(message);

  const onMessage = ({data}: { data: any }) => {
    console.debug('<= worker:', data);

    const handleMessage = {
      [OUT.STATUS_LOADING]: () => {
        // TODO: move to render part
        const {status, name, file, progress, total} = data.value;
        const id = name + file;
        if (status === 'initiate') {
          const element = document.createElement('div');
          element.id = id;
          element.innerHTML = `${id}: 0%`;
          document.getElementById('root')?.appendChild(element);
          Object.assign(element.style, {color: 'white', fontFamily: 'sans-serif'});
        } else if  (status === 'progress') {
          const element = document.getElementById(id);
          element!.innerHTML = `${id} (${Math.floor(total/1024/1024)} MB): ${Math.floor(progress)}%`
        } else if (status === 'done') {
          document.getElementById(id)?.remove();
        }
      },
      [OUT.STATUS_READY]: () => onReady(),
      [OUT.STATUS_SPEECH_START]: () => onInterrupt(),
      [OUT.STATUS_SPEECH_END]: () => {},
      [OUT.OUTPUT]: () => onOutput(data.result.audio),
    }[data.type];

    if (!handleMessage) {
      return console.error('<= worker: unsupported outcoming message:', data.type);
    }

    handleMessage();
  };

  worker.addEventListener("message", onMessage);

  return wAction;
}

