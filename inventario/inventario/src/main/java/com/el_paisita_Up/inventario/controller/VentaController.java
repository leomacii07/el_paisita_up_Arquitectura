package com.el_paisita_Up.inventario.controller;

import com.el_paisita_Up.inventario.model.Producto;
import com.el_paisita_Up.inventario.model.Venta;
import com.el_paisita_Up.inventario.repository.ProductoRepository;
import com.el_paisita_Up.inventario.repository.VentaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ventas")
@CrossOrigin(origins = "*")
public class VentaController {

    @Autowired 
    private VentaRepository ventaRepo;

    @Autowired 
    private ProductoRepository productoRepo;

    @PostMapping("/{productoId}/{cantidad}")
    public Venta realizarVenta(@PathVariable Long productoId, @PathVariable Integer cantidad) {
        // Buscamos el producto o lanzamos error si no existe
        Producto p = productoRepo.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        // Verificamos si hay stock suficiente en la cafetería
        if(p.getStockActual() < cantidad) {
            throw new RuntimeException("Stock insuficiente");
        }

        // 1. Descontamos del inventario
        p.setStockActual(p.getStockActual() - cantidad);
        productoRepo.save(p);

        // 2. Creamos el registro de la venta
        Venta v = new Venta();
        v.setProductoNombre(p.getNombre());
        v.setCantidad(cantidad);
        
        // Usamos precioVenta para el cálculo del total de la transacción
        v.setTotal(p.getPrecioVenta() * cantidad);
        
        // 3. Guardamos la venta y la retornamos
        return ventaRepo.save(v);
    }

    @GetMapping
    public List<Venta> listarVentas() {
        return ventaRepo.findAll();
    }
}