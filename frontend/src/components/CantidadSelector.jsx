function CantidadSelector({ cantidad, setCantidad }) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="cantidad" className="whitespace-nowrap">
        Cantidad:
      </label>
      <input
        id="cantidad"
        type="number"
        min={1}
        className="bg-zinc-700 border border-zinc-600 text-white p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={cantidad}
        onChange={(e) => {
          const valor = Math.max(1, Number(e.target.value));
          setCantidad(valor);
        }}
      />
    </div>
  );
}

export default CantidadSelector;
