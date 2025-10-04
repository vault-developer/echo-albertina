export class ManagedBuffer {
  public data: Float32Array = new Float32Array();

  public append = (buffer: Float32Array) => {
    const newBuffer = new Float32Array(this.data.length + buffer.length);
    newBuffer.set(this.data);
    newBuffer.set(buffer, this.data.length);
    this.data = newBuffer;
  }

  public reset = () => {
    this.data = new Float32Array();
  }
}