# CONCIL.IA Executive Intelligence · Obsidian Orange V2

Conciliación JDE vs Saldos por Conductor por marca.

## Modalidades
- ADO: carga únicamente JDE ADO + Saldos ADO.
- AAO: carga únicamente JDE AAO/SUR + Saldos AAO.
- TRT: carga únicamente JDE TRT + Saldos TRT.
- Todas las marcas: carga los seis archivos y procesa ADO, AAO y TRT en una sesión.

## Lógica
- JDE: usa `LM aux` como clave e `Importe real acumulado` como saldo.
- ERPCO / Saldos por Conductor: suma `SdoActual` por clave de conductor.
- Diferencia: `ERPCO / Saldos - JDE`, como en el ejemplo de cuadre recibido.
- SUR se normaliza visualmente como AAO.

## Exportación
Genera un Excel con Resumen Ejecutivo, una hoja `CONCILIACION` por marca cargada, Diferencias y Detalle de Conceptos.

El login y Code.gs se conservan sin cambios.
