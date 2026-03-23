import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "./supabase";

export default function App() {
  const [events, setEvents] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [showForm, setShowForm] = useState(false);

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
    if (!form.title || !form.date) return alert("Falta info");

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

    setShowForm(false);
    loadEvents();
  };

  // 📅 seleccionar fecha
  const handleDateClick = (arg) => {
    setForm({ ...form, date: arg.dateStr });
    setShowForm(true);
  };

  // 🔁 mover evento
  const handleEventDrop = async (info) => {
    await supabase
      .from("eventos")
      .update({ fecha: info.event.startStr })
      .eq("id", info.event.id);
  };

  // 💰 pagar cliente
  const pagarCliente = async (cliente) => {
    await supabase
      .from("clientes")
      .update({ deuda: 0, estado: "pagado" })
      .eq("id", cliente.id);

    loadClientes();
  };

  return (
    <div className="app">

      {/* HEADER */}
      <div className="header">
        ISP Planner
      </div>

      {/* CONTENIDO */}
      <div className="content">

        {/* CALENDARIO */}
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridDay"
          events={events}
          dateClick={handleDateClick}
          editable={true}
          eventDrop={handleEventDrop}
          height="100%"
          headerToolbar={{
            left: "prev,next",
            center: "title",
            right: ""
          }}
          eventClassNames={(arg) => {
            const tipo = arg.event.extendedProps.tipo;
            if (tipo === "Cobro") return ["event-cobro"];
            if (tipo === "Venta") return ["event-venta"];
            if (tipo === "Viaje") return ["event-viaje"];
          }}
        />

        {/* CLIENTES (modo lista rápida) */}
        <div style={{ padding: "10px" }}>
          <h3>Clientes hoy</h3>

          {clientes.map((c) => (
            <div key={c.id} className="cliente">
              <p>{c.nombre}</p>
              <p>💰 ${c.deuda}</p>
              <button onClick={() => pagarCliente(c)}>Cobrar</button>
            </div>
          ))}
        </div>

      </div>

      {/* BOTÓN FLOTANTE */}
      <button className="fab" onClick={() => setShowForm(true)}>
        +
      </button>

      {/* MODAL FORM */}
      {showForm && (
        <div className="modal">
          <div className="modal-content">

            <h3>Nueva Actividad</h3>

            <input placeholder="Titulo"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <select onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option>Cobro</option>
              <option>Venta</option>
              <option>Viaje</option>
            </select>

            <button onClick={handleAddEvent}>Guardar</button>
            <button onClick={() => setShowForm(false)}>Cancelar</button>

          </div>
        </div>
      )}

      {/* NAVBAR */}
      <div className="bottom-nav">
        <button>📅</button>
        <button>👥</button>
        <button onClick={() => setShowForm(true)}>➕</button>
      </div>

    </div>
  );
}