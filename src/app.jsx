import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "./supabase";

export default function App() {
    const [events, setEvents] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [form, setForm] = useState({
        title: "",
        asesor: "Asesor 1",
        zona: "Centro",
        ciudad: "Puyo",
        tipo: "Cobro",
        objetivo: "",
        date: "",
    });

    // 🔽 cargar datos
    useEffect(() => {
        loadEvents();
        loadClientes();
    }, []);

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

    const loadClientes = async () => {
        const { data } = await supabase.from("clientes").select("*");
        setClientes(data);
    };

    // ➕ crear evento
    const handleAddEvent = async () => {
        await supabase.from("eventos").insert([
            {
                titulo: form.title,
                fecha: form.date,
                asesor: form.asesor,
                zona: form.zona,
                ciudad: form.ciudad,
                tipo: form.tipo,
                objetivo: form.objetivo,
            },
        ]);

        loadEvents();
    };

    // 📅 seleccionar fecha
    const handleDateClick = (arg) => {
        setForm({ ...form, date: arg.dateStr });
    };

    // 🔁 mover evento
    const handleEventDrop = async (info) => {
        await supabase
            .from("eventos")
            .update({ fecha: info.event.startStr })
            .eq("id", info.event.id);
    };

    // 💰 marcar cliente pagado
    const pagarCliente = async (cliente) => {
        await supabase
            .from("clientes")
            .update({ deuda: 0, estado: "pagado" })
            .eq("id", cliente.id);

        loadClientes();
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "10px" }}>

            {/* FORM */}
            <div>
                <h3>Nueva Actividad</h3>

                <input placeholder="Titulo"
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                />

                <select onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                    <option>Cobro</option>
                    <option>Venta</option>
                    <option>Viaje</option>
                </select>

                <select onChange={(e) => setForm({ ...form, asesor: e.target.value })}>
                    <option>Asesor 1</option>
                    <option>Asesor 2</option>
                </select>

                <input placeholder="Zona"
                    onChange={(e) => setForm({ ...form, zona: e.target.value })}
                />

                <input placeholder="Ciudad"
                    onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                />

                <input placeholder="Objetivo"
                    onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
                />

                <button onClick={handleAddEvent}>Guardar</button>

                <hr />

                <h3>Clientes Morosos</h3>

                {clientes.map((c) => (
                    <div key={c.id} style={{ borderBottom: "1px solid #ccc" }}>
                        <p>{c.nombre} - ${c.deuda}</p>
                        <button onClick={() => pagarCliente(c)}>Pagar</button>
                    </div>
                ))}
            </div>

            {/* CALENDARIO */}
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={events}
                dateClick={handleDateClick}
                editable={true}
                eventDrop={handleEventDrop}
                height="90vh"
                eventClassNames={(arg) => {
                    const tipo = arg.event.extendedProps.tipo;
                    if (tipo === "Cobro") return ["event-cobro"];
                    if (tipo === "Venta") return ["event-venta"];
                    if (tipo === "Viaje") return ["event-viaje"];
                }}

            />
        </div>
    );
}