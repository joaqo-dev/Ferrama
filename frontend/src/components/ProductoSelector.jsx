function ProductoSelector({ productos, onSelect, onBuscar }) {
  return (
    <div className="flex gap-2">
      <select
        className="bg-zinc-700 text-white border border-zinc-600 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        onChange={(e) => onSelect(Number(e.target.value))}
        defaultValue=""
      >
        <option value="" disabled>
          Selecciona un producto
        </option>
        {productos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>
      <button
        onClick={onBuscar}
        className="bg-blue-600 hover:bg-blue-500 transition-colors text-white px-4 py-2 rounded-lg"
      >
        Buscar
      </button>
    </div>
  );
}

export default ProductoSelector;
