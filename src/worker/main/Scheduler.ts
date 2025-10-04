import {LinkedQueue} from "./LinkedQueue.ts";

export class Scheduler {
  private isRunning = false;
  private queue = new LinkedQueue<() => Promise<void>>();

  public add(task: () => Promise<void>) {
    this.queue.enqueue(task);
    if (!this.isRunning) {
      this.run();
    }
  }

  private async run() {
    this.isRunning = true;

    while (!this.queue.isEmpty()) {
      const task = this.queue.dequeue();
      try {
        await task?.();
      } catch (err) {
        console.error("Scheduler task failed:", err);
      }
    }

    this.isRunning = false;
  }
}