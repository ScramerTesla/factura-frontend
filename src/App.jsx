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

const API_URL = "https://factura-backend-7ehi.onrender.com";

export default function App() {
  const [file, setFile] = useState(null);
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
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const resp = await axios.post(
        `${API_URL}/analizar-factura`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const cmp = await axios.post(
        `${API_URL}/comparar-tarifas/`,
        resp.data
      );
      setRanking(cmp.data);
    } catch (err) {
      console.error(err);
      setError("Ha habido un error al procesar la factura");
    } finally {
      setLoading(false);
    }
  };

  const mostrar = ranking
    .filter((t) => t.tarifa.toLowerCase().includes(filter.trim().toLowerCase()))
    .sort((a, b) => a[sortKey] - b[sortKey]);

  return (
    <main className="w-full max-w-4xl mx-auto p-6">
      {/* Título centrado */}
      <h1 className="text-center text-4xl font-bold text-gray-800 mb-8">
        Comparador de Tarifas Eléctricas
      </h1>

      {/* Tarjeta de Formulario */}
      <div className="bg-white bg-opacity-90 backdrop-blur-md p-8 rounded-2xl shadow-lg mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Sube tu factura (PDF):
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition"
          >
            {loading ? "Procesando…" : "Analizar Factura"}
          </button>
        </form>
        {error && (
          <p className="mt-4 text-center text-red-600 font-semibold">{error}</p>
        )}
      </div>

      {mostrar.length > 0 && (
        <>
          {/* Controles */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
            <input
              type="text"
              placeholder="🔍 Buscar tarifa…"
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              onChange={(e) => setFilter(e.target.value)}
            />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="coste_total">Ordenar por Total</option>
              <option value="coste_energia">Ordenar por Energía</option>
              <option value="coste_potencia">Ordenar por Potencia</option>
            </select>
          </div>

          {/* Gráfica */}
          <div className="bg-white bg-opacity-90 backdrop-blur-md p-4 rounded-xl shadow-lg mb-8 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mostrar}>
                <XAxis dataKey="tarifa" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(v) => `${v.toFixed(2)} €`} />
                <Bar dataKey="coste_total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tarjetas de resultados */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {mostrar.map((t, i) => (
              <div
                key={i}
                className={`
                  bg-white bg-opacity-90 backdrop-blur-md p-6 rounded-2xl shadow-xl border
                  ${i === 0 ? "border-green-500" : "border-gray-200"}
                  hover:shadow-2xl transition
                `}
              >
                <h2 className="text-2xl font-semibold mb-2 text-gray-800">
                  #{i + 1} {t.tarifa}
                </h2>
                <p className="text-gray-700 mb-4">
                  Total:{" "}
                  <span className="font-bold">{t.coste_total.toFixed(2)} €</span>
                </p>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Potencia</span>
                    <span>{t.coste_potencia.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Energía</span>
                    <span>{t.coste_energia.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
