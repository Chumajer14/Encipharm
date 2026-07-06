import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.models.cliente import ClienteCreate
from app.models.comercial import (
    InteractionCreate,
    OpportunityCreate,
    OpportunityResponse,
    OpportunityUpdate,
    ProposalCreate,
    ProposalResponse,
    ProposalUpdate,
)
from app.services.clientes import create_cliente
from app.services.comercial import (
    create_interaction,
    create_opportunity,
    create_proposal,
    get_opportunity_detail,
    list_interactions,
    list_opportunities,
    list_proposals,
    update_opportunity,
    update_proposal,
)
from app.services.dashboard import build_dashboard


class FakeDocumentSnapshot:
    def __init__(self, document_id, data):
        self.id = document_id
        self._data = data
        self.exists = data is not None

    def to_dict(self):
        return self._data


class FakeDocumentReference:
    def __init__(self, collection, document_id):
        self.collection = collection
        self.document_id = document_id

    def set(self, data):
        self.collection.rows[self.document_id] = data

    def update(self, changes):
        self.collection.rows[self.document_id].update(changes)

    def get(self):
        return FakeDocumentSnapshot(self.document_id, self.collection.rows.get(self.document_id))


class FakeCollection:
    def __init__(self):
        self.rows = {}

    def document(self, document_id):
        return FakeDocumentReference(self, document_id)

    def stream(self):
        return [
            FakeDocumentSnapshot(document_id, data)
            for document_id, data in self.rows.items()
        ]


class FakeDb:
    def __init__(self):
        self.collections = {
            "clientes": FakeCollection(),
            "interacciones": FakeCollection(),
            "oportunidades": FakeCollection(),
            "propuestas": FakeCollection(),
            "audit_logs": FakeCollection(),
        }

    def collection(self, name):
        return self.collections[name]


def _cliente(db, vendedor_uid="seller-1"):
    suffix = len(db.collection("clientes").rows) + 1
    return create_cliente(
        db,
        ClienteCreate(
            nombre="Maria Soto",
            empresa="Granja Los Pinos",
            email=f"maria{suffix}@lospinos.cl",
            rubro="Cerdos",
            region="Maule",
            vendedorUid=vendedor_uid,
        ),
    )


def test_create_interaction_for_visible_cliente():
    db = FakeDb()
    cliente = _cliente(db)
    user = {"uid": "seller-1", "rol": "vendedor"}

    interaction = create_interaction(
        db,
        InteractionCreate(
            clienteId=cliente["id"],
            tipo="visita",
            fecha="2026-05-05T10:00:00Z",
            resumen="Visita comercial inicial",
        ),
        user,
    )

    assert interaction["clienteId"] == cliente["id"]
    assert list_interactions(db, user)[0]["id"] == interaction["id"]
    assert len(db.collection("audit_logs").rows) == 1


def test_seller_cannot_create_interaction_for_other_seller_cliente():
    db = FakeDb()
    cliente = _cliente(db, vendedor_uid="seller-2")
    user = {"uid": "seller-1", "rol": "vendedor"}

    with pytest.raises(HTTPException) as exc_info:
        create_interaction(
            db,
            InteractionCreate(
                clienteId=cliente["id"],
                tipo="llamada",
                fecha="2026-05-05T10:00:00Z",
                resumen="Intento no autorizado",
            ),
            user,
        )

    assert exc_info.value.status_code == 403


def test_opportunity_can_move_stage():
    db = FakeDb()
    cliente = _cliente(db)
    user = {"uid": "seller-1", "rol": "vendedor"}
    opportunity = create_opportunity(
        db,
        OpportunityCreate(
            clienteId=cliente["id"],
            titulo="Venta suplemento avicola",
            valorEstimado=500000,
            probabilidad=20,
        ),
        user,
    )

    updated = update_opportunity(db, opportunity["id"], {"etapa": "cotizacion", "probabilidad": 50}, user)

    assert updated["etapa"] == "cotizacion"
    assert updated["probabilidad"] == 50
    assert list_opportunities(db, user)[0]["etapa"] == "cotizacion"


def test_opportunities_can_be_filtered_by_stage():
    db = FakeDb()
    cliente = _cliente(db)
    user = {"uid": "seller-1", "rol": "vendedor"}
    create_opportunity(
        db,
        OpportunityCreate(clienteId=cliente["id"], titulo="Pipeline nuevo", etapa="nuevo"),
        user,
    )
    cotizacion = create_opportunity(
        db,
        OpportunityCreate(clienteId=cliente["id"], titulo="Pipeline cotizacion", etapa="cotizacion"),
        user,
    )

    filtered = list_opportunities(db, user, etapa="cotizacion")

    assert [item["id"] for item in filtered] == [cotizacion["id"]]


def test_opportunity_stage_accepts_client_aliases():
    db = FakeDb()
    cliente = _cliente(db)
    user = {"uid": "seller-1", "rol": "vendedor"}

    opportunity = create_opportunity(
        db,
        OpportunityCreate(clienteId=cliente["id"], titulo="Pipeline propuesta", etapa="Propuesta enviada"),
        user,
    )

    assert opportunity["etapa"] == "cotizacion"
    assert list_opportunities(db, user, etapa="Propuesta enviada")[0]["id"] == opportunity["id"]


def test_opportunity_update_accepts_client_aliases():
    db = FakeDb()
    cliente = _cliente(db)
    user = {"uid": "seller-1", "rol": "vendedor"}
    opportunity = create_opportunity(
        db,
        OpportunityCreate(clienteId=cliente["id"], titulo="Pipeline"),
        user,
    )
    payload = OpportunityUpdate(etapa="Cerrado ganado")

    updated = update_opportunity(db, opportunity["id"], payload.model_dump(exclude_unset=True), user)

    assert updated["etapa"] == "ganado"


def test_proposal_calculates_discount_and_total():
    db = FakeDb()
    cliente = _cliente(db)
    user = {"uid": "seller-1", "rol": "vendedor"}
    opportunity = create_opportunity(
        db,
        OpportunityCreate(clienteId=cliente["id"], titulo="Venta anual"),
        user,
    )

    proposal = create_proposal(
        db,
        ProposalCreate(
            clienteId=cliente["id"],
            oportunidadId=opportunity["id"],
            titulo="Propuesta anual",
            montoNeto=100000,
            descuentoPct=10,
        ),
        user,
    )

    assert proposal["montoDescuento"] == 10000
    assert proposal["montoTotal"] == 90000
    assert list_proposals(db, user)[0]["id"] == proposal["id"]


def test_proposal_update_recalculates_total():
    db = FakeDb()
    cliente = _cliente(db)
    user = {"uid": "seller-1", "rol": "vendedor"}
    opportunity = create_opportunity(
        db,
        OpportunityCreate(clienteId=cliente["id"], titulo="Venta anual"),
        user,
    )
    proposal = create_proposal(
        db,
        ProposalCreate(
            clienteId=cliente["id"],
            oportunidadId=opportunity["id"],
            titulo="Propuesta",
            montoNeto=100000,
        ),
        user,
    )

    updated = update_proposal(db, proposal["id"], {"descuentoPct": 25}, user)

    assert updated["montoDescuento"] == 25000
    assert updated["montoTotal"] == 75000


def test_proposal_status_accepts_client_aliases():
    db = FakeDb()
    cliente = _cliente(db)
    user = {"uid": "seller-1", "rol": "vendedor"}
    opportunity = create_opportunity(
        db,
        OpportunityCreate(clienteId=cliente["id"], titulo="Venta anual"),
        user,
    )

    proposal = create_proposal(
        db,
        ProposalCreate(
            clienteId=cliente["id"],
            oportunidadId=opportunity["id"],
            titulo="Propuesta ganada",
            montoNeto=100000,
            estado="Ganada",
        ),
        user,
    )

    assert proposal["estado"] == "aceptada"
    assert list_proposals(db, user, estado="Ganada")[0]["id"] == proposal["id"]


def test_supervisor_cannot_create_proposal():
    db = FakeDb()
    cliente = _cliente(db)
    seller = {"uid": "seller-1", "rol": "vendedor"}
    supervisor = {"uid": "supervisor-1", "rol": "supervisor"}
    opportunity = create_opportunity(
        db,
        OpportunityCreate(clienteId=cliente["id"], titulo="Venta anual"),
        seller,
    )

    with pytest.raises(HTTPException) as exc_info:
        create_proposal(
            db,
            ProposalCreate(
                clienteId=cliente["id"],
                oportunidadId=opportunity["id"],
                titulo="Propuesta supervisor",
                montoNeto=100000,
            ),
            supervisor,
        )

    assert exc_info.value.status_code == 403


def test_supervisor_can_only_approve_proposal():
    db = FakeDb()
    cliente = _cliente(db)
    seller = {"uid": "seller-1", "rol": "vendedor"}
    supervisor = {"uid": "supervisor-1", "rol": "supervisor"}
    opportunity = create_opportunity(
        db,
        OpportunityCreate(clienteId=cliente["id"], titulo="Venta anual"),
        seller,
    )
    proposal = create_proposal(
        db,
        ProposalCreate(
            clienteId=cliente["id"],
            oportunidadId=opportunity["id"],
            titulo="Propuesta",
            montoNeto=100000,
        ),
        seller,
    )

    approved = update_proposal(
        db,
        proposal["id"],
        ProposalUpdate(estado="Ganada").model_dump(exclude_unset=True),
        supervisor,
    )

    assert approved["estado"] == "aceptada"

    with pytest.raises(HTTPException) as exc_info:
        update_proposal(db, proposal["id"], {"titulo": "Cambio supervisor"}, supervisor)

    assert exc_info.value.status_code == 403


def test_proposals_can_be_filtered_by_status_and_opportunity():
    db = FakeDb()
    cliente = _cliente(db)
    user = {"uid": "seller-1", "rol": "vendedor"}
    opportunity = create_opportunity(
        db,
        OpportunityCreate(clienteId=cliente["id"], titulo="Venta anual"),
        user,
    )
    accepted = create_proposal(
        db,
        ProposalCreate(
            clienteId=cliente["id"],
            oportunidadId=opportunity["id"],
            titulo="Propuesta aceptada",
            montoNeto=100000,
            estado="aceptada",
        ),
        user,
    )
    create_proposal(
        db,
        ProposalCreate(
            clienteId=cliente["id"],
            oportunidadId=opportunity["id"],
            titulo="Propuesta borrador",
            montoNeto=100000,
        ),
        user,
    )

    filtered = list_proposals(db, user, estado="aceptada", oportunidad_id=opportunity["id"])

    assert [item["id"] for item in filtered] == [accepted["id"]]


def test_opportunity_detail_includes_cliente_interactions_and_linked_proposals():
    db = FakeDb()
    cliente = _cliente(db)
    user = {"uid": "seller-1", "rol": "vendedor"}
    opportunity = create_opportunity(
        db,
        OpportunityCreate(clienteId=cliente["id"], titulo="Venta anual"),
        user,
    )
    interaction = create_interaction(
        db,
        InteractionCreate(
            clienteId=cliente["id"],
            tipo="reunion",
            fecha="2026-05-05T10:00:00Z",
            resumen="Revision de propuesta",
        ),
        user,
    )
    proposal = create_proposal(
        db,
        ProposalCreate(
            clienteId=cliente["id"],
            oportunidadId=opportunity["id"],
            titulo="Propuesta anual",
            montoNeto=100000,
        ),
        user,
    )

    detail = get_opportunity_detail(db, opportunity["id"], user)

    assert detail["oportunidad"]["id"] == opportunity["id"]
    assert [item["id"] for item in detail["interacciones"]] == [interaction["id"]]
    assert [item["id"] for item in detail["propuestas"]] == [proposal["id"]]


def test_proposal_rejects_opportunity_from_other_cliente():
    db = FakeDb()
    cliente_a = _cliente(db)
    cliente_b = _cliente(db)
    user = {"uid": "seller-1", "rol": "vendedor"}
    opportunity = create_opportunity(
        db,
        OpportunityCreate(clienteId=cliente_a["id"], titulo="Oportunidad A"),
        user,
    )

    with pytest.raises(HTTPException) as exc_info:
        create_proposal(
            db,
            ProposalCreate(
                clienteId=cliente_b["id"],
                oportunidadId=opportunity["id"],
                titulo="Propuesta cruzada",
                montoNeto=100000,
            ),
            user,
        )

    assert exc_info.value.status_code == 400


def test_seller_cannot_link_proposal_to_other_seller_opportunity():
    db = FakeDb()
    cliente = _cliente(db, vendedor_uid="seller-1")
    other_user = {"uid": "seller-2", "rol": "vendedor"}
    db.collection("oportunidades").document("op-other").set({
        "id": "op-other",
        "clienteId": cliente["id"],
        "titulo": "Oportunidad ajena",
        "etapa": "cotizacion",
        "valorEstimado": 100000,
        "probabilidad": 50,
        "vendedorUid": "seller-2",
    })

    with pytest.raises(HTTPException) as exc_info:
        create_proposal(
            db,
            ProposalCreate(
                clienteId=cliente["id"],
                oportunidadId="op-other",
                titulo="Propuesta cruzada",
                montoNeto=100000,
            ),
            {"uid": "seller-1", "rol": "vendedor"},
        )

    assert other_user["uid"] == "seller-2"
    assert exc_info.value.status_code == 403


def test_admin_can_list_other_sellers_commercial_records():
    db = FakeDb()
    seller_one = {"uid": "seller-1", "rol": "vendedor"}
    seller_two = {"uid": "seller-2", "rol": "vendedor"}
    admin = {"uid": "admin-1", "rol": "admin"}
    cliente_one = _cliente(db, vendedor_uid="seller-1")
    cliente_two = _cliente(db, vendedor_uid="seller-2")
    opportunity_one = create_opportunity(
        db,
        OpportunityCreate(clienteId=cliente_one["id"], titulo="Venta seller 1"),
        seller_one,
    )
    opportunity_two = create_opportunity(
        db,
        OpportunityCreate(clienteId=cliente_two["id"], titulo="Venta seller 2"),
        seller_two,
    )
    create_proposal(
        db,
        ProposalCreate(clienteId=cliente_one["id"], oportunidadId=opportunity_one["id"], titulo="Propuesta 1", montoNeto=100000),
        seller_one,
    )
    create_proposal(
        db,
        ProposalCreate(clienteId=cliente_two["id"], oportunidadId=opportunity_two["id"], titulo="Propuesta 2", montoNeto=100000),
        seller_two,
    )

    assert {item["vendedorUid"] for item in list_opportunities(db, admin)} == {"seller-1", "seller-2"}
    assert {item["vendedorUid"] for item in list_proposals(db, admin)} == {"seller-1", "seller-2"}


def test_commercial_models_reject_formula_injection():
    with pytest.raises(ValidationError):
        OpportunityCreate(
            clienteId="cliente-1",
            titulo="=HYPERLINK(\"http://attacker\")",
        )


def test_commercial_models_reject_mass_assignment_fields():
    with pytest.raises(ValidationError):
        OpportunityCreate.model_validate({
            "clienteId": "cliente-1",
            "titulo": "Oportunidad",
            "vendedorUid": "victim-seller",
            "montoTotal": 1,
        })

    with pytest.raises(ValidationError):
        ProposalUpdate.model_validate({
            "estado": "aceptada",
            "vendedorUid": "victim-seller",
            "montoTotal": 1,
            "createdAt": "2026-01-01T00:00:00Z",
        })


def test_commercial_response_models_ignore_seed_metadata():
    opportunity = OpportunityResponse.model_validate({
        "id": "op-1",
        "clienteId": "cliente-1",
        "titulo": "Oportunidad demo",
        "etapa": "nuevo",
        "valorEstimado": 100000,
        "probabilidad": 20,
        "vendedorUid": "seller-1",
        "seedTag": "demo-20260518",
    })
    proposal = ProposalResponse.model_validate({
        "id": "prop-1",
        "clienteId": "cliente-1",
        "oportunidadId": "op-1",
        "titulo": "Propuesta demo",
        "montoNeto": 100000,
        "descuentoPct": 10,
        "estado": "enviada",
        "vendedorUid": "seller-1",
        "montoDescuento": 10000,
        "montoTotal": 90000,
        "seedTag": "demo-20260518",
    })

    assert "seedTag" not in opportunity.model_dump()
    assert "seedTag" not in proposal.model_dump()


def test_proposal_requires_opportunity():
    with pytest.raises(ValidationError):
        ProposalCreate(
            clienteId="cliente-1",
            titulo="Propuesta sin oportunidad",
            montoNeto=100000,
        )


def test_dashboard_builds_real_forecast_and_funnel_metrics():
    db = FakeDb()
    cliente = _cliente(db)
    user = {"uid": "seller-1", "rol": "vendedor"}
    opportunity = create_opportunity(
        db,
        OpportunityCreate(
            clienteId=cliente["id"],
            titulo="Venta mensual",
            etapa="cotizacion",
            valorEstimado=1000000,
            probabilidad=50,
        ),
        user,
    )
    create_proposal(
        db,
        ProposalCreate(
            clienteId=cliente["id"],
            oportunidadId=opportunity["id"],
            titulo="Propuesta aceptada",
            montoNeto=500000,
            estado="aceptada",
        ),
        user,
    )

    dashboard = build_dashboard(db, vendedor_uid=user["uid"])

    assert dashboard["valorPipeline"] == 1000000
    assert dashboard["proyeccionPonderada"] == 500000
    assert dashboard["valorPropuestasAceptadas"] == 500000
    assert dashboard["ticketPromedio"] == 500000
    assert dashboard["tasaConversionGlobal"] == 100
    assert dashboard["forecastMensual"]
    assert sum(point["proyeccionPonderada"] for point in dashboard["forecastMensual"]) == 500000
    assert next(stage for stage in dashboard["embudoVentas"] if stage["clave"] == "cotizacion")["total"] == 1
