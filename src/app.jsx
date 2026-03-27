import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function App() {

    const [asesor, setAsesor] = useState(null);
    const [eventos, setEventos] = useState([]);

    const isMobile = window.innerWidth < 768;

    // 🔔 permisos
    useEffect(() => {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    // 🔄 realtime
    useEffect(() => {
        const channel = supabase
            .channel("eventos")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "eventos" },
                () => loadEventosHoy()
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    // 📅 cargar eventos del día
    const loadEventosHoy = async () => {
        const today = new Date().toISOString().split("T")[0];

        const { data } = await supabase
            .from("eventos")
            .select("*")
            .eq("fecha", today)
            .order("id", { ascending: false });

        setEventos(data || []);
    };

    useEffect(() => {
        loadEventosHoy();
    }, []);

    // ✅ completar evento
    const completarEvento = async (evento) => {
        await supabase
            .from("eventos")
            .update({
                estado: "completado",
                realizado_por: asesor,
                fecha_completado: new Date().toISOString()
            })
            .eq("id", evento.id);
    };

    // 👤 seleccionar asesor
    if (!asesor) {
        return (
            <div className="app center">
                <h2>Selecciona Asesor</h2>

                <button onClick={() => setAsesor("Asesor 1")}>Asesor 1</button>
                <button onClick={() => setAsesor("Asesor 2")}>Asesor 2</button>
            </div>
        );
    }

    return (
        <div className="app">

            {/* HEADER */}
            <div className="header">
                {asesor}
            </div>

            {/* LISTA */}
            <div className="content">

                <h3>Actividades de hoy</h3>

                {eventos.length === 0 && <p>No hay actividades</p>}

                {eventos.map((e) => (
                    <div
                        key={e.id}
                        className={`card ${e.estado}`}
                    >
                        <div>
                            <h4>
                                {e.tipo === "Cobro" ? "💰" :
                                 e.tipo === "Venta" ? "🛒" : "🚗"} {e.titulo}
                            </h4>

                            <p>
                                {e.estado === "completado"
                                    ? `✅ ${e.realizado_por}`
                                    : "⏳ Pendiente"}
                            </p>
                        </div>

                        {e.estado !== "completado" && (
                            <button onClick={() => completarEvento(e)}>
                                Completar
                            </button>
                        )}
                    </div>
                ))}

            </div>

        </div>
    );
}