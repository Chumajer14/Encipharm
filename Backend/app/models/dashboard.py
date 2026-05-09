from pydantic import BaseModel, Field


class CountByKey(BaseModel):
    clave: str
    total: int


class DashboardResponse(BaseModel):
    totalClientes: int
    clientesActivos: int
    totalOportunidades: int = 0
    valorPipeline: float = 0
    totalPropuestas: int = 0
    valorPropuestasAceptadas: float = 0
    clientesPorEstado: list[CountByKey]
    clientesPorRubro: list[CountByKey]
    clientesPorRegion: list[CountByKey]
    oportunidadesPorEtapa: list[CountByKey] = Field(default_factory=list)
    propuestasPorEstado: list[CountByKey] = Field(default_factory=list)
