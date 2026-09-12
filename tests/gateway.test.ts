import { describe, it, expect, vi, afterEach } from "vitest";
import { testConnection, streamCompletion } from "../src/llm/gateway";
import type { LLMConfig } from "../src/lib/types";

describe("LLM Gateway", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  const mockConfig: LLMConfig = {
    provider: "openrouter",
    apiKey: "test-api-key",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "google/gemma-4-26b-a4b-it:free"
  };

  describe("testConnection", () => {
    it("returns error if OpenRouter API key is missing", async () => {
      const res = await testConnection({ ...mockConfig, apiKey: "" });
      expect(res.success).toBe(false);
      expect(res.message).toContain("API Key is required");
    });

    it("handles successful test connection", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ model: "google/gemma-4-26b-a4b-it:free" })
      } as Response);

      const res = await testConnection(mockConfig);
      expect(res.success).toBe(true);
      expect(res.message).toContain("Connection successful");
    });

    it("handles HTTP error status from server", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Invalid API Key"
      } as Response);

      const res = await testConnection(mockConfig);
      expect(res.success).toBe(false);
      expect(res.message).toContain("401");
      expect(res.message).toContain("Invalid API Key");
    });

    it("handles network failure gracefully", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

      const res = await testConnection(mockConfig);
      expect(res.success).toBe(false);
      expect(res.message).toContain("Network Error");
      expect(res.message).toContain("Failed to fetch");
    });
  });

  describe("streamCompletion", () => {
    it("correctly decodes and streams SSE data chunks", async () => {
      const chunks = [
        'data: {"choices":[{"delta":{"content":"export default "}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"function App() {}"}}]}\n\n',
        "data: [DONE]\n\n"
      ];

      const encoder = new TextEncoder();
      let index = 0;
      const stream = new ReadableStream({
        pull(controller) {
          if (index < chunks.length) {
            controller.enqueue(encoder.encode(chunks[index++]));
          } else {
            controller.close();
          }
        }
      });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: stream
      } as Response);

      const deltas: string[] = [];
      const result = await streamCompletion(
        mockConfig,
        [{ role: "user", content: "hello" }],
        (chunk) => deltas.push(chunk)
      );

      expect(result).toBe("export default function App() {}");
      expect(deltas).toEqual(["export default ", "function App() {}"]);
    });

    it("throws explicit error when provider stream contains error payload", async () => {
      const chunks = [
        'data: {"error":{"message":"Rate limit exceeded for free models","code":429}}\n\n'
      ];

      const encoder = new TextEncoder();
      let index = 0;
      const stream = new ReadableStream({
        pull(controller) {
          if (index < chunks.length) {
            controller.enqueue(encoder.encode(chunks[index++]));
          } else {
            controller.close();
          }
        }
      });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: stream
      } as Response);

      await expect(
        streamCompletion(
          mockConfig,
          [{ role: "user", content: "hello" }],
          () => {}
        )
      ).rejects.toThrow("LLM Error: Rate limit exceeded for free models");
    });

    it("respects AbortSignal cancellation mid-stream", async () => {
      const controller = new AbortController();

      const chunks = [
        'data: {"choices":[{"delta":{"content":"First"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"Second"}}]}\n\n'
      ];
      const encoder = new TextEncoder();
      let index = 0;
      const stream = new ReadableStream({
        pull(ctrl) {
          if (index < chunks.length) {
            ctrl.enqueue(encoder.encode(chunks[index++]));
          } else {
            ctrl.close();
          }
        }
      });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: stream
      } as Response);

      const deltas: string[] = [];
      const result = await streamCompletion(
        mockConfig,
        [{ role: "user", content: "hello" }],
        (chunk) => {
          deltas.push(chunk);
          if (chunk === "First") {
            controller.abort();
          }
        },
        controller.signal
      );

      expect(deltas).toEqual(["First"]);
      expect(result).toBe("First");
    });
  });
});
