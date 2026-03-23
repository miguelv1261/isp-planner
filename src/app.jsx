import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "./supabase";

export default function App() {
  const [view, setView] = useState("calendar"); // 🔥 navegación real
  const [events, setEvents] = useState([]);
  const [clientes, setClientes] = useState([]);

  const [form, setForm] = useState({
    title: "",
    tipo: "Cobro",
    date: "",
  });

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

  // ➕ CREAR EVENTO
  const handleAddEvent = async () => {
    if (!form.title || !form.date) return alert("Completa los datos");

    await supabase.from("eventos").insert([
      {
        titulo: form.title,
        fecha: form.date,
        tipo: form.tipo,
      },
    ]);

    setView("calendar");
    loadEvents();
  };

  // 💰 PAGAR CLIENTE
  const pagarCliente = async (c) => {
    await supabase
      .from("clientes")
      .update({ deuda: 0, estado: "pagado" })
      .eq("id", c.id);

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

        {/* 📅 CALENDARIO */}
        {view === "calendar" && (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridDay"
            events={events}
            height="100%"
            dateClick={(arg) =>
              setForm({ ...form, date: arg.dateStr }) || setView("create")
            }
          />
        )}

        {/* 👥 CLIENTES */}
        {view === "clientes" && (
          <div>
            <h3>Clientes Morosos</h3>

            {clientes.map((c) => (
              <div key={c.id} className="cliente">
                <p>{c.nombre}</p>
                <p>💰 ${c.deuda}</p>
                <button onClick={() => pagarCliente(c)}>Cobrar</button>
              </div>
            ))}
          </div>
        )}

        {/* ➕ CREAR ACTIVIDAD */}
        {view === "create" && (
          <div className="form">
            <h3>Nueva Actividad</h3>

            <input
              placeholder="Ej: Cobros Centro"
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <select
              onChange={(e) =>
                setForm({ ...form, tipo: e.target.value })
              }
            >
              <option>Cobro</option>
              <option>Venta</option>
              <option>Viaje</option>
            </select>

            <input
              type="date"
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
            />

            <button onClick={handleAddEvent}>Guardar</button>
          </div>
        )}

      </div>

      {/* 🔥 NAV REAL FUNCIONAL */}
      <div className="bottom-nav">
        <button onClick={() => setView("calendar")}>📅</button>
        <button onClick={() => setView("clientes")}>👥</button>
        <button onClick={() => setView("create")}>➕</button>
      </div>

    </div>
  );
}