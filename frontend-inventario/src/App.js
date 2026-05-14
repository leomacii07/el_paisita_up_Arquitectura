import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [nuevoProducto, setNuevoProducto] = useState({ 
    nombre: '', categoria: '', precio: '', stockActual: '' 
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = () => {
    obtenerProductos();
    obtenerVentas();
  };

  const obtenerProductos = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/productos');
      setProductos(res.data);
    } catch (err) { console.error("Error al cargar productos", err); }
  };

  const obtenerVentas = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/ventas');
      setVentas(res.data);
    } catch (err) { console.error("Error al cargar ventas", err); }
  };

  const manejarVenta = async (id) => {
    try {
      await axios.post(`http://localhost:8080/api/ventas/${id}/1`);
      cargarDatos();
    } catch (err) {
      alert("⚠️ ¡Agotado! No hay suficiente stock en la cafetera.");
    }
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8080/api/productos', nuevoProducto);
      setNuevoProducto({ nombre: '', categoria: '', precio: '', stockActual: '' });
      cargarDatos();
    } catch (err) { alert("Error al conectar con el servidor"); }
  };

  // Cálculos del Reporte
  const ingresosTotales = ventas.reduce((acc, v) => acc + v.total, 0);
  const totalVendidos = ventas.reduce((acc, v) => acc + v.cantidad, 0);

  // ESTILOS DARK CAFÉ
  const s = {
    body: { backgroundColor: '#0f0a06', color: '#d4a373', minHeight: '100vh', padding: '40px', fontFamily: 'sans-serif' },
    card: { backgroundColor: '#1e160e', padding: '25px', borderRadius: '15px', border: '1px solid #3c2a1a', marginBottom: '25px' },
    input: { backgroundColor: '#0f0a06', color: '#fff', border: '1px solid #d4a373', padding: '12px', borderRadius: '8px', margin: '5px', width: '200px' },
    btn: { backgroundColor: '#d4a373', color: '#1e160e', padding: '12px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    stats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' },
    statItem: { backgroundColor: '#2c1e12', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #d4a373' }
  };

  return (
    <div style={s.body}>
      <h1 style={{textAlign: 'center', fontSize: '2.8rem', textShadow: '2px 2px #000'}}>☕ EL PAISITA UP</h1>
      
      {/* REPORTE MENSUAL */}
      <div style={s.stats}>
        <div style={s.statItem}><h3>Ventas Totales</h3><h2 style={{color: '#fff'}}>${ingresosTotales.toLocaleString()}</h2></div>
        <div style={s.statItem}><h3>Items Vendidos</h3><h2 style={{color: '#fff'}}>{totalVendidos}</h2></div>
        <div style={s.statItem}><h3>Estado del Sistema</h3><h2 style={{color: '#4CAF50'}}>ACTIVO</h2></div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px'}}>
        {/* TABLA DE INVENTARIO */}
        <div style={s.card}>
          <h2 style={{marginTop: 0}}>📋 Inventario Disponible</h2>
          <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '15px'}}>
            <thead>
              <tr style={{borderBottom: '2px solid #d4a373', textAlign: 'left'}}>
                <th style={{padding: '10px'}}>Producto</th>
                <th>Stock</th>
                <th>Precio</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <tr key={p.id} style={{borderBottom: '1px solid #3c2a1a'}}>
                  <td style={{padding: '12px'}}>{p.nombre}</td>
                  <td style={{color: p.stockActual < 5 ? '#ff4d4d' : '#fff'}}>{p.stockActual} {p.stockActual < 5 && '⚠️'}</td>
                  <td>${p.precio.toLocaleString()}</td>
                  <td><button style={s.btn} onClick={() => manejarVenta(p.id)}>Vender</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* REGISTRO DE PRODUCTOS */}
        <div style={s.card}>
          <h2 style={{marginTop: 0}}>➕ Nuevo Suministro</h2>
          <form onSubmit={guardarProducto}>
            <input style={{...s.input, width: '90%'}} placeholder="Nombre" value={nuevoProducto.nombre} onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} required />
            <input style={{...s.input, width: '90%'}} placeholder="Categoría" value={nuevoProducto.categoria} onChange={e => setNuevoProducto({...nuevoProducto, categoria: e.target.value})} required />
            <input style={{...s.input, width: '90%'}} placeholder="Precio" type="number" value={nuevoProducto.precio} onChange={e => setNuevoProducto({...nuevoProducto, precio: e.target.value})} required />
            <input style={{...s.input, width: '90%'}} placeholder="Stock Inicial" type="number" value={nuevoProducto.stockActual} onChange={e => setNuevoProducto({...nuevoProducto, stockActual: e.target.value})} required />
            <button type="submit" style={{...s.btn, width: '100%', marginTop: '15px'}}>Registrar en Base de Datos</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;