package com.el_paisita_Up.inventario.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.el_paisita_Up.inventario.model.Producto;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    // Aquí podrías agregar métodos personalizados después
}