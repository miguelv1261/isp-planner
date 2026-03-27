import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "./supabase";

export default function App() {
    const [asesor, setAsesor] = useState(null);
    const [events, setEvents] = useState([]);
    const [eventosHoy, setEventosHoy] = useState([]);
    const [form, setForm] = useState({
        title: "",
        tipo: "Cobro",
        date: "",
        descripcion: ""
    });

    const isMobile = window.innerWidth < 768;

    useEffect(() => {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        const channel = supabase
            .channel("eventos")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "eventos" },
                () => {
                    loadEvents();
                    loadEventosHoy();
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const loadEvents = async () => {
        const { data } = await supabase.from("eventos").select("*");
        const formatted = data.map((e) => ({
            id: e.id,
            title: e.titulo,
            date: e.fecha,
            classNames: [`tipo-${e.tipo}`, `estado-${e.estado}`],
            extendedProps: { descripcion: e.descripcion }
        }));
        setEvents(formatted);
    };

    const loadEventosHoy = async () => {
        const today = new Date().toISOString().split("T")[0];
        const { data } = await supabase
            .from("eventos")
            .select("*")
            .eq("fecha", today)
            .order("id", { ascending: false });

        setEventosHoy(data || []);
    };

    useEffect(() => {
        loadEvents();
        loadEventosHoy();
    }, []);

    const handleAddEvent = async () => {
        if (!form.title || !form.date) return alert("Completa los datos");

        await supabase.from("eventos").insert([{
            titulo: form.title,
            fecha: form.date,
            tipo: form.tipo,
            descripcion: form.descripcion,
            estado: "pendiente",
            realizado_por: null
        }]);

        setForm({ title: "", tipo: "Cobro", date: "", descripcion: "" });
    };

    const completarEvento = async (e) => {
        await supabase
            .from("eventos")
            .update({
                estado: "completado",
                realizado_por: asesor,
                fecha_completado: new Date().toISOString()
            })
            .eq("id", e.id);
    };

    const handleEventDrop = async (info) => {
        const newDate = info.event.start.toISOString().split("T")[0];
        await supabase
            .from("eventos")
            .update({ fecha: newDate })
            .eq("id", info.event.id);
        loadEvents();
        loadEventosHoy();
    };

    if (!asesor) {
        return (
            <div className="center">
                <h2>Selecciona Asesor</h2>
                <button onClick={() => setAsesor("Asesor 1")}>Asesor 1</button>
                <button onClick={() => setAsesor("Asesor 2")}>Asesor 2</button>
            </div>
        );
    }

    return (
        <div className="app">

            <div className="header">ISP Planner - {asesor}</div>

            {!isMobile && (
                <div className="desktop">

                    <div className="calendar">
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            events={events}
                            height="90vh"
                            editable={true}
                            eventDrop={handleEventDrop}
                        />
                    </div>

                    <div className="form">
                        <h3>Nuevo Evento</h3>

                        <input
                            placeholder="Titulo"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />

                        <textarea
                            placeholder="Descripción"
                            value={form.descripcion}
                            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                        />

                        <select
                            value={form.tipo}
                            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                        >
                            <option>Cobro</option>
                            <option>Venta</option>
                            <option>Viaje</option>
                        </select>

                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                        />

                        <button onClick={handleAddEvent}>Guardar</button>
                    </div>

                </div>
            )}

            {isMobile && (
                <div className="mobile">

                    <h3>Hoy</h3>

                    {eventosHoy.map((e) => (
                        <div key={e.id} className={`card ${e.estado}`}>
                            <div>
                                <h4>
                                    {e.tipo === "Cobro" ? "💰" :
                                        e.tipo === "Venta" ? "🛒" : "🚗"} {e.titulo}
                                </h4>
                                <p>{e.descripcion}</p>
                                <p>
                                    {e.estado === "completado"
                                        ? `✅ ${e.realizado_por}`
                                        : "⏳ Pendiente"}
                                </p>
                            </div>

                            {e.estado !== "completado" && (
                                <button onClick={() => completarEvento(e)}>OK</button>
                            )}
                        </div>
                    ))}

                    <div className="quick-form">
                        <input
                            placeholder="Nueva actividad"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />

                        <button onClick={handleAddEvent}>+</button>
                    </div>

                </div>
            )}

        </div>
    );
}