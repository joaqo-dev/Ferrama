import React from "react";

function CantidadSelector({ cantidad, onCantidadChange, maxStock }) {
  const handleChange = (e) => {
    let value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      value = 1;
    }
    if (maxStock !== undefined && value > maxStock) {
      value = maxStock;
    }
    onCantidadChange(value);
  };

  return (
    <div>
      <label
        htmlFor="cantidad"
        className="block text-gray-300 text-sm font-bold mb-2"
      >
        Cantidad:
      </label>
      <input
        type="number"
        id="cantidad"
        className="bg-zinc-700 border border-zinc-600 text-white p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={cantidad}
        onChange={handleChange}
        min="1"
        required
      />
      {maxStock !== undefined && (
        <p className="text-gray-400 text-sm mt-1">
          Stock disponible: {maxStock}
        </p>
      )}
    </div>
  );
}

export default CantidadSelector;
