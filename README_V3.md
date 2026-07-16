# CONCIL.IA V3 · Tema dual + Excel Ejecutivo

Cambios principales:
- Botón en encabezado para alternar Modo oscuro / Modo claro. La preferencia se guarda en el navegador.
- Se conserva Obsidian Orange como modo oscuro.
- Exportación Excel con estilo ejecutivo naranja/grafito, títulos, encabezados, formatos monetarios y semáforos por estatus.
- Se agrega el concepto "Cobertura de cruce" para distinguir conductores presentes en ambos archivos del "Cuadre exacto" (diferencia = 0).
- Parser numérico reforzado para importes con separadores de miles y decimales.
- Corrección de texto del diagnóstico cuando la diferencia es positiva/negativa.

Nota sobre indicadores en cero:
El indicador de cuadre exacto solo cuenta como conciliado cuando el saldo acumulado completo de ERPCO/Saldos coincide con el Importe real acumulado de JDE. Los archivos de prueba contienen muchos conductores presentes en ambos reportes, pero sus saldos completos no coinciden exactamente; por eso el porcentaje de cuadre puede ser 0% aunque sí exista cruce de conductores. La V3 separa ambos conceptos para evitar confusión.
