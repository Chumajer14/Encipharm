import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ForecastChart } from "./Dashboard";

const baseProps = {
  canFilterSeller: true,
  exportMessage: "",
  exportOpen: false,
  exporting: false,
  forecast: [{ etiqueta: "Jun", periodo: "2026-06", proyeccionPonderada: 120, ventaReal: 100 }],
  mode: "mensual",
  onDownload: vi.fn(),
  onExportToggle: vi.fn(),
  onModeChange: vi.fn(),
  onSellerChange: vi.fn(),
  selectedSeller: "",
  sellerOptions: [{ uid: "seller-1", name: "Juan Pérez" }],
  targetValue: 150,
};

describe("ForecastChart", () => {
  it("presenta filtros, modos y control de exportación", () => {
    render(<ForecastChart {...baseProps} />);

    expect(screen.getByLabelText("Filtrar forecast por vendedor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mensual" })).toHaveClass("active");
    expect(screen.getByRole("button", { name: "Exportar" })).toBeEnabled();
  });

  it("muestra las alternativas analítica y simple", () => {
    const onDownload = vi.fn();
    render(<ForecastChart {...baseProps} exportOpen onDownload={onDownload} />);

    fireEvent.click(screen.getByRole("menuitem", { name: /CSV analítico/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: /CSV simple/ }));

    expect(onDownload).toHaveBeenNthCalledWith(1, "analitico");
    expect(onDownload).toHaveBeenNthCalledWith(2, "simple");
  });

  it("deshabilita la descarga cuando la vista no contiene datos", () => {
    render(<ForecastChart
      {...baseProps}
      forecast={[{ etiqueta: "Jun", periodo: "2026-06", proyeccionPonderada: 0, ventaReal: 0 }]}
    />);

    expect(screen.getByRole("button", { name: "Exportar" })).toBeDisabled();
    expect(screen.getByText("No hay datos en la vista actual para exportar.")).toBeInTheDocument();
  });
});
