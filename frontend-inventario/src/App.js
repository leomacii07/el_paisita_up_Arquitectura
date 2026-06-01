import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // --- ESTADOS DE AUTENTICACIÓN Y BLOQUEO DEL SISTEMA ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // --- ESTADOS DE PANTALLA ---
  const [pantalla, setPantalla] = useState('catalogo'); 
  const [productos, setProductos] = useState([]);
  
  // --- BÓVEDA DE IMÁGENES (Local Storage) ---
  const [storedImages, setStoredImages] = useState(() => {
    const saved = localStorage.getItem('catalog_images_paisita');
    return saved ? JSON.parse(saved) : {};
  });
  
  // --- CATALOGO MAESTRO (Persistencia) ---
  const [catalog, setCatalog] = useState(() => {
    const savedCatalog = localStorage.getItem('master_catalog_paisita');
    return savedCatalog ? JSON.parse(savedCatalog) : [];
  });
  
  const [ventasDelDia, setVentasDelDia] = useState(() => {
    const guardadas = localStorage.getItem('ventas_paisita');
    return guardadas ? JSON.parse(guardadas) : [];
  });

  // --- NUEVO ESTADO PARA NUEVA CARACTERÍSTICA: MERMAS ---
  const [mermasDelDia, setMermasDelDia] = useState(() => {
    const guardadas = localStorage.getItem('mermas_paisita');
    return guardadas ? JSON.parse(guardadas) : [];
  });

  const [fechaHoy] = useState(() => {
    return new Date().toLocaleDateString('es-CO', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  });

  // Estado para bloquear el sistema tras el cierre de caja por el resto del día
  const [sistemaBloqueado, setSistemaBloqueado] = useState(() => {
    const fechaBloqueo = localStorage.getItem('bloqueo_fecha_paisita');
    const fechaActualStr = new Date().toDateString();
    return fechaBloqueo === fechaActualStr;
  });

  // Estado para congelar y mostrar el reporte final impreso en pantalla tras el cierre
  const [reporteFinalCierre, setReporteFinalCierre] = useState(() => {
    const guardado = localStorage.getItem('reporte_final_cierre_paisita');
    return guardado ? JSON.parse(guardado) : null;
  });

  // --- Formulario ---
  const [nombre, setNombre] = useState('Empanada');
  const [categoria, setCategoria] = useState('Fritos');
  const [imagenUrl, setImagenUrl] = useState(''); 
  const [tempImage, setTempImage] = useState(null); 
  const [precioCosto, setPrecioCosto] = useState(1500);
  const [impuesto, setImpuesto] = useState('19'); 
  const [precioVenta, setPrecioVenta] = useState(2500);
  const [stock, setStock] = useState(20);

  // --- EFECTOS ---
  useEffect(() => {
    localStorage.setItem('ventas_paisita', JSON.stringify(ventasDelDia));
  }, [ventasDelDia]);

  useEffect(() => {
    localStorage.setItem('mermas_paisita', JSON.stringify(mermasDelDia));
  }, [mermasDelDia]);

  useEffect(() => {
    localStorage.setItem('master_catalog_paisita', JSON.stringify(catalog));
  }, [catalog]);

  useEffect(() => {
    localStorage.setItem('catalog_images_paisita', JSON.stringify(storedImages));
  }, [storedImages]);

  useEffect(() => {
    const fechaBloqueo = localStorage.getItem('bloqueo_fecha_paisita');
    const fechaActualStr = new Date().toDateString();
    if (fechaBloqueo === fechaActualStr) {
      setSistemaBloqueado(true);
    } else {
      setSistemaBloqueado(false);
      setReporteFinalCierre(null);
      localStorage.removeItem('reporte_final_cierre_paisita');
    }

    if (isLoggedIn && !sistemaBloqueado) {
      obtenerInventarioBackend();
    }
  }, [isLoggedIn, sistemaBloqueado]);

  // --- INNOVACIÓN 1: MODO FILA VIRTUAL (Atajos de Teclado 1-9) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || pantalla !== 'catalogo' || sistemaBloqueado) return;
      
      const keyIndex = parseInt(e.key, 10);
      if (!isNaN(keyIndex) && keyIndex > 0 && keyIndex <= productos.length) {
        const productoSeleccionado = productos[keyIndex - 1];
        const currentStock = isNaN(parseInt(productoSeleccionado.stock, 10)) ? 0 : parseInt(productoSeleccionado.stock, 10);
        if (currentStock > 0) {
          registrarVenta(productoSeleccionado);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productos, pantalla, sistemaBloqueado]);

  const obtenerInventarioBackend = async () => {
    try {
      const respuesta = await fetch('http://localhost:8080/api/productos');
      if (respuesta.ok) {
        const datos = await respuesta.json();
        console.log("Datos crudos recibidos del backend:", datos);

        const datosNormalizados = datos.map(p => {
          const stockCrudo = p.stock !== undefined ? p.stock : (p.cantidad !== undefined ? p.cantidad : 0);
          return {
            ...p,
            stock: isNaN(parseInt(stockCrudo, 10)) ? 0 : parseInt(stockCrudo, 10),
            precioVenta: isNaN(parseFloat(p.precioVenta)) ? 0 : parseFloat(p.precioVenta),
            precioCosto: isNaN(parseFloat(p.precioCosto)) ? 0 : parseFloat(p.precioCosto),
            impuesto: isNaN(parseFloat(p.impuesto)) ? 0 : parseFloat(p.impuesto)
          };
        });

        setProductos(datosNormalizados);
      }
    } catch (error) {
      console.error("Error al sincronizar con Spring Boot:", error);
    }
  };

  const handleBorrarTodo = async () => {
    if (window.confirm("🚨 ¿ATENCIÓN! ¿Estás seguro de que deseas ELIMINAR TODOS los productos de la base de datos?")) {
      try {
        const respuesta = await fetch('http://localhost:8080/api/productos/vaciar', {
          method: 'DELETE'
        });
        if (respuesta.ok) {
          alert("Base de datos vaciada con éxito. Inventario en cero.");
          setProductos([]);
          setVentasDelDia([]);
          setMermasDelDia([]);
          setStoredImages({});
          setReporteFinalCierre(null);
          setSistemaBloqueado(false);
          localStorage.removeItem('ventas_paisita');
          localStorage.removeItem('mermas_paisita');
          localStorage.removeItem('catalog_images_paisita');
          localStorage.removeItem('reporte_final_cierre_paisita');
          localStorage.removeItem('bloqueo_fecha_paisita');
        }
      } catch (error) {
        alert("Error de conexión al intentar borrar los datos.");
      }
    }
  };

  const cambiarStockManual = async (producto) => {
    if (sistemaBloqueado) {
      alert("El sistema se encuentra cerrado por hoy. No se permiten modificaciones.");
      return;
    }
    
    const stockActualValido = isNaN(parseInt(producto.stock, 10)) ? 0 : parseInt(producto.stock, 10);
    const nuevoStockString = prompt(`Modificar existencias de: ${producto.nombre}\nCantidad actual: ${stockActualValido} uds.`, stockActualValido);
    
    if (nuevoStockString === null) return; 
    
    const nuevoStockNum = parseInt(nuevoStockString, 10);
    
    if (isNaN(nuevoStockNum) || nuevoStockNum < 0) {
      alert("Por favor ingresa un número entero válido mayor o igual a 0.");
      return;
    }

    const productoActualizado = {
      id: producto.id, 
      nombre: producto.nombre,
      categoria: producto.categoria,
      imagenUrl: producto.imagenUrl,
      precioCosto: parseFloat(producto.precioCosto) || 0,
      impuesto: parseFloat(producto.impuesto) || 0,
      precioVenta: parseFloat(producto.precioVenta) || 0,
      stock: nuevoStockNum 
    };

    try {
      const respuesta = await fetch('http://localhost:8080/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productoActualizado)
      });
      
      if (respuesta.ok) {
        alert(`Stock de ${producto.nombre} actualizado a ${nuevoStockNum} uds.`);
        obtenerInventarioBackend(); 
      } else {
        alert("El servidor rechazó la actualización del stock.");
      }
    } catch (error) {
      alert("Error de red al intentar conectar con Spring Boot.");
    }
  };

  // --- INNOVACIÓN 3: LÓGICA DE REGISTRO DE MERMAS ---
  const registrarMerma = async (producto) => {
    if (sistemaBloqueado) {
      alert("Operación bloqueada. La caja ya se encuentra clausurada.");
      return;
    }
    
    const stockActual = isNaN(parseInt(producto.stock, 10)) ? 0 : parseInt(producto.stock, 10);
    const cantMermaStr = prompt(`¿Cuántas unidades de [ ${producto.nombre} ] registrarás como Pérdida/Merma (dañadas, quemadas, vencidas)?`, "1");
    
    if (cantMermaStr === null) return;
    const cantMerma = parseInt(cantMermaStr, 10);

    if (isNaN(cantMerma) || cantMerma <= 0) {
      alert("Por favor introduce una cantidad entera superior a cero.");
      return;
    }
    if (cantMerma > stockActual) {
      alert(`Inconsistencia. No puedes dar de baja ${cantMerma} unidades si el stock actual es de ${stockActual}.`);
      return;
    }

    const pCosto = !isNaN(parseFloat(producto.precioCosto)) ? parseFloat(producto.precioCosto) : 0;
    const pImpuesto = !isNaN(parseFloat(producto.impuesto)) ? parseFloat(producto.impuesto) : 0;
    const costoRealConIva = pCosto * (1 + (pImpuesto / 100));
    const perdidaFinancieraTotal = costoRealConIva * cantMerma;

    const nuevaMerma = {
      id: Date.now(),
      nombre: producto.nombre,
      cantidad: cantMerma,
      perdidaTotal: perdidaFinancieraTotal,
      hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    };

    const productoActualizado = {
      ...producto,
      stock: stockActual - cantMerma
    };

    try {
      const respuesta = await fetch('http://localhost:8080/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productoActualizado)
      });

      if (respuesta.ok) {
        setMermasDelDia(prev => [...prev, nuevaMerma]);
        alert(`¡Merma registrada! Se removieron ${cantMerma} unidades del stock.`);
        obtenerInventarioBackend();
      } else {
        alert("El servidor denegó la alteración física de inventario para mermas.");
      }
    } catch (e) {
      alert("Error de red al sincronizar merma con el servidor.");
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    
    if (sistemaBloqueado) {
      alert("Caja cerrada. No se puede inyectar nueva mercancía.");
      return;
    }

    const nombreLimpio = nombre ? nombre.trim() : '';
    if (!nombreLimpio) {
      alert("Por favor ingresa un nombre válido.");
      return;
    }

    const productoExistente = productos.find(p => p.nombre.toLowerCase().trim() === nombreLimpio.toLowerCase());
    if (productoExistente) {
      alert(`El producto "${nombreLimpio}" ya existe del catálogo.`);
      setPantalla('catalogo');
      return;
    }

    if (tempImage) {
      setStoredImages(prev => ({ ...prev, [nombreLimpio]: tempImage }));
    }

    const urlDefecto = 'https://images.unsplash.com/photo-1628102477218-097561f38e6f?q=80&w=300&auto=format&fit=crop';

    const nuevoProducto = {
      nombre: nombreLimpio,
      categoria: categoria ? categoria.trim() : 'General',
      imagenUrl: urlDefecto,
      precioCosto: Number(precioCosto) || 0,
      impuesto: Number(impuesto) || 0,
      precioVenta: Number(precioVenta) || 0,
      stock: parseInt(stock, 10) || 0
    };

    try {
      const respuesta = await fetch('http://localhost:8080/api/productos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(nuevoProducto)
      });

      if (respuesta.ok) {
        alert("¡Producto inyectado correctamente!");
        setNombre(''); 
        setTempImage(null); 
        setPrecioCosto(1500); 
        setPrecioVenta(2500); 
        setStock(20);
        await obtenerInventarioBackend();
        setPantalla('catalogo');
      } else {
        const errorTexto = await respuesta.text();
        alert(`El backend rechazó el producto (Error ${respuesta.status}).\nDetalle: ${errorTexto}`);
      }
    } catch (error) {
      alert("Error de conexión: Verifica que tu backend esté corriendo en el puerto 8080.");
    }
  };

  const registrarVenta = async (producto) => {
    if (sistemaBloqueado) {
      alert("Operación denegada. La caja de hoy ya fue clausurada.");
      return;
    }

    const stockActual = isNaN(parseInt(producto.stock, 10)) ? 0 : parseInt(producto.stock, 10);
    if (stockActual <= 0) {
      alert(`¡Alerta! Sin existencias de ${producto.nombre}.`);
      return;
    }

    try {
      const respuesta = await fetch(`http://localhost:8080/api/ventas/${producto.id}/1`, {
        method: 'POST'
      });

      if (respuesta.ok) {
        const pCosto = !isNaN(parseFloat(producto.precioCosto)) ? parseFloat(producto.precioCosto) : 0;
        const pImpuesto = !isNaN(parseFloat(producto.impuesto)) ? parseFloat(producto.impuesto) : 0;
        const pVenta = !isNaN(parseFloat(producto.precioVenta)) ? parseFloat(producto.precioVenta) : 0;

        const costoRealConIva = pCosto * (1 + (pImpuesto / 100));
        const gananciaNetaGenerada = pVenta - costoRealConIva;

        const nuevaVenta = {
          id: Date.now(),
          nombre: producto.nombre,
          precioVenta: pVenta,
          costoConIva: costoRealConIva,
          gananciaNeta: gananciaNetaGenerada,
          hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        };

        setVentasDelDia(prev => [...prev, nuevaVenta]);
        obtenerInventarioBackend(); 
      } else {
        alert("No se pudo procesar la venta en el backend.");
      }
    } catch (error) {
      alert("Error de conexión al procesar la transacción.");
    }
  };

  const limpiarCierreCaja = () => {
    if (window.confirm("¿Seguro que deseas cerrar la jornada actual? Esto bloqueará las ventas por hoy.")) {
      const ingresos = ventasDelDia.reduce((sum, v) => sum + (Number(v.precioVenta) || 0), 0);
      const ganancias = ventasDelDia.reduce((sum, v) => sum + (Number(v.gananciaNeta) || 0), 0);
      const mermasTotales = mermasDelDia.reduce((sum, m) => sum + m.perdidaTotal, 0);
      
      const reporteFinal = {
        fecha: fechaHoy,
        totalVentasContadas: ventasDelDia.length,
        ingresosTotales: ingresos,
        gananciasNetasInmutables: ganancias,
        perdidasMermas: mermasTotales,
        gananciaRealNeta: ganancias - mermasTotales,
        detallesTransacciones: [...ventasDelDia],
        top3Productos: top3ProductosCalculados
      };

      const fechaActualStr = new Date().toDateString();
      localStorage.setItem('bloqueo_fecha_paisita', fechaActualStr);
      localStorage.setItem('reporte_final_cierre_paisita', JSON.stringify(reporteFinal));
      
      setReporteFinalCierre(reporteFinal);
      setVentasDelDia([]);
      setMermasDelDia([]);
      localStorage.removeItem('ventas_paisita');
      localStorage.removeItem('mermas_paisita');
      setSistemaBloqueado(true);
    }
  };

  const handleSalirEcosistema = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setPantalla('catalogo'); 
  };

  const formatearMoneda = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);
  
  const ingresosTotales = ventasDelDia.reduce((sum, v) => sum + (Number(v.precioVenta) || 0), 0);
  const gananciasTotalesNetas = ventasDelDia.reduce((sum, v) => sum + (Number(v.gananciaNeta) || 0), 0);
  const totalPerdidasMermas = mermasDelDia.reduce((sum, m) => sum + m.perdidaTotal, 0);

  // --- INNOVACIÓN 2 & 4: PROCESADO DE ANALÍTICA DEL TOP 3 ---
  const conteoProductos = ventasDelDia.reduce((acc, v) => {
    if (!acc[v.nombre]) acc[v.nombre] = { nombre: v.nombre, ganancia: 0, cantidad: 0 };
    acc[v.nombre].ganancia += v.gananciaNeta;
    acc[v.nombre].cantidad += 1;
    return acc;
  }, {});
  const top3ProductosCalculados = Object.values(conteoProductos)
    .sort((a, b) => b.ganancia - a.ganancia)
    .slice(0, 3);

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-brand-icon">⚡</div>
          <h2>El Paisita UP</h2>
          <p className="login-subtitle">Arquitectura Enterprise de Control de Inventarios</p>
          {sistemaBloqueado && <div className="login-warning-badge">🔒 Caja cerrada para el día de hoy</div>}
          <input type="text" placeholder="Identificador de Usuario" value={username} onChange={(e) => setUsername(e.target.value)} className="login-input" />
          <input type="password" placeholder="Clave Operativa" value={password} onChange={(e) => setPassword(e.target.value)} className="login-input" />
          <button onClick={() => { 
            if(username === 'admin' && password === '12345') { setIsLoggedIn(true); } 
            else { alert('Credenciales incorrectas'); }
          }} className="login-btn">Acceder al Sistema</button>
        </div>
      </div>
    );
  }

  if (sistemaBloqueado && reporteFinalCierre) {
    return (
      <div className="bloqueo-layout">
        <div className="bloqueo-card">
          <div className="bloqueo-icono">🔒 SYSTEM LOCKED</div>
          <h2>Jornada de Caja Concluida</h2>
          <p className="bloqueo-sub">El acceso operativo de ventas se reactivará de forma automática en el siguiente cambio de fecha calendario.</p>
          
          <div className="reporte-cierre-box">
            <h3>Reporte Consolidado de Utilidades</h3>
            <p className="cierre-fecha">📅 {reporteFinalCierre.fecha}</p>
            <div className="cierre-kpi-grid">
              <div className="cierre-kpi"><span>Volumen Diario</span><strong>{reporteFinalCierre.totalVentasContadas} Uds</strong></div>
              <div className="cierre-kpi"><span>Recaudo Bruto</span><strong>{formatearMoneda(reporteFinalCierre.ingresosTotales)}</strong></div>
              <div className="cierre-kpi highlight-ganancia" style={{backgroundColor: '#baffc9', color: '#1a5a1a'}}>
                <span>Ganancia Real Neta</span><strong>{formatearMoneda(reporteFinalCierre.gananciaRealNeta ?? reporteFinalCierre.gananciasNetasInmutables)}</strong>
              </div>
            </div>

            {/* Renderizado de Mermas en Reporte Inmutable si aplica */}
            {reporteFinalCierre.perdidasMermas > 0 && (
              <p style={{color: '#ffb3ba', fontSize: '14px', textAlign: 'center', marginTop: '10px', fontWeight: 'bold'}}>
                📉 Absorción de Pérdidas por Mermas: -{formatearMoneda(reporteFinalCierre.perdidasMermas)}
              </p>
            )}

            {/* Mostrar Podio en Reporte Final Inmutable */}
            {reporteFinalCierre.top3Productos && reporteFinalCierre.top3Productos.length > 0 && (
              <div style={{marginTop: '20px', borderTop: '1px dashed #444', paddingTop: '15px'}}>
                <h4 style={{color: '#ffdfba', margin: '0 0 10px 0', fontSize: '14px', textAlign: 'center'}}>🥇 RENDIMIENTO TOP 3 HISTÓRICO DE HOY</h4>
                <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                  {reporteFinalCierre.top3Productos.map((p, idx) => (
                    <div key={idx} style={{background: '#221414', padding: '8px', borderRadius: '4px', flex: 1, textAlign: 'center', fontSize: '12px'}}>
                      <span style={{display: 'block'}}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {p.nombre}</span>
                      <strong style={{color: '#baffc9'}}>{p.cantidad} uds</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="tabla-bloqueo-wrapper">
              <table className="tabla-reporte-bloqueada">
                <thead>
                  <tr><th>Hora</th><th>Producto</th><th>Precio</th><th>Margen</th></tr>
                </thead>
                <tbody>
                  {reporteFinalCierre.detallesTransacciones.map((v) => (
                    <tr key={v.id}>
                      <td>{v.hora}</td>
                      <td>{v.nombre}</td>
                      <td>{formatearMoneda(v.precioVenta)}</td>
                      <td className="ganancia-td">+{formatearMoneda(v.gananciaNeta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <button className="btn-logout" onClick={handleSalirEcosistema}>Salir del Ecosistema</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand">
          <h1>El Paisita UP</h1>
          <p className="fecha-badge">📅 {fechaHoy}</p>
        </div>
        <nav className="header-nav">
          <button className={`nav-link ${pantalla === 'catalogo' ? 'active' : ''}`} onClick={() => setPantalla('catalogo')}>📦 Catálogo</button>
          <button className={`nav-link ${pantalla === 'formulario' ? 'active' : ''}`} onClick={() => setPantalla('formulario')}>➕ Ingresar Mercancía</button>
          <button className={`nav-link-alert ${pantalla === 'reporte' ? 'active' : ''}`} onClick={() => setPantalla('reporte')}>📊 Cierre de Caja ({ventasDelDia.length})</button>
          <button className="btn-nav-logout-direct" onClick={handleSalirEcosistema}>🚪 Salir</button>
        </nav>
      </header>

      <header style={{padding: '10px 20px', background: '#2a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <span style={{color: '#aaa', fontSize: '13px'}}>
            💡 <strong>Modo Fila Virtual:</strong> Presiona números del <kbd>1</kbd> al <kbd>{productos.length}</kbd> en el teclado para vender directo.
          </span>
          <button onClick={handleBorrarTodo} className="btn-modificar-stock" style={{backgroundColor: '#ffb3ba', color: '#5a1a1a', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>
              🔥 Reiniciar Todo
          </button>
      </header>

      <main className="app-content">
        {pantalla === 'catalogo' && (
          <div className="catalogo-view">
            <div className="seccion-titulo">
              <h2>Inventario Disponible</h2>
              <p>Módulo de facturación directa y alteración física de stock por ítem</p>
            </div>

            {productos.length === 0 ? (
              <div className="empty-state">No hay mercancía en el catálogo. Registra un ítem para inicializar.</div>
            ) : (
              <div className="grid-catalogo">
                {productos.map((prod, index) => {
                  const currentStock = isNaN(parseInt(prod.stock, 10)) ? 0 : parseInt(prod.stock, 10);
                  
                  // --- INNOVACIÓN 2: CÁLCULO EN TIEMPO REAL ALTA DEMANDA (Smart Stock) ---
                  const ventasDeEsteItem = conteoProductos[prod.nombre]?.cantidad || 0;
                  const esAltaDemanda = ventasDeEsteItem >= 3 && currentStock <= 10 && currentStock > 0;

                  return (
                    <div key={prod.id} className="card-producto" style={{ border: esAltaDemanda ? '2px solid #ffb3ba' : 'none', position: 'relative' }}>
                      
                      {/* Badge indicador numérico para el atajo de teclado */}
                      <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(42,26,26,0.85)', color: '#ffdfba', padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', zIndex: 10, border: '1px solid #444' }}>
                        #{index + 1}
                      </span>

                      <div className="card-image-wrapper">
                        <img src={storedImages[prod.nombre] || prod.imagenUrl} alt={prod.nombre} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                        <span className="categoria-tag">{prod.categoria}</span>
                        {esAltaDemanda && <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#ffb3ba', color: '#5a1a1a', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>🔥 ALTA DEMANDA</span>}
                      </div>
                      <div className="card-info">
                        <h3>{prod.nombre}</h3>
                        <div className="card-precios">
                          <div>
                            <span className="label-precio">P. Venta</span>
                            <span className="valor-venta">{formatearMoneda(Number(prod.precioVenta) || 0)}</span>
                          </div>
                          <div className="text-right">
                            <span className="label-precio">Costo base</span>
                            <span className="valor-costo">{formatearMoneda(Number(prod.precioCosto) || 0)}</span>
                          </div>
                        </div>
                        
                        <div className="stock-status-bar">
                          <span className="stock-count">Existencia: <strong>{currentStock} uds</strong></span>
                          <div className="progreso-stock" style={{width: `${Math.min((currentStock/50)*100, 100)}%`, backgroundColor: currentStock < 5 ? '#ffb3ba' : '#baffc9'}}></div>
                        </div>

                        {/* Modificado para incluir botón estructurado de mermas respetando tu CSS */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px' }}>
                          <button className="btn-vender-card" onClick={() => registrarVenta(prod)} disabled={currentStock <= 0}>
                            {currentStock <= 0 ? '🚫 Agotado' : '🛒 Vender'}
                          </button>
                          <button className="btn-modificar-stock" onClick={() => cambiarStockManual(prod)} style={{padding: '4px 2px', fontSize: '12px'}}>
                            ✏️ Stock
                          </button>
                          <button className="btn-modificar-stock" onClick={() => registrarMerma(prod)} style={{ backgroundColor: '#ffb3ba', color: '#5a1a1a', padding: '4px 2px', fontSize: '12px' }}>
                            🗑️ Merma
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {pantalla === 'formulario' && (
          <div className="form-container-centered">
            <div className="form-card">
              <h2 className="form-title">Registro Único de Producto <span>Los nombres duplicados se desestimarán automáticamente</span></h2>
              <form onSubmit={handleGuardar}>
                <div className="form-group">
                  <label className="form-label">Nombre del Producto</label>
                  <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="form-input" required />
                </div>
                <div className="grid-2-col">
                  <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Imagen</label>
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setTempImage(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }} className="form-input" />
                  </div>
                </div>
                <div className="grid-2-col">
                  <div className="form-group">
                    <label className="form-label">Precio Costo</label>
                    <input type="number" value={precioCosto} onChange={(e) => setPrecioCosto(e.target.value)} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Impuesto</label>
                    <select value={impuesto} onChange={(e) => setImpuesto(e.target.value)} className="form-input">
                      <option value="19">IVA 19%</option>
                      <option value="8">INC 8%</option>
                      <option value="0">Exento</option>
                    </select>
                  </div>
                </div>
                <div className="suggested-box">
                  <p className="suggested-title">Margen Sugerido (30%)</p>
                  <div className="suggested-price">
                    {formatearMoneda((Number(precioCosto) || 0) * (1 + (parseFloat(impuesto) || 0)/100) * 1.3)}
                  </div>
                </div>
                <div className="grid-2-col">
                  <div className="form-group">
                    <label className="form-label">Precio Final Venta</label>
                    <input type="number" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cantidad Inicial</label>
                    <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="form-input" required />
                  </div>
                </div>
                <button type="submit" className="btn-submit">Inyectar Nuevo Producto</button>
              </form>
            </div>
          </div>
        )}

        {pantalla === 'reporte' && (
          <div className="reporte-view">
            
            {/* --- INNOVACIÓN 4: PODIO TOP 3 DINÁMICO EN LA VISTA DE REPORTES --- */}
            {top3ProductosCalculados.length > 0 && (
              <div style={{ background: '#2a1a1a', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #3d2525' }}>
                <h3 style={{ color: '#ffdfba', margin: '0 0 12px 0', fontSize: '15px', fontWeight: '500' }}>🏆 Productos de Mayor Margen de Utilidad (Hoy)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {top3ProductosCalculados.map((item, idx) => (
                    <div key={idx} style={{ background: '#1f1313', padding: '10px', borderRadius: '6px', borderLeft: `3px solid ${idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : '#cd7f32'}` }}>
                      <span style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>{idx + 1}. {item.nombre}</span>
                      <span style={{ display: 'block', color: '#baffc9', fontSize: '12px', marginTop: '2px' }}>+{formatearMoneda(item.ganancia)} netos ({item.cantidad} uds)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="kpi-dashboard">
              <div className="kpi-card text-pastel-pink">
                <h3>Volumen de Ventas</h3>
                <p className="kpi-valor">{ventasDelDia.length} uds</p>
              </div>
              <div className="kpi-card text-pastel-blue">
                <h3>Recaudo de Caja</h3>
                <p className="kpi-valor">{formatearMoneda(ingresosTotales)}</p>
              </div>
              <div className="kpi-card text-pastel-green">
                <h3>Utilidad Neta Real</h3>
                {/* Descuenta automáticamente el impacto financiero de las mermas registradas */}
                <p className="kpi-valor">{formatearMoneda(gananciasTotalesNetas - totalPerdidasMermas)}</p>
              </div>
            </div>

            {/* Sub-tarjeta para auditar mermas activas antes de congelar caja */}
            {mermasDelDia.length > 0 && (
              <div className="form-card full-width-card" style={{marginBottom: '20px', borderColor: '#ffb3ba'}}>
                <h3 style={{color: '#ffb3ba', margin: '0 0 10px 0', fontSize: '15px'}}>🗑️ Libro de Mermas y Desperdicios Registrados</h3>
                <table className="tabla-reporte">
                  <thead>
                    <tr><th>Timestamp</th><th>Ítem dado de baja</th><th>Cantidad Removida</th><th>Pérdida (Costo absorbido)</th></tr>
                  </thead>
                  <tbody>
                    {mermasDelDia.map(m => (
                      <tr key={m.id}>
                        <td>{m.hora}</td><td style={{color: '#ffb3ba'}}>{m.nombre}</td>
                        <td>{m.cantidad} Uds</td><td style={{color: '#ff6b6b'}}>-{formatearMoneda(m.perdidaTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="form-card full-width-card">
              <div className="reporte-header">
                <h2>Cierre Diario de Operaciones</h2>
                <button className="btn-clean-caja" onClick={limpiarCierreCaja}>🔒 Finalizar y Cerrar Caja</button>
              </div>
              {ventasDelDia.length === 0 ? (
                <p className="empty-state">No hay registros de transacciones para la fecha.</p>
              ) : (
                <table className="tabla-reporte">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Ítem</th>
                      <th>Ingreso Bruto</th>
                      <th>Costo Real</th>
                      <th>Margen Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasDelDia.map((v) => (
                      <tr key={v.id}>
                        <td>{v.hora}</td>
                        <td style={{ color: '#ffdfba', fontWeight: '500' }}>{v.nombre}</td>
                        <td>{formatearMoneda(Number(v.precioVenta) || 0)}</td>
                        <td>{formatearMoneda(Number(v.costoConIva) || 0)}</td>
                        <td style={{ color: '#baffc9', fontWeight: '600' }}>+{formatearMoneda(Number(v.gananciaNeta) || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;