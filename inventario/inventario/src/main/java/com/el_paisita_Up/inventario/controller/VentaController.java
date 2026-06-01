package com.el_paisita_Up.inventario.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.el_paisita_Up.inventario.model.Producto;
import com.el_paisita_Up.inventario.model.Venta;
import com.el_paisita_Up.inventario.repository.ProductoRepository;
import com.el_paisita_Up.inventario.repository.VentaRepository;

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
        Producto p = productoRepo.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        if(p.getStock() < cantidad) {
            throw new RuntimeException("Stock insuficiente");
        }

        p.setStock(p.getStock() - cantidad);
        productoRepo.save(p);

        Venta v = new Venta();
        v.setProductoNombre(p.getNombre());
        v.setCantidad(cantidad);
        v.setTotal(p.getPrecioVenta() * cantidad);
        
        return ventaRepo.save(v);
    }

    // NUEVO: Endpoint estratégico para registrar mermas/desperdicios físicos
    @PostMapping("/merma/{productoId}/{cantidad}")
    public Producto registrarMerma(@PathVariable Long productoId, @PathVariable Integer cantidad) {
        Producto p = productoRepo.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        if(p.getStock() < cantidad) {
            throw new RuntimeException("No puedes registrar más mermas de las que existen en stock");
        }

        p.setStock(p.getStock() - cantidad);
        p.setMermas(p.getMermas() + cantidad);
        
        return productoRepo.save(p);
    }

    @GetMapping
    public List<Venta> listarVentas() {
        return ventaRepo.findAll();
    }
}