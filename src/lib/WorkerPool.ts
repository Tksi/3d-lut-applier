/**
 * WorkerPool
 */
export class WorkerPool<Result> {
  #workers: {
    worker: Worker;
    isBusy: boolean;
  }[] = [];
  #messageQueue: [unknown, Transferable[] | undefined][] = [];
  #onEnd: (() => void) | undefined;
  #isFixed: boolean = false;

  constructor(
    workerUrl: string,
    onMessage?: (result: Result) => void,
    onEnd?: () => void,
    size: number = navigator.hardwareConcurrency,
  ) {
    this.#onEnd = onEnd;

    for (let i = 0; i < size; i++) {
      const worker = new Worker(workerUrl, { type: 'module' });
      worker.addEventListener('message', ({ data }: { data: Result }) => {
        onMessage?.(data);
        const thisWorker = this.#workers.find(({ worker: w }) => w === worker);
        if (thisWorker) thisWorker.isBusy = false;
        this.#run();
      });
      worker.addEventListener('error', (e) => {
        throw new Error(`Worker error: ${e.message}`);
      });

      this.#workers.push({
        worker,
        isBusy: false,
      });
    }

    URL.revokeObjectURL(workerUrl);
  }

  get #isAllIdle() {
    return this.#workers.every(({ isBusy }) => !isBusy);
  }

  get #idleWorker() {
    return this.#workers.find(({ isBusy }) => !isBusy);
  }

  add(message: unknown, transfer?: Transferable[]) {
    this.#messageQueue.push([message, transfer]);
    this.#run();
  }

  fix() {
    this.#isFixed = true;
    this.#run();
  }

  #run() {
    while (this.#idleWorker && this.#messageQueue.length > 0) {
      const idleWorker = this.#idleWorker;
      const message = this.#messageQueue.shift()!;
      idleWorker.isBusy = true;
      // @ts-expect-error TypeScriptの型がおかしい
      idleWorker.worker.postMessage(...message);
    }

    if (this.#isFixed && this.#isAllIdle && this.#messageQueue.length === 0) {
      this.#terminate();
    }
  }

  #terminate() {
    this.#onEnd?.();

    for (const { worker } of this.#workers) {
      worker.terminate();
    }
  }
}
