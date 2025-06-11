import React, { useState } from "react";
import axios from "axios";

export default function App() {
  const [file, setFile] = useState(null);
  const [facturaTotal, setFacturaTotal] = useState(null);
  const [impuesto, setImpuesto] = useState(0);
  const [alquiler, setAlquiler] = useState(0);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setError("");
    setFacturaTotal(null);
    setImpuesto(0);
    setAlquiler(0);
    setRanking([]);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1) Analizar factura
      const { data } = await axios.post("/analizar-factura", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFacturaTotal(data.factura_total);
      setImpuesto(data.factura_impuesto);
      setAlquiler(data.factura_alquiler);

      // 2) Comparar tarifas
      const { data: cmp } = await axios.post("/comparar-tarifas", data);
      // Sumamos costes fijos a cada tarifa
      const conFijos = cmp.map((t) => ({
        tarifa: t.tarifa,
        total: (t.coste_variable + data.factura_impuesto + data.factura_alquiler).toFixed(2),
        enlace: t.enlace,
      }));
      setRanking(conFijos);
    } catch (err) {
      console.error(err);
      setError("Error al procesar la factura.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Comparador de Tarifas Eléctricas</h1>

      <form onSubmit={handleSubmit} className="mb-6">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button
          type="submit"
          disabled={loading}
          className="ml-2 bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Procesando…" : "Analizar"}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {facturaTotal != null && (
        <div className="mb-6">
          <p>
            <strong>Este mes has pagado:</strong> {facturaTotal.toFixed(2)} €
          </p>
          <p>
            <strong>Costes fijos (impuestos + alquiler):</strong>{" "}
            {(impuesto + alquiler).toFixed(2)} €
          </p>
        </div>
      )}

      {ranking.length > 0 && (
        <ul className="list-disc list-inside space-y-2">
          {ranking.map((t, i) => (
            <li key={i}>
              {t.tarifa}: {t.total} €{" "}
              {t.enlace && (
                <a
                  href={t.enlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  Ver oferta
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
