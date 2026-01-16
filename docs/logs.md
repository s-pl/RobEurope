# Logs — Configuración y uso

Este documento describe la configuración del logger central en `backend/utils/logger.js`.

Resumen
- Librería: `winston` con `winston-daily-rotate-file` para rotación diaria.
- Formatos: timestamps + JSON para ficheros, consola en modo coloreado y simple.
- Transports:
  - `access-<DATE>.log` (nivel `info`), retenidos `14d`.
  - `error-<DATE>.log` (nivel `error`), retenidos `30d`.
  - `Console` (nivel `debug`) para salida en desarrollo/interactivo.
- Manejo de excepciones: archivo `exceptions-<DATE>.log`.

Ubicaciones y nombres de fichero
- Carpeta base de logs: `logs` (resuelta mediante `path.resolve('logs')`).
- Nombres: `access-YYYY-MM-DD.log`, `error-YYYY-MM-DD.log`, `exceptions-YYYY-MM-DD.log`.

Formato y niveles
- El logger principal usa JSON con `timestamp` para archivos (útil para ingestión/lectura por sistemas de logging).
- Consola usa formato legible (colores + texto simple) y muestra mensajes de nivel `debug` o superior.
- Nivel por defecto establecido en `info` en el código; los `Console` muestran `debug`.

Cómo usar el logger en el código
1. Importar la instancia compartida:

```js
import logger from '../utils/logger.js';

logger.info('Servidor iniciado en puerto 3000');
logger.error('Error al procesar petición', { err });
logger.debug('Valores de entrada', { body });
```

Consideraciones operativas
- Asegurarse de que la carpeta `logs` exista y tenga permisos de escritura para el proceso node.
- Si ejecutas en contenedores, monta un volumen o dirige los logs al `stdout`/`stderr` según convenga (actualmente la consola ya emite logs visibles).
- Retención: los ficheros viejos se eliminan automáticamente según `maxFiles` (`14d` / `30d`). Ajustar en `logger.js` si es necesario.

Personalización
- Cambiar la carpeta de logs: modificar `const logDir = path.resolve('logs')`.
- Cambiar niveles/global config: ajustar `level` en `createLogger` o parametrizar mediante `process.env.LOG_LEVEL` si se desea.
- Añadir transports (ej. Elasticsearch, syslog): seguir el patrón de `transports: [...]` y mantener el mismo `format`.

Errores y excepciones
- Las excepciones no capturadas se registran en `exceptions-<DATE>.log` mediante `exceptionHandlers`.
- Para capturar promesas rechazadas globalmente, añadir un handler para `unhandledRejection` que llame a `logger.error` y cierre el proceso si procede.

Dónde mirar primero
- `backend/utils/logger.js` — implementación completa y parámetros por defecto.

Si quieres, actualizo este documento para incluir ejemplos de rotación, configuración por entorno o integración con un colector (ELK/Datadog). Solo dime qué prefieres.
