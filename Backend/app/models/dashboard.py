from pydantic import BaseModel


class CountByKey(BaseModel):
    clave: str
    total: int


class DashboardResponse(BaseModel):
    totalClientes: int
    clientesActivos: int
    clientesPorEstado: list[CountByKey]
    clientesPorRubro: list[CountByKey]
    clientesPorRegion: list[CountByKey]
