import { getListingsRepository } from "../listings/mock-repository";
import { MockRequestsStore } from "./mock-store";

const globalStore = globalThis as unknown as { __handimenRequests?: MockRequestsStore };

export function getRequestsStore(): MockRequestsStore {
  globalStore.__handimenRequests ??= new MockRequestsStore(getListingsRepository());
  return globalStore.__handimenRequests;
}
