import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChatTyping } from "../useChatTyping";

type SocketCallback = (payload?: unknown) => void;

interface MockSocket {
  on: (event: string, cb: SocketCallback) => void;
  off: (event: string) => void;
  emit: (event: string, data?: unknown) => void;
}

describe("useChatTyping", () => {
  let mockSocket: MockSocket;
  const handlers: Record<string, SocketCallback> = {};

  beforeEach(() => {
    vi.useFakeTimers();
    mockSocket = {
      on: vi.fn((event: string, cb: SocketCallback) => {
        handlers[event] = cb;
      }),
      off: vi.fn((event: string) => {
        delete handlers[event];
      }),
      emit: vi.fn(),
    };
  });

  it("initializes with empty typing users", () => {
    const { result } = renderHook(() =>
      useChatTyping({
        conversationId: "conv-1",
        currentUserId: "user-me",
        socket: mockSocket as unknown as null,
        isConnected: true,
      })
    );

    expect(result.current.typingUsers.size).toBe(0);
  });

  it("adds user to typingUsers when chat:typing_start is received", () => {
    const { result } = renderHook(() =>
      useChatTyping({
        conversationId: "conv-1",
        currentUserId: "user-me",
        socket: mockSocket as unknown as null,
        isConnected: true,
      })
    );

    act(() => {
      handlers["chat:typing_start"]?.({
        conversationId: "conv-1",
        userId: "user-other",
      });
    });

    expect(result.current.typingUsers.has("user-other")).toBe(true);
  });

  it("ignores typing events from current user", () => {
    const { result } = renderHook(() =>
      useChatTyping({
        conversationId: "conv-1",
        currentUserId: "user-me",
        socket: mockSocket as unknown as null,
        isConnected: true,
      })
    );

    act(() => {
      handlers["chat:typing_start"]?.({
        conversationId: "conv-1",
        userId: "user-me",
      });
    });

    expect(result.current.typingUsers.size).toBe(0);
  });

  it("removes user from typingUsers when chat:typing_stop is received", () => {
    const { result } = renderHook(() =>
      useChatTyping({
        conversationId: "conv-1",
        currentUserId: "user-me",
        socket: mockSocket as unknown as null,
        isConnected: true,
      })
    );

    act(() => {
      handlers["chat:typing_start"]?.({
        conversationId: "conv-1",
        userId: "user-other",
      });
    });
    expect(result.current.typingUsers.has("user-other")).toBe(true);

    act(() => {
      handlers["chat:typing_stop"]?.({
        conversationId: "conv-1",
        userId: "user-other",
      });
    });
    expect(result.current.typingUsers.has("user-other")).toBe(false);
  });

  it("emits chat:typing_start and debounces chat:typing_stop after 3s", () => {
    const { result } = renderHook(() =>
      useChatTyping({
        conversationId: "conv-1",
        currentUserId: "user-me",
        socket: mockSocket as unknown as null,
        isConnected: true,
      })
    );

    act(() => {
      result.current.handleTyping();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("chat:typing_start", {
      conversationId: "conv-1",
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("chat:typing_stop", {
      conversationId: "conv-1",
    });
  });
});
