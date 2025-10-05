export const WORKER_MESSAGES = {
  OUT: {
    STATUS_LOADING: 'status:loading_progress',
    STATUS_READY: 'status:ready',
    STATUS_SPEECH_START: 'status:vad:speech start',
    STATUS_SPEECH_END: 'status:vad:speech end',
    OUTPUT: 'output',
  },
  IN: {
    START_CALL: 'start_call',
    AUDIO: 'audio',
    END_CALL: 'end_call',
  }
};