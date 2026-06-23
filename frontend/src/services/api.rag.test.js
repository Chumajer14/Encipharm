import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRagDocuments, reindexRagDocuments, sendRagMessage, uploadRagDocument } from "./api";

describe("rag api service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("sends authenticated chat requests to the backend contract", async () => {
    const responseBody = {
      respuesta: "Respuesta con fuente",
      fuentes: [],
      conversacion_id: "conversation-1",
      tokens_usados: 10,
      diagnostico: {
        origen: "deepseek",
        proveedor: "DeepSeek",
        modelo: "deepseek-chat",
        fragmentos_documentales: 1,
        fragmentos_internos: 0,
      },
      timestamp: "2026-06-17T23:00:00Z",
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => responseBody,
    });

    const result = await sendRagMessage("firebase-token", {
      pregunta: "Cual es la dosis?",
      conversacion_id: null,
    });

    expect(result).toEqual(responseBody);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/rag/chat", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ pregunta: "Cual es la dosis?", conversacion_id: null }),
      headers: expect.objectContaining({
        Authorization: "Bearer firebase-token",
        "Content-Type": "application/json",
        "X-Enci-Client": "web",
      }),
    }));
  });

  it("uploads documents as multipart without JSON content type", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ documento: "manual.pdf", chunks_indexados: 4 }),
    });
    const file = new File(["contenido"], "manual.pdf", { type: "application/pdf" });

    await uploadRagDocument("firebase-token", file);

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/rag/documents/upload", expect.objectContaining({
      method: "POST",
      body: expect.any(FormData),
      headers: {
        Authorization: "Bearer firebase-token",
        "X-Enci-Client": "web",
      },
    }));
  });

  it("throws normalized API errors from RAG endpoints", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 403,
      headers: { get: () => null },
      text: async () => JSON.stringify({ detail: "Sin permisos para esta operacion" }),
    });

    await expect(getRagDocuments("firebase-token")).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      code: "API_HTTP_403",
      message: expect.stringContaining("Sin permisos para esta operacion"),
    });
  });

  it("calls the reindex endpoint with POST", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ chunks_indexados: 12 }),
    });

    await reindexRagDocuments("firebase-token");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/rag/documents/reindex", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer firebase-token" }),
    }));
  });
});
