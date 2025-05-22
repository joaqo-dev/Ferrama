function AccionesCompra({ onCalcular, onComprar }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onCalcular}
        className="bg-blue-600 hover:bg-blue-500 transition-colors text-white px-4 py-2 rounded-lg"
      >
        Calcular
      </button>
      <button
        onClick={onComprar}
        className="bg-blue-600 hover:bg-blue-500 transition-colors text-white px-4 py-2 rounded-lg w-full"
      >
        Comprar
      </button>
    </div>
  );
}

export default AccionesCompra;
