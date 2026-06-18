import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AsistenteEncipharm from "./AsistenteEncipharm";
import { useAuth } from "../auth/authContext";
import { sendRagMessage } from "../services/api";

vi.mock("../auth/authContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../services/api", () => ({
  getRagDocuments: vi.fn().mockResolvedValue([]),
  reindexRagDocuments: vi.fn().mockResolvedValue({ chunks_indexados: 0 }),
  sendRagMessage: vi.fn(),
  uploadRagDocument: vi.fn().mockResolvedValue({ documento: "manual.pdf", chunks_indexados: 1 }),
}));

describe("AsistenteEncipharm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      backendUser: { rol: "vendedor" },
      idToken: "firebase-token",
    });
  });

  it("renders the chat without admin document controls for sellers", () => {
    render(<AsistenteEncipharm />);

    expect(screen.getByRole("heading", { name: "Consulta tecnica y comercial" })).toBeInTheDocument();
    expect(screen.getByText("Sin mensajes.")).toBeInTheDocument();
    expect(screen.queryByText("Corpus documental")).not.toBeInTheDocument();
  });

  it("renders upload controls only for admins", () => {
    useAuth.mockReturnValue({
      backendUser: { rol: "admin" },
      idToken: "firebase-token",
    });

    render(<AsistenteEncipharm />);

    expect(screen.getByText("Corpus documental")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subir documento" })).toBeDisabled();
  });

  it("sends a question and displays answer sources", async () => {
    sendRagMessage.mockResolvedValue({
      respuesta: "Segun el manual interno, usar la pauta indicada.",
      fuentes: [{ documento: "manual.pdf", pagina: 3, fragmento: "Pauta indicada" }],
      conversacion_id: "conversation-1",
      tokens_usados: 18,
      timestamp: "2026-06-17T23:00:00Z",
    });
    render(<AsistenteEncipharm />);

    fireEvent.change(screen.getByLabelText("Pregunta"), { target: { value: "Cual es la dosificacion?" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => expect(sendRagMessage).toHaveBeenCalledWith("firebase-token", {
      pregunta: "Cual es la dosificacion?",
      conversacion_id: null,
    }));
    expect(await screen.findByText("Segun el manual interno, usar la pauta indicada.")).toBeInTheDocument();
    expect(screen.getByText("Fuentes (1)")).toBeInTheDocument();
  });

  it("uses suggestions to populate the question field", () => {
    render(<AsistenteEncipharm />);

    fireEvent.click(screen.getByRole("button", { name: "Que documentos respaldan esta recomendacion?" }));

    expect(screen.getByLabelText("Pregunta")).toHaveValue("Que documentos respaldan esta recomendacion?");
  });
});
