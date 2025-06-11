import React, { useState } from "react";
import axios from "axios";

const API = "https://factura-backend-7ehi.onrender.com";

export default function App() {
  const [file, setFile] = useState(null);
  const [facturaTotal, setFacturaTotal] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setError("");
    setLoading(true);

    try {
      // 1) Analiza PDF
      const { data } = await axios.post(
        `${API}/analizar-factura`,
        (() => { const f=new FormData(); f.append("file",file); return f; })(),
        { headers: {"Content-Type":"multipart/form-data"} }
      );
      setFacturaTotal(data.factura_total);

      // 2) Compara tarifas
      const cmp = await axios.post(`${API}/comparar-tarifas/`, data);
      setRanking(cmp.data);
    } catch (e) {
      console.error(e);
      setError("Error procesando factura");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Comparador de Tarifas</h1>

      <form onSubmit={handleSubmit} className="mb-6">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-2"
        />
        <button disabled={loading} className="ml-2 bg-blue-600 text-white px-4 py-1 rounded">
          {loading ? "Procesando…" : "Analizar"}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {facturaTotal != null && (
        <p className="mb-4">
          <strong>Este mes has pagado:</strong> {facturaTotal.toFixed(2)} €
        </p>
      )}

      {ranking.length > 0 && (
        <>
          <p className="mb-4 font-semibold">
            Con otras tarifas hubieras pagado:
          </p>
          <ul className="list-disc list-inside space-y-2">
            {ranking.map((t,i) => (
              <li key={i}>
                {t.tarifa}: {t.coste_total.toFixed(2)} €{" "}
                {t.enlace && (
                  <a href={t.enlace} target="_blank" rel="noopener" className="text-blue-500 underline">
                    [Ver oferta]
                  </a>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
);
}
