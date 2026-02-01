
// Mock AsyncLocalStorage for browser environment
export class AsyncLocalStorage {
  getStore() {
    return undefined;
  }
  run(store: any, callback: () => void) {
    return callback();
  }
  enterWith(store: any) {
    // no-op
  }
}
