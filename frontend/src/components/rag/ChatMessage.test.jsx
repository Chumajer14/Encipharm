import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ChatMessage, { NO_CONTEXT_TEXT } from "./ChatMessage";

const timestamp = new Date("2026-06-22T18:12:00Z");

describe("ChatMessage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not expose diagnostics for a deterministic local response", () => {
    render(<ChatMessage message={{
      tipo: "respuesta",
      texto: NO_CONTEXT_TEXT,
      fuentes: [],
      timestamp,
      diagnostico: { origen: "local", fragmentos_documentales: 0, fragmentos_internos: 0 },
      tokensUsados: 0,
    }} />);

    expect(screen.getByText("Sin contexto")).toBeInTheDocument();
    expect(screen.queryByLabelText("Respuesta generada por el motor local de Enci")).not.toBeInTheDocument();
  });

  it("renders historical responses without origin indicators", () => {
    render(<ChatMessage message={{
      tipo: "respuesta",
      texto: "Respuesta historica",
      fuentes: [],
      timestamp,
    }} />);

    expect(screen.getByText("Respuesta historica")).toBeInTheDocument();
    expect(screen.queryByLabelText("Respuesta generada por otro origen")).not.toBeInTheDocument();
  });

  it("reveals a new response one character at a time", () => {
    vi.useFakeTimers();
    render(<ChatMessage message={{
      tipo: "respuesta",
      texto: "Hola",
      fuentes: [],
      timestamp,
      animate: true,
    }} />);

    expect(screen.queryByText("Hola")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(10));
    expect(screen.getByText("H", { exact: false })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(30));
    expect(screen.getByText("Hola", { exact: false })).toBeInTheDocument();
  });
});
