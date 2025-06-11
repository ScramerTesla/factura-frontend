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
      const resp = await axios.post(
        `${API_URL}/analizar-factura`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const cmp = await axios.post(
        `${API_URL}/comparar-tarifas/`,
        resp.data
      );
      setResultado(resp.data);
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
    <main className="min-h-screen flex flex-col items-center p-6">
      {/* Encabezado con iconos */}
      <header className="flex items-center space-x-4 mb-8">
        {/* Icono factura */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"
          />
        </svg>
        <h1 className="text-4xl font-semibold text-gray-800">
          Comparador de Tarifas
        </h1>
        {/* Icono rayo */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-yellow-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </header>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-lg mb-8"
      >
        <label className="block text-gray-700 font-medium mb-2">
          Sube tu factura (PDF):
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full border border-gray-300 rounded px-3 py-2 mb-4"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-green-400 text-white py-2 rounded-full hover:from-blue-600 hover:to-green-500 transition"
        >
          {loading ? "Procesando..." : "Analizar Factura"}
        </button>
      </form>

      {error && (
        <p className="text-red-600 mb-6 font-semibold">{error}</p>
      )}

      {ranking.length > 0 && (
        <>
          {/* Controles */}
          <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <input
              type="text"
              placeholder="🔍 Buscar tarifa…"
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onChange={(e) => setFilter(e.target.value)}
            />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="coste_total">Ordenar por Total</option>
              <option value="coste_energia">Ordenar por Energía</option>
              <option value="coste_potencia">Ordenar por Potencia</option>
            </select>
          </div>

          {/* Gráfica */}
          <div className="w-full max-w-4xl bg-white p-4 rounded-xl shadow-lg mb-8 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mostrar}>
                <XAxis dataKey="tarifa" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(v) => `${v.toFixed(2)} €`} />
                <Bar dataKey="coste_total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tarjetas */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-4xl w-full">
            {mostrar.map((t, i) => (
              <div
                key={i}
                className={`
                  bg-white p-6 rounded-2xl shadow-xl border
                  ${i === 0 ? "border-green-500" : "border-gray-200"}
                  hover:shadow-2xl transition
                `}
              >
                <h2 className="text-2xl font-semibold mb-2">
                  #{i + 1} {t.tarifa}
                </h2>
                <p className="text-gray-700 mb-4">
                  Total:{" "}
                  <span className="font-bold">
                    {t.coste_total.toFixed(2)} €
                  </span>
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
