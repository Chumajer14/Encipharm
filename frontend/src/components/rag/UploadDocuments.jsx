import { useState } from "react";
import { getRagDocuments, reindexRagDocuments, uploadRagDocument } from "../../services/api";

function UploadDocuments({ token }) {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refreshDocuments() {
    setLoading(true);
    setError("");
    try {
      const docs = await getRagDocuments(token);
      setDocuments(docs);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const result = await uploadRagDocument(token, file);
      setStatus(`${result.documento}: ${result.chunks_indexados} fragmentos indexados`);
      setFile(null);
      event.currentTarget.reset();
      await refreshDocuments();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReindex() {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const result = await reindexRagDocuments(token);
      setStatus(`${result.chunks_indexados} fragmentos reindexados`);
      await refreshDocuments();
    } catch (reindexError) {
      setError(reindexError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rag-admin-panel">
      <div className="rag-panel-header">
        <div>
          <h2>Corpus documental</h2>
          <p>Gestion de archivos internos disponibles para consulta.</p>
        </div>
        <div className="rag-admin-actions">
          <button className="btn-secondary compact" disabled={loading} onClick={refreshDocuments} type="button">
            Actualizar
          </button>
          <button className="btn-secondary compact" disabled={loading} onClick={handleReindex} type="button">
            Reindexar
          </button>
        </div>
      </div>

      <form className="rag-upload-form" onSubmit={handleUpload}>
        <input
          accept=".pdf,.docx,.txt"
          disabled={loading}
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          type="file"
        />
        <button className="btn-primary" disabled={!file || loading} type="submit">
          Subir documento
        </button>
      </form>

      {status && <p className="rag-status success">{status}</p>}
      {error && <p className="rag-status error">{error}</p>}

      <div className="rag-document-list">
        {documents.map((document) => (
          <article className="rag-document-item" key={document.id}>
            <strong>{document.nombre}</strong>
            <span>{document.chunks_count} fragmentos</span>
          </article>
        ))}
        {!documents.length && <p className="muted-text">Sin documentos indexados.</p>}
      </div>
    </section>
  );
}

export default UploadDocuments;
