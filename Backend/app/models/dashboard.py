from pydantic import BaseModel, Field


class CountByKey(BaseModel):
    clave: str
    total: int


class ForecastPoint(BaseModel):
    etiqueta: str
    proyeccionPonderada: float = 0
    ventaReal: float = 0


class FunnelStage(BaseModel):
    clave: str
    nombre: str
    total: int = 0
    valorEstimado: float = 0
    valorPonderado: float = 0
    conversionPct: float = 0
    fugaPct: float = 0


class DashboardResponse(BaseModel):
    totalClientes: int
    clientesActivos: int
    totalOportunidades: int = 0
    valorPipeline: float = 0
    totalPropuestas: int = 0
    valorPropuestasAceptadas: float = 0
    proyeccionPonderada: float = 0
    ticketPromedio: float = 0
    tasaConversionGlobal: float = 0
    vendedoresActivosHoy: int = 0
    totalVendedores: int = 0
    clientesPorEstado: list[CountByKey]
    clientesPorRubro: list[CountByKey]
    clientesPorRegion: list[CountByKey]
    oportunidadesPorEtapa: list[CountByKey] = Field(default_factory=list)
    propuestasPorEstado: list[CountByKey] = Field(default_factory=list)
    forecastMensual: list[ForecastPoint] = Field(default_factory=list)
    embudoVentas: list[FunnelStage] = Field(default_factory=list)
