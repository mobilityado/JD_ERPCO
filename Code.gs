const ID_SHEET = '1H_iGzONbV-mc0B37_p3XvR62A5wr81mcK8Sn0W4JVDs';
const HOJA_USUARIOS = 'Usuarios'; // Si tu pestaña tiene otro nombre, cámbialo aquí.

function doGet(e) {
  try {
    e = e || { parameter: {} };
    const accion = String(e.parameter.accion || '').toLowerCase().trim();

    if (!accion) {
      return respuesta({
        error: false,
        mensaje: 'Servicio de autenticación CONCIL.IA activo',
        acciones: ['usuarios', 'login']
      });
    }

    if (accion === 'usuarios') return obtenerUsuarios();
    if (accion === 'login') return validarLogin(e.parameter);

    return respuesta({ error: true, mensaje: 'Acción inválida.' });
  } catch (err) {
    return respuesta({ error: true, mensaje: 'Error del servidor: ' + err.message });
  }
}

function obtenerUsuarios() {
  const datos = leerUsuarios_();
  const usuarios = datos
    .filter(u => u.activo)
    .map(u => ({
      usuario: u.usuario,
      nombre: u.nombre || u.usuario,
      rango: u.rango || 'Usuario'
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

  return respuesta({ error: false, usuarios: usuarios });
}

function validarLogin(param) {
  const usuario = String(param.usuario || '').trim();
  const password = String(param.password || param.contrasena || '').trim();

  if (!usuario || !password) {
    return respuesta({ error: true, acceso: false, mensaje: 'Selecciona un usuario y escribe la contraseña.' });
  }

  const encontrado = leerUsuarios_().find(u => normalizar_(u.usuario) === normalizar_(usuario));

  if (!encontrado) {
    return respuesta({ error: true, acceso: false, mensaje: 'Usuario no encontrado.' });
  }

  if (!encontrado.activo) {
    return respuesta({ error: true, acceso: false, mensaje: 'Este usuario está desactivado.' });
  }

  if (String(encontrado.password) !== password) {
    return respuesta({ error: true, acceso: false, mensaje: 'Contraseña incorrecta.' });
  }

  registrarAcceso_(encontrado.fila, encontrado.columnas);

  return respuesta({
    error: false,
    ok: true,
    acceso: true,
    usuario: encontrado.usuario,
    nombre: encontrado.nombre || encontrado.usuario,
    rango: encontrado.rango || 'Usuario',
    mensaje: 'Acceso correcto.'
  });
}

function leerUsuarios_() {
  const ss = SpreadsheetApp.openById(ID_SHEET);
  const sh = ss.getSheetByName(HOJA_USUARIOS) || ss.getSheets()[0];
  const values = sh.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  const headers = values[0].map(normalizarEncabezado_);
  const col = {
    usuario: buscarCol_(headers, ['usuario', 'user', 'username']),
    password: buscarCol_(headers, ['contrasena', 'contraseña', 'password', 'clave']),
    rango: buscarCol_(headers, ['rango', 'rol', 'perfil', 'tipo']),
    nombre: buscarCol_(headers, ['nombre', 'nombre completo', 'nombres']),
    activo: buscarCol_(headers, ['activo', 'estatus', 'estado', 'habilitado']),
    ultimo: buscarCol_(headers, ['ultimo acceso', 'último acceso', 'fecha ultimo acceso', 'fecha último acceso']),
    ingresos: buscarCol_(headers, ['contador de ingresos', 'ingresos', 'accesos', 'contador'])
  };

  if (col.usuario < 0 || col.password < 0) {
    throw new Error('La hoja debe contener al menos las columnas Usuario y Contraseña/Password.');
  }

  return values.slice(1).map((r, i) => ({
    fila: i + 2,
    columnas: col,
    usuario: r[col.usuario] || '',
    password: r[col.password] || '',
    rango: col.rango >= 0 ? r[col.rango] : 'Usuario',
    nombre: col.nombre >= 0 ? r[col.nombre] : r[col.usuario],
    activo: col.activo < 0 ? true : esActivo_(r[col.activo])
  })).filter(u => u.usuario);
}

function registrarAcceso_(fila, col) {
  try {
    const ss = SpreadsheetApp.openById(ID_SHEET);
    const sh = ss.getSheetByName(HOJA_USUARIOS) || ss.getSheets()[0];

    if (col.ultimo >= 0) {
      sh.getRange(fila, col.ultimo + 1).setValue(new Date());
    }

    if (col.ingresos >= 0) {
      const celda = sh.getRange(fila, col.ingresos + 1);
      const actual = Number(celda.getValue()) || 0;
      celda.setValue(actual + 1);
    }
  } catch (err) {
    console.log('No se pudo registrar el acceso: ' + err.message);
  }
}

function esActivo_(valor) {
  const v = normalizar_(valor);
  if (!v) return true;
  return !['no', 'false', '0', 'inactivo', 'desactivado', 'bloqueado'].includes(v);
}

function buscarCol_(headers, opciones) {
  const normalizadas = opciones.map(normalizarEncabezado_);
  return headers.findIndex(h => normalizadas.includes(h));
}

function normalizarEncabezado_(valor) {
  return normalizar_(valor).replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function normalizar_(valor) {
  return String(valor == null ? '' : valor)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function respuesta(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
