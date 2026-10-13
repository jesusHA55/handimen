import { MockMessagesStore } from "./mock-store";

const globalMessages = globalThis as unknown as { __handimenMessages?: MockMessagesStore };

export function getMessagesStore(): MockMessagesStore {
  globalMessages.__handimenMessages ??= new MockMessagesStore();
  return globalMessages.__handimenMessages;
}
