# CONCIL.IA · JDE vs Saldos por Conductor

Portal estático listo para GitHub Pages.

## Uso
1. Sube `index.html`, `styles.css`, `app.js` y `config.js` a un repositorio de GitHub.
2. Activa GitHub Pages desde la rama principal.
3. El login apunta al Apps Script configurado en `config.js`.
4. Carga los seis CSV: JDE ADO/SUR/TRT y Saldos por Conductor ADO/SUR/TRT.

## Lógica de conciliación
- Normaliza `LM aux` de JDE quitando ceros iniciales.
- JDE usa `Importe real acumulado`.
- Saldos suma `SdoActual` por empleado.
- Clasifica: Cuadrado, Diferencia de saldo, Solo en JDE, Solo en Saldos.
- Incluye resumen, ranking de adeudos, filtros, exportación CSV y copiloto local.

## Nota del login
El frontend intenta validar con:
`?accion=login&usuario=...&password=...`
Si tu Apps Script usa nombres de parámetros distintos, modifica únicamente la función `login()` en `app.js`.


## Login desde Google Sheets
Se incluye `Code.gs` para Apps Script. La web llama `?accion=usuarios` para llenar el selectbox y `?accion=login&usuario=...&password=...` para validar. El endpoint de usuarios nunca devuelve contraseñas.
