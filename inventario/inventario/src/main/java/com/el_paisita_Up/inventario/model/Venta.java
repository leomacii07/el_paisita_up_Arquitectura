package com.el_paisita_Up.inventario.model;

import jakarta.persistence.*;
import lombok.Data; // Esto es lo que genera los "setters"
import java.time.LocalDateTime;

@Entity
@Table(name = "ventas")
@Data // <--- Revisa que esta línea esté escrita así
public class Venta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String productoNombre; // Debe ser igual en el Controller
    private Integer cantidad;      // Debe ser igual en el Controller
    private Double total;          // Debe ser igual en el Controller
    private LocalDateTime fechaVenta = LocalDateTime.now();
}