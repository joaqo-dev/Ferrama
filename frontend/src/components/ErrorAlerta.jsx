function ErrorAlerta({ mensaje }) {
  if (!mensaje) return null;

  return (
    <div className="bg-red-800/20 border border-red-600 text-red-300 p-4 rounded-lg">
      {mensaje}
    </div>
  );
}

export default ErrorAlerta;
