import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "../api.client";
import { InternalAxiosRequestConfig } from "axios";

interface InterceptorHandler {
  fulfilled: (config: InternalAxiosRequestConfig) => Promise<InternalAxiosRequestConfig> | InternalAxiosRequestConfig;
}

interface InterceptorManagerWithHandlers {
  handlers: InterceptorHandler[];
}

describe("apiClient", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("attaches Authorization header if accessToken exists in localStorage", async () => {
    localStorage.setItem("accessToken", "test-token-123");

    const manager = apiClient.interceptors.request as unknown as InterceptorManagerWithHandlers;
    const requestHandler = manager.handlers[0].fulfilled;
    const config = await requestHandler({
      headers: {},
    } as InternalAxiosRequestConfig);

    expect(config.headers.Authorization).toBe("Bearer test-token-123");
  });

  it("does not attach Authorization header if accessToken is missing", async () => {
    const manager = apiClient.interceptors.request as unknown as InterceptorManagerWithHandlers;
    const requestHandler = manager.handlers[0].fulfilled;
    const config = await requestHandler({
      headers: {},
    } as InternalAxiosRequestConfig);

    expect(config.headers.Authorization).toBeUndefined();
  });
});
