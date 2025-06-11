import React, { useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

// URL fija a tu backend en Render:
const API_URL = "https://factura-backend-7ehi.onrender.com";

export default function App() {
  const [file, setFile] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState("coste_total");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setError("");
    setRanking([]);
    setResultado(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1) Analizar factura
      const response = await axios.post(
        `${API_URL}/analizar-factura`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setResultado(response.data);

      // 2) Comparar tarifas
      const comparacion = await axios.post(
        `${API_URL}/comparar-tarifas/`,
        response.data
      );
      setRanking(comparacion.data);
    } catch (err) {
      console.error("🔴 Error procesando la factura:", err);
      setError("Ha habido un error al procesar la factura");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y ordenar
  const mostrar = ranking
    .filter((t) =>
      t.tarifa.toLowerCase().includes(filter.trim().toLowerCase())
    )
    .sort((a, b) => a[sortKey] - b[sortKey]);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        Comparador de Tarifas Eléctricas
      </h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-md"
      >
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full mb-4"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Procesando..." : "Analizar Factura"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-center text-red-600 font-semibold">{error}</p>
      )}

      {ranking.length > 0 && (
        <div className="max-w-4xl mx-auto mt-8 space-y-6">
          {/* Gráfica de barras */}
          <div className="bg-white p-4 rounded shadow-md h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mostrar}>
                <XAxis dataKey="tarifa" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toFixed(2)} €`} />
                <Bar dataKey="coste_total" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Controles de búsqueda y orden */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <input
              type="text"
              placeholder="Buscar tarifa…"
              className="border border-gray-300 rounded px-3 py-2 w-full sm:w-1/2"
              onChange={(e) => setFilter(e.target.value)}
            />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full sm:w-1/3"
            >
              <option value="coste_total">Ordenar por Total</option>
              <option value="coste_energia">Ordenar por Energía</option>
              <option value="coste_potencia">Ordenar por Potencia</option>
            </select>
          </div>

          {/* Tarjetas de resultado */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {mostrar.map((t, i) => (
              <div
                key={i}
                className={`
                  p-6 rounded-2xl shadow-lg border
                  ${i === 0 ? "border-green-500" : "border-gray-200"}
                  hover:shadow-xl transition
                `}
              >
                <h3 className="text-xl font-bold mb-2">
                  #{i + 1} {t.tarifa}
                </h3>
                <p className="text-gray-600 mb-4">
                  Total:{" "}
                  <span className="font-semibold">
                    {t.coste_total.toFixed(2)} €
                  </span>
                </p>
                <div className="space-y-1 text-gray-800">
                  <div className="flex justify-between">
                    <span>Potencia:</span>
                    <span>{t.coste_potencia.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Energía:</span>
                    <span>{t.coste_energia.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
);
}
