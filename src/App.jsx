import React, { useState } from "react";
import axios from "axios";

const API = "https://factura-backend-7ehi.onrender.com";

export default function App() {
  const [file, setFile] = useState(null);
  const [facturaTotal, setFacturaTotal] = useState(null);
  const [impuesto, setImpuesto] = useState(0);
  const [alquiler, setAlquiler] = useState(0);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      // Analizar factura
      const { data } = await axios.post(
        `${API}/analizar-factura`,
        (() => { const f=new FormData(); f.append("file",file); return f; })(),
        { headers: {"Content-Type":"multipart/form-data"} }
      );
      setFacturaTotal(data.factura_total);
      setImpuesto(data.factura_impuesto);
      setAlquiler(data.factura_alquiler);

      // Comparar tarifas
      const cmp = await axios.post(`${API}/comparar-tarifas/`, data);
      // Para cada tarifa sumamos fijos
      const conFijos = cmp.data.map(t => ({
        tarifa: t.tarifa,
        total: (t.coste_variable + data.factura_impuesto + data.factura_alquiler).toFixed(2),
        enlace: t.enlace
      }));
      setRanking(conFijos);
    } catch (err) {
      console.error(err);
      alert("Error procesando factura");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Comparador de Tarifas</h1>
      <form className="mb-4" onSubmit={handleSubmit}>
        <input type="file" accept=".pdf" onChange={e=>setFile(e.target.files[0])} />
        <button disabled={loading} className="ml-2 bg-blue-600 text-white px-3 py-1 rounded">
          {loading ? "Procesando…" : "Analizar"}
        </button>
      </form>

      {facturaTotal != null && (
        <p className="mb-2">
          <strong>Este mes has pagado:</strong> {facturaTotal} €
        </p>
      )}
      <p className="mb-4">
        <strong>Costes fijos (impuestos + alquiler):</strong> {(impuesto+alquiler).toFixed(2)} €
      </p>

      {ranking.length > 0 && (
        <ul className="list-disc list-inside space-y-2">
          {ranking.map((t,i) => (
            <li key={i}>
              {t.tarifa}: {t.total} €{" "}
              {t.enlace && (
                <a href={t.enlace} target="_blank" rel="noopener" className="text-blue-500 underline">
                  [Oferta]
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
