package com.el_paisita_Up.inventario.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "productos")
@Data
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String categoria;
    
    @Column(name = "precio_compra")
    private Double precioCompra; // Lo que te cuesta a ti

    private Double iva; // Ejemplo: 19 o 0

    @Column(name = "precio_venta")
    private Double precioVenta; // Precio final al público

    @Column(name = "stock_actual")
    private Integer stockActual;

    // Campo calculado para el informe (opcional, se puede calcular en el Front)
    public Double getGananciaUnitaria() {
        return this.precioVenta - (this.precioCompra * (1 + (this.iva / 100)));
    }
}