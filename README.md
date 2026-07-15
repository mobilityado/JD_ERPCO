# CONCIL.IA · JDE vs Saldos por Conductor — Executive Intelligence

Versión ejecutiva tipo Power BI para conciliar archivos JDE contra Saldos por Conductor de ADO, SUR y TRT.

## Funciones principales
- Login con usuarios activos cargados desde Google Sheets mediante Apps Script.
- Carga y detección automática de los seis CSV requeridos.
- Conciliación por número de conductor.
- Resumen Ejecutivo Inteligente.
- Semáforo de calidad de conciliación y porcentaje cuadrado.
- Comparativo ADO / SUR / TRT.
- Diferencias: saldo distinto, solo JDE, solo Saldos y cuadrados.
- Filtros rápidos y búsqueda.
- Vista 360° del conductor con diagnóstico automático.
- Ranking de mayores adeudos y concentración por marca.
- Copiloto con preguntas sobre los datos cargados.
- Exportación CSV.
- Reporte Ejecutivo Excel con hojas: Resumen Ejecutivo, Conciliación, Diferencias, Adeudos, Solo JDE y Solo Saldos.

## Implementación
1. Descomprime el proyecto y sube los archivos de la carpeta a tu repositorio GitHub Pages.
2. `config.js` ya contiene la URL del Apps Script configurada anteriormente.
3. Conserva tu `Code.gs` desplegado como aplicación web con acceso adecuado.
4. Para generar archivos XLSX, la página carga SheetJS desde CDN. Si la red bloquea esa librería, la aplicación exportará CSV como respaldo.

## Archivos
- `index.html`: interfaz.
- `styles.css`: diseño ejecutivo.
- `app.js`: conciliación, dashboard, copiloto y exportaciones.
- `config.js`: URL de Apps Script.
- `Code.gs`: backend de autenticación de referencia.
