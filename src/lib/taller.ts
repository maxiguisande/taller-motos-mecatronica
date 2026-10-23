/**
 * Datos del taller para los documentos (orden de trabajo / comprobante).
 * Editar acá si cambia algún dato;
 * aparecen en el encabezado del documento solo si están cargados.
 */
export const TALLER = {
  nombre: "Mecatrónica Pilar",
  subtitulo: "Taller de Motos",
  responsable: "Matias Torrano",
  cuit: "23-32238252-9",
  direccion: "Isla Navarino 478, B1633FAA Fátima, Pilar, Buenos Aires",
  telefono: "+54 9 11 3731-3357",
  email: "torranomatias@gmail.com",
};

/**
 * Condiciones de servicio que se imprimen en la orden de trabajo.
 * BORRADOR razonable para Argentina: hacer validar la redacción por un
 * abogado (o el modelo de una cámara del rubro) antes de apoyarse en ella.
 */
export const CONDICIONES_SERVICIO = [
  "Valor y adicionales: el valor consignado corresponde a los trabajos detallados en esta orden. Todo trabajo imprevisto (adicional) que surja será comunicado al cliente junto con su valor y solo se realizará con su conformidad.",
  "Repuestos: los repuestos provistos por el cliente se instalan sin garantía de ninguna naturaleza. El taller provee únicamente repuestos normatizados.",
  "Pago: los trabajos se abonan según el modo de pago indicado en esta orden, al momento del retiro de la unidad.",
  "Retiro y derecho de retención: finalizados los trabajos se notificará al cliente para el retiro de la unidad. Ante el incumplimiento de las condiciones de pago, el taller ejercerá el derecho de retención sobre la unidad (arts. 2587 y ss. del Código Civil y Comercial de la Nación), con más un cargo diario en concepto de estadía. Transcurridas 72 horas desde la notificación sin regularizarse la situación, se iniciarán las acciones legales correspondientes.",
  "Ingreso y egreso: la unidad ingresa y egresa del taller en las fechas y horas consignadas en esta orden, en las condiciones que documentan las fotografías adjuntas.",
];
