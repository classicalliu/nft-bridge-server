export abstract class BaseRunner {
  protected isRunning: boolean;
  protected livenessCheckIntervalSeconds: number;

  constructor({ livenessCheckIntervalSeconds = 5 } = {}) {
    this.isRunning = false;
    this.livenessCheckIntervalSeconds = livenessCheckIntervalSeconds;
  }

  public async startForever() {
    await this.start();
    setInterval(async () => {
      if (!this.running()) {
        console.error(
          `${this.constructor.name} has stopped, maybe check the log?`
        );
        await this.start();
      }
    }, this.livenessCheckIntervalSeconds * 1000);
  }

  async start() {
    this.isRunning = true;
    this.scheduleLoop();
  }

  stop() {
    this.isRunning = false;
  }

  running() {
    return this.isRunning;
  }

  scheduleLoop(timeout = 1) {
    setTimeout(() => {
      this.loop();
    }, timeout);
  }

  loop() {
    if (!this.running()) {
      return;
    }
    this.poll()
      .then((timeout) => {
        this.scheduleLoop(timeout);
      })
      .catch((e) => {
        console.error(`Error occurs: ${e} ${e.stack}, stopping!`);
        this.stop();
      });
  }

  abstract poll(): Promise<number>;
}
