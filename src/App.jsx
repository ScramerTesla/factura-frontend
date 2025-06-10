// src/App.jsx
import React, { useState } from "react";
import axios from "axios";

// Forzamos la URL directa de producción
const API_URL = "https://factura-backend-7ehi.onrender.com";
console.log("🛠️  API_URL =", API_URL);

export default function App() {
  const [file, setFile] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    setResultado(null);
    setRanking([]);

    try {
      const response = await axios.post("http://localhost:8000/analizar-factura", formData);
      setResultado(response.data);

      try {
        const comparacion = await axios.post("http://localhost:8000/comparar-tarifas/", response.data);
        setRanking(comparacion.data);
      } catch (error) {
        console.error("Error comparando tarifas:", error);
      }
         } catch (error) {
  console.error("🔴 Error analizando la factura:", error.response || error);
  setResultado({ error: error.response?.data?.detail || error.message });
}
 finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Analizador de Factura Eléctrica</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-4"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Analizar
        </button>
      </form>

      {loading && <p className="mt-4">Analizando factura...</p>}

      {resultado && resultado.error && (
        <p className="mt-4 text-red-600">{resultado.error}</p>
      )}

      {ranking.length > 0 && (
        <div className="mt-6 bg-white p-4 rounded shadow-md w-full max-w-2xl">
          <h2 className="text-xl font-semibold mb-2">Ranking de Tarifas</h2>
          <ul>
            {ranking.map((tarifa, index) => (
              <li key={index} className="mb-3 border-b pb-2">
                <strong>#{index + 1} {tarifa.tarifa}</strong><br />
                Potencia: {tarifa.coste_potencia.toFixed(2)} €<br />
                Energía: {tarifa.coste_energia.toFixed(2)} €<br />
                <span className="font-bold">Total: {tarifa.coste_total.toFixed(2)} €</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
