class Node<T> {
  constructor(
    public value: T,
    public next: Node<T> | null = null
  ) {}
}

export class LinkedQueue<T> {
  private head: Node<T> | null = null;
  private tail: Node<T> | null = null;

  public enqueue(value: T) {
    const node = new Node(value);
    if (this.tail) {
      this.tail.next = node;
      this.tail = node;
    } else {
      this.head = this.tail = node;
    }
  }

  public dequeue(): T | null {
    if (!this.head) return null;

    const value = this.head.value;
    this.head = this.head.next;
    if (!this.head) this.tail = null;

    return value;
  }

  public isEmpty() {
    return this.head === null;
  }
}

