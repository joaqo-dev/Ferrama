import React from "react";

function ProductoSelector({ productos, onSelect, productoSeleccionado }) {
  const selectedValue = productoSeleccionado ? productoSeleccionado.id : "";

  return (
    <div className="flex gap-2">
      <select
        className="bg-zinc-700 text-white border border-zinc-600 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        onChange={(e) => {
          const selectedProductId = Number(e.target.value);

          const selectedProductObj = productos.find(
            (p) => p.id === selectedProductId
          );
          onSelect(selectedProductObj);
        }}
        value={selectedValue}
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
    </div>
  );
}

export default ProductoSelector;
