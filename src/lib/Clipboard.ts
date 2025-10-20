export default class Clipboard extends Promise<void> {
  public static writeText(text: string) {
    return new Clipboard(text);
  }

  public abort: (reason?: unknown) => void;

  private constructor(text: string) {
    const { promise, resolve, reject } = Promise.withResolvers<void>();

    super((internalResolve, internalReject) => {
      promise.then(internalResolve).catch(internalReject);
    });

    this.abort = reject;

    navigator.clipboard.writeText(text).then(resolve).catch(reject);
  }
}
