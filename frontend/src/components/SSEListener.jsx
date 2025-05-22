import { useEffect } from "react";
import { toast } from "react-hot-toast";

const SSEListener = () => {
  useEffect(() => {
    const eventSource = new EventSource("http://localhost:3000/events");

    eventSource.onmessage = (event) => {
      const mensaje = event.data;
      toast.error(mensaje, {
        duration: 6000,
        position: "bottom-right",
      });
    };

    eventSource.onerror = (err) => {
      console.error("Error en la conexión SSE:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return null;
};

export default SSEListener;
