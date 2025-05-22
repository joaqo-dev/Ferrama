function ResultadoCompra({ resultado }) {
  if (!resultado) return null;

  return (
    <div className="bg-green-700/20 border border-green-600 text-green-300 p-4 rounded-lg">
      <p>{resultado.mensaje}</p>
      {resultado.total_clp && (
        <p>Total: ${resultado.total_clp.toLocaleString()} CLP</p>
      )}
      {resultado.total_usd && <p>USD: ${resultado.total_usd}</p>}
    </div>
  );
}

export default ResultadoCompra;
