from __future__ import annotations

from pathlib import Path

from build_client_docs_pdf import ROOT, build_pdf


DOCS_DIR = ROOT / "docs" / "entrega-cliente"


def main() -> None:
    targets = sorted(DOCS_DIR.glob("DOC-*.md"))
    targets.extend(sorted(DOCS_DIR.glob("ANEXO-*.md")))
    targets.append(DOCS_DIR / "acta-recepcion-documental.md")
    targets.append(DOCS_DIR / "matriz-cumplimiento-documental.md")
    targets.append(DOCS_DIR / "documentacion-cliente-enci.md")

    for src in targets:
        out = src.with_suffix(".pdf")
        build_pdf(src, out)
        print(out)


if __name__ == "__main__":
    main()
