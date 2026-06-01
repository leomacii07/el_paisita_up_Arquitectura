package com.el_paisita_Up.inventario.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String categoria;
    private String imagenUrl;
    private Double precioCosto;
    private Double impuesto;
    private Double precioVenta;
    private Integer stock;
    private Integer mermas = 0; // NUEVO: Contador de unidades perdidas

    // --- CONSTRUCTORES ---
    public Producto() {}

    public Producto(Long id, String nombre, String categoria, String imagenUrl, Double precioCosto, Double impuesto, Double precioVenta, Integer stock, Integer mermas) {
        this.id = id;
        this.nombre = nombre;
        this.categoria = categoria;
        this.imagenUrl = imagenUrl;
        this.precioCosto = precioCosto;
        this.impuesto = impuesto;
        this.precioVenta = precioVenta;
        this.stock = stock;
        this.mermas = mermas != null ? mermas : 0;
    }

    // --- GETTERS Y SETTERS ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getImagenUrl() { return imagenUrl; }
    public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }

    public Double getPrecioCosto() { return precioCosto; }
    public void setPrecioCosto(Double precioCosto) { this.precioCosto = precioCosto; }

    public Double getImpuesto() { return impuesto; }
    public void setImpuesto(Double impuesto) { this.impuesto = impuesto; }

    public Double getPrecioVenta() { return precioVenta; }
    public void setPrecioVenta(Double precioVenta) { this.precioVenta = precioVenta; }

    public Integer getStock() { return stock; }
    public Integer getStockActual() { return stock; } 
    public void setStock(Integer stock) { this.stock = stock; }
    public void setStockActual(Integer stock) { this.stock = stock; } 

    public Integer getMermas() { return mermas; }
    public void setMermas(Integer mermas) { this.mermas = mermas; }
}