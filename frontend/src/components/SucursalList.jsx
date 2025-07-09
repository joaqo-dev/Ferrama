import React from "react";

function SucursalList({ sucursales, onSelectSucursal, sucursalSeleccionada }) {
  if (!sucursales || sucursales.length === 0) {
    return (
      <div className="text-gray-400 text-center">
        No hay stock para este producto en ninguna sucursal.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-center mb-4">
        Stock por Sucursal:
      </h2>
      {sucursales.map((sucursal) => (
        <div
          key={sucursal.id}
          className={`
            bg-zinc-700 p-4 rounded-lg shadow-md cursor-pointer transition-all duration-200 ease-in-out
            ${
              sucursalSeleccionada && sucursalSeleccionada.id === sucursal.id
                ? "border-2 border-blue-500 ring-2 ring-blue-500"
                : "border border-zinc-600 hover:border-zinc-500"
            }
          `}
          onClick={() => onSelectSucursal(sucursal)}
        >
          <h3 className="text-lg font-bold text-blue-300">{sucursal.nombre}</h3>
          <p className="text-gray-300">Ubicación: {sucursal.ubicacion}</p>
          <p className="text-gray-300">
            Stock:{" "}
            <span className="font-semibold text-white">{sucursal.stock}</span>
          </p>
          <p className="text-gray-300">
            Precio:{" "}
            <span className="font-semibold text-white">
              ${sucursal.precio.toLocaleString("es-CL")} CLP
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}

export default SucursalList;
