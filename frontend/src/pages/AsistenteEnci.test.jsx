import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AsistenteEnci from "./AsistenteEnci";
import { useAuth } from "../auth/authContext";
import { getRagConversations, sendRagMessage } from "../services/api";

vi.mock("../auth/authContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../services/api", () => ({
  getRagDocuments: vi.fn().mockResolvedValue([]),
  getRagConversations: vi.fn().mockResolvedValue([]),
  reindexRagDocuments: vi.fn().mockResolvedValue({ chunks_indexados: 0 }),
  sendRagMessage: vi.fn(),
  uploadRagDocument: vi.fn().mockResolvedValue({ documento: "manual.pdf", chunks_indexados: 1 }),
}));

describe("AsistenteEnci", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRagConversations.mockResolvedValue([]);
    useAuth.mockReturnValue({
      backendUser: { rol: "vendedor" },
      idToken: "firebase-token",
    });
  });

  it("renders the chat without admin document controls for sellers", () => {
    render(<AsistenteEnci />);

    expect(screen.getByRole("heading", { name: "Consulta tecnica y comercial" })).toBeInTheDocument();
    expect(screen.getByText("Sin mensajes.")).toBeInTheDocument();
    expect(screen.queryByText("Corpus documental")).not.toBeInTheDocument();
  });

  it("renders upload controls only for admins", () => {
    useAuth.mockReturnValue({
      backendUser: { rol: "admin" },
      idToken: "firebase-token",
    });

    render(<AsistenteEnci />);

    expect(screen.getByText("Corpus documental")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subir documento" })).toBeDisabled();
  });

  it("sends a question and displays answer sources", async () => {
    sendRagMessage.mockResolvedValue({
      respuesta: "Segun el manual interno, usar la pauta indicada.",
      fuentes: [{ documento: "manual.pdf", pagina: 3, fragmento: "Pauta indicada" }],
      conversacion_id: "conversation-1",
      tokens_usados: 18,
      diagnostico: {
        origen: "deepseek",
        proveedor: "DeepSeek",
        modelo: "deepseek-chat",
        fragmentos_documentales: 1,
        fragmentos_internos: 0,
      },
      timestamp: "2026-06-17T23:00:00Z",
    });
    render(<AsistenteEnci />);

    fireEvent.change(screen.getByLabelText("Pregunta"), { target: { value: "Cual es la dosificacion?" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => expect(sendRagMessage).toHaveBeenCalledWith("firebase-token", {
      pregunta: "Cual es la dosificacion?",
      conversacion_id: null,
    }));
    expect(await screen.findByText("Segun el manual interno, usar la pauta indicada.")).toBeInTheDocument();
    expect(screen.getByText("Fuentes (1)")).toBeInTheDocument();
    expect(screen.queryByLabelText("Respuesta generada por DeepSeek")).not.toBeInTheDocument();
  });

  it("uses suggestions to populate the question field", () => {
    render(<AsistenteEnci />);

    fireEvent.click(screen.getByRole("button", { name: "Que documentos respaldan esta recomendacion?" }));

    expect(screen.getByLabelText("Pregunta")).toHaveValue("Que documentos respaldan esta recomendacion?");
  });

  it("sends with Enter and keeps Shift+Enter for multiline text", async () => {
    sendRagMessage.mockResolvedValue({
      respuesta: "Respuesta breve",
      fuentes: [],
      conversacion_id: "conversation-enter",
      tokens_usados: 3,
      diagnostico: { origen: "deepseek", fragmentos_documentales: 1, fragmentos_internos: 0 },
      timestamp: "2026-06-22T18:00:00Z",
    });
    render(<AsistenteEnci />);
    const input = screen.getByLabelText("Pregunta");

    fireEvent.change(input, { target: { value: "Primera linea" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(sendRagMessage).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(sendRagMessage).toHaveBeenCalledWith("firebase-token", {
      pregunta: "Primera linea",
      conversacion_id: null,
    }));
  });

  it("loads and opens conversations saved for the current account", async () => {
    getRagConversations.mockResolvedValue([{
      id: "conversation-saved",
      titulo: "Seguimiento sanitario del cliente",
      mensajes: [
        { tipo: "pregunta", texto: "Consulta guardada", timestamp: "2026-06-20T12:00:00Z" },
        { tipo: "respuesta", texto: "Respuesta guardada", timestamp: "2026-06-20T12:00:01Z", fuentes: [] },
      ],
      updatedAt: "2026-06-20T12:00:01Z",
    }]);

    render(<AsistenteEnci />);
    fireEvent.click(await screen.findByText("Seguimiento sanitario del cliente"));

    expect(screen.getByText("Respuesta guardada")).toBeInTheDocument();
    expect(screen.getByText("Consulta guardada", { selector: ".rag-message p" })).toBeInTheDocument();
  });
});
