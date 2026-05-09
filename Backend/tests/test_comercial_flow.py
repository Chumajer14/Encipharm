import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.models.cliente import ClienteCreate
from app.models.comercial import (
    InteractionCreate,
    OpportunityCreate,
    ProposalCreate,
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
        }

    def collection(self, name):
        return self.collections[name]


def _cliente(db, vendedor_uid="seller-1"):
    return create_cliente(
        db,
        ClienteCreate(
            nombre="Maria Soto",
            empresa="Granja Los Pinos",
            email="maria@lospinos.cl",
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
    proposal = create_proposal(
        db,
        ProposalCreate(clienteId=cliente["id"], titulo="Propuesta", montoNeto=100000),
        user,
    )

    updated = update_proposal(db, proposal["id"], {"descuentoPct": 25}, user)

    assert updated["montoDescuento"] == 25000
    assert updated["montoTotal"] == 75000


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
        ProposalCreate(clienteId=cliente["id"], titulo="Propuesta borrador", montoNeto=100000),
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


def test_commercial_models_reject_formula_injection():
    with pytest.raises(ValidationError):
        OpportunityCreate(
            clienteId="cliente-1",
            titulo="=HYPERLINK(\"http://attacker\")",
        )
