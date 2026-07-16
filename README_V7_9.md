# CONCIL.IA V7.9 — Copiloto visible

Corrección definitiva del Copiloto flotante.

Problema:
- El panel del Copiloto es un elemento `<aside>`.
- Reglas antiguas del sidebar afectaban su fondo y visibilidad.
- El overlay se mostraba, pero el chat quedaba invisible.

Solución:
- El Copiloto se excluye de las reglas del sidebar.
- Fondo, tamaño, posición y z-index se definen explícitamente.
- Overlay queda debajo del panel.
- Soporte completo para modo claro y oscuro.
- No modifica el motor de conciliación ni el layout V7.8.
