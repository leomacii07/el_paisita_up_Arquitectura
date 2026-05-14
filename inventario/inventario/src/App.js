    import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [productos, setProductos] = useState([]);

  // Esta función se ejecuta apenas carga la página
  useEffect(() => {
    obtenerProductos();
  }, []);

  const obtenerProductos = async () => {
    try {
      // Llamada a tu API de Spring Boot
      const respuesta = await axios.get('http://localhost:8080/api/productos');
      setProductos(respuesta.data);
    } catch (error) {
      console.error("Error al conectar con el backend:", error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Inventario - El Paisita UP</h1>
      <table border="1" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {productos.length > 0 ? (
            productos.map((prod) => (
              <tr key={prod.id}>
                <td>{prod.nombre}</td>
                <td>{prod.categoria}</td>
                <td>${prod.precio}</td>
                <td>{prod.stockActual}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center' }}>No hay productos registrados aún.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;