import React from "react";

function TotalDisplay({ total }) {
  if (total <= 0) {
    return null;
  }

  return (
    <div className="bg-blue-700 p-4 rounded-lg shadow-md text-center mt-4">
      <h2 className="text-xl font-bold">Total a Pagar:</h2>
      <p className="text-3xl font-extrabold text-yellow-300">
        ${total.toLocaleString("es-CL")} CLP
      </p>
      <p className="text-sm text-blue-200 mt-1">
        Impuestos y recargos aplicables.
      </p>
    </div>
  );
}

export default TotalDisplay;
