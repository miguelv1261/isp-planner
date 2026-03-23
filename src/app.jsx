import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "./supabase";

export default function App() {

    const [view, setView] = useState("calendar");

    const [events, setEvents] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [zonas, setZonas] = useState([]);

    const [eventoHoy, setEventoHoy] = useState(null);

    const isMobile = window.innerWidth < 768;

    const [form, setForm] = useState({
        title: "",
        tipo: "Cobro",
        date: "",
        zona_id: "",
        asesor: "Asesor 1"
    });

    // 🔥 CARGA INICIAL
    useEffect(() => {
        loadEvents();
        loadZonas();
        loadEventoHoy();
    }, []);

    // 🔽 EVENTOS
    const loadEvents = async () => {
        const { data } = await supabase.from("eventos").select("*");

        const formatted = data.map((e) => ({
            id: e.id,
            title: `${e.tipo === "Cobro" ? "💰" : e.tipo === "Venta" ? "🛒" : "🚗"} ${e.titulo}`,
            date: e.fecha,
            extendedProps: e,
        }));

        setEvents(formatted);
    };

    // 🔽 ZONAS
    const loadZonas = async () => {
        const { data } = await supabase.from("zonas").select("*");
        setZonas(data);
    };

    // 🔽 EVENTO DEL DÍA
    const loadEventoHoy = async () => {
        const today = new Date().toISOString().split("T")[0];

        const { data } = await supabase
            .from("eventos")
            .select("*")
            .eq("fecha", today)
            .limit(1);

        if (data.length > 0) {
            setEventoHoy(data[0]);
        }
    };

    // 🔽 CLIENTES POR ZONA
    const loadClientesZona = async (zona_id) => {
        const { data } = await supabase
            .from("clientes")
            .select("*")
            .eq("zona_id", zona_id)
            .gt("deuda", 0);

        setClientes(data);
    };

    // 🔥 CUANDO HAY EVENTO DEL DÍA
    useEffect(() => {
        if (eventoHoy?.zona_id) {
            loadClientesZona(eventoHoy.zona_id);
        }
    }, [eventoHoy]);

    // ➕ CREAR EVENTO
    const handleAddEvent = async () => {
        if (!form.title || !form.date || !form.zona_id) {
            return alert("Completa todos los campos");
        }

        await supabase.from("eventos").insert([{
            titulo: form.title,
            fecha: form.date,
            tipo: form.tipo,
            zona_id: form.zona_id,
            asesor: form.asesor
        }]);

        setView("calendar");
        loadEvents();
    };

    return (
        <div className="app">

            {/* HEADER */}
            <div className="header">
                ISP Planner
            </div>

            <div className="content">

                {/* 📅 CALENDARIO (OFICINA) */}
                {view === "calendar" && !isMobile && (
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        events={events}
                        height="100%"
                    />
                )}

                {/* 📱 ASESOR (MÓVIL REAL) */}
                {view === "calendar" && isMobile && (
                    <div>
                        <h3>Trabajo de Hoy</h3>

                        {!eventoHoy && <p>No tienes actividades asignadas</p>}

                        {eventoHoy && (
                            <>
                                <div className="card">
                                    <h4>{eventoHoy.titulo}</h4>
                                    <p>📅 {eventoHoy.fecha}</p>
                                </div>

                                <h4>Clientes en tu zona</h4>

                                {clientes.map((c) => (
                                    <div key={c.id} className="card">
                                        <p>{c.nombre}</p>
                                        <p>📍 {c.ip}</p>
                                        <p>💰 ${c.deuda}</p>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* 👥 CLIENTES (OFICINA) */}
                {view === "clientes" && (
                    <div>
                        <h3>Clientes Morosos</h3>

                        {clientes.map((c) => (
                            <div key={c.id} className="card">
                                <p>{c.nombre}</p>
                                <p>{c.ip}</p>
                                <p>${c.deuda}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* ➕ CREAR EVENTO (OFICINA) */}
                {view === "create" && (
                    <div className="form">
                        <h3>Nueva Actividad</h3>

                        <input
                            placeholder="Titulo"
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />

                        <select
                            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                        >
                            <option>Cobro</option>
                            <option>Venta</option>
                            <option>Viaje</option>
                        </select>

                        <select
                            onChange={(e) => setForm({ ...form, zona_id: e.target.value })}
                        >
                            <option value="">Seleccionar zona</option>
                            {zonas.map((z) => (
                                <option key={z.id} value={z.id}>
                                    {z.nombre}
                                </option>
                            ))}
                        </select>

                        <input
                            type="date"
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                        />

                        <button onClick={handleAddEvent}>Guardar</button>
                    </div>
                )}

            </div>

            {/* NAV */}
            <div className="bottom-nav">
                <button onClick={() => setView("calendar")}>📅</button>
                <button onClick={() => setView("clientes")}>👥</button>
                <button onClick={() => setView("create")}>➕</button>
            </div>

        </div>
    );
}