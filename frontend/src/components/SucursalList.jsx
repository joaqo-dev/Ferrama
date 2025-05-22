function SucursalList({ sucursales, seleccionada, onSelect }) {
  return (
    <div className="space-y-3">
      {sucursales.map((s) => (
        <div
          key={s.sucursal_id}
          className={`border border-zinc-700 p-3 rounded-lg cursor-pointer transition-all hover:bg-zinc-700 ${
            seleccionada === s.sucursal_id
              ? "bg-blue-600 border-blue-400"
              : "bg-zinc-800"
          }`}
          onClick={() => onSelect(s.sucursal_id)}
        >
          <p className="font-medium">{s.sucursal}</p>
          <p>Stock: {s.stock}</p>
          <p>Precio: ${s.precio.toLocaleString()} CLP</p>
        </div>
      ))}
    </div>
  );
}

export default SucursalList;
