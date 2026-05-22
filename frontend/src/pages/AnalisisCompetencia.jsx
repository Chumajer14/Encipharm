const COMPANIES = [
  { id: "enci", name: "Enci", icon: "E", price: "$45", diff: "Base", className: "enci mejor" },
  { id: "vetpharma", name: "VetPharma", icon: "V", price: "$52", diff: "+$7 (+15.6%)", className: "vetpharma peor" },
  { id: "agrisur", name: "AgriSur", icon: "A", price: "$48", diff: "+$3 (+6.7%)", className: "agrisur similar" },
  { id: "biovet", name: "BioVet", icon: "B", price: "$50", diff: "+$5 (+11.1%)", className: "biovet similar" },
];

const COMPOSITIONS = [
  {
    id: "enci",
    name: "Enci",
    icon: "E",
    className: "enci",
    ingredients: [
      ["Oxitetraciclina Base", "200 mg/ml"],
      ["Propilenglicol", "30%"],
      ["Alcohol Bencilico", "2%"],
      ["Excipientes c.s.p.", "100 ml"],
    ],
  },
  {
    id: "vetpharma",
    name: "VetPharma",
    icon: "V",
    className: "vetpharma",
    ingredients: [
      ["Oxitetraciclina Base", "200 mg/ml"],
      ["Propilenglicol", "28%"],
      ["Polivinilpirrolidona", "3%"],
      ["Excipientes c.s.p.", "100 ml"],
    ],
  },
  {
    id: "agrisur",
    name: "AgriSur",
    icon: "A",
    className: "agrisur",
    ingredients: [
      ["Oxitetraciclina Base", "200 mg/ml"],
      ["Propilenglicol", "32%"],
      ["Lidocaina HCl", "1.5%"],
      ["Excipientes c.s.p.", "100 ml"],
    ],
  },
  {
    id: "biovet",
    name: "BioVet",
    icon: "B",
    className: "biovet",
    ingredients: [
      ["Oxitetraciclina Base", "200 mg/ml"],
      ["Propilenglicol", "29%"],
      ["Alcohol Bencilico", "2.5%"],
      ["Excipientes c.s.p.", "100 ml"],
    ],
  },
];

function CompanyBadge({ company }) {
  return (
    <span className={`comp-empresa ${company.className.split(" ")[0]}`}>
      <i className="comp-empresa-icon">{company.icon}</i>
      {company.name}
    </span>
  );
}

function AnalisisCompetencia() {
  return (
    <main className="page competencia-content static-competition-page">
      <div className="static-disabled-overlay competition-disabled-overlay" aria-hidden="true">
        <div className="not-operational-mark">X</div>
        <h2>Datos no determinados.</h2>
      </div>

      <section className="competencia-section">
        <article className="card command-card">
          <div className="card-header">
            <div>
              <h3>Comparacion de Precios</h3>
              <p className="competition-card-sub">Analisis de precios de Enci versus competidores principales</p>
            </div>
          </div>
          <div className="card-body competition-card-body">
            <div className="comp-selectors">
              <label className="comp-selector-group">
                <span className="comp-selector-label">Familia de Producto</span>
                <select className="comp-selector" disabled value="antibioticos">
                  <option value="antibioticos">Antibioticos</option>
                  <option value="antiparasitarios">Antiparasitarios</option>
                  <option value="vitaminas">Vitaminas & Suplementos</option>
                  <option value="vacunas">Vacunas</option>
                </select>
              </label>
              <label className="comp-selector-group">
                <span className="comp-selector-label">Producto</span>
                <select className="comp-selector" disabled value="oxitetraciclina">
                  <option value="oxitetraciclina">Oxitetraciclina LA</option>
                  <option value="enrofloxacina">Enrofloxacina 10%</option>
                  <option value="penicilina">Penicilina G Procainica</option>
                </select>
              </label>
              <label className="comp-selector-group">
                <span className="comp-selector-label">Unidad de Medida</span>
                <select className="comp-selector" disabled value="ml">
                  <option value="ml">Mililitro (ml)</option>
                  <option value="l">Litro (L)</option>
                  <option value="g">Gramo (g)</option>
                  <option value="kg">Kilogramo (kg)</option>
                  <option value="dosis">Dosis</option>
                </select>
              </label>
            </div>

            <div className="comp-table-wrap">
              <table className="comp-table">
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>Producto</th>
                    <th className="text-center">Precio / Unidad</th>
                    <th className="text-center">Diferencia vs Enci</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPANIES.map((company) => (
                    <tr key={company.id}>
                      <td><CompanyBadge company={company} /></td>
                      <td>Oxitetraciclina LA</td>
                      <td className="text-center"><span className={`comp-price ${company.className.includes("mejor") ? "mejor" : company.className.includes("peor") ? "peor" : "similar"}`}>{company.price}</span></td>
                      <td className="text-center competition-diff">{company.diff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </section>

      <section className="competencia-section">
        <article className="card command-card">
          <div className="card-header">
            <div>
              <h3>Comparacion de Composicion</h3>
              <p className="competition-card-sub">Analisis de ingredientes activos y excipientes</p>
            </div>
          </div>
          <div className="card-body competition-card-body">
            <div className="comp-comparing-bar">
              <span>Comparando:</span>
              <strong>Antibioticos</strong>
              <em>→</em>
              <strong>Oxitetraciclina LA</strong>
            </div>

            <div className="comp-composition-grid">
              {COMPOSITIONS.map((company) => (
                <article className="comp-composition-card" key={company.id}>
                  <div className="comp-composition-header">
                    <CompanyBadge company={company} />
                    <span>{company.ingredients.length} ingredientes</span>
                  </div>
                  <div className="comp-composition-list">
                    {company.ingredients.map(([name, value]) => (
                      <div className="comp-ingredient" key={`${company.id}-${name}`}>
                        <span className="comp-ingredient-name">{name}</span>
                        <span className="comp-ingredient-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

export default AnalisisCompetencia;
