export type MotoService = {
  kmActual: number | null;
  proximoServiceKm: number | null;
  proximoServiceFecha: Date | string | null;
};

export type EstadoService = {
  vencido: boolean;
  proximo: boolean;
  alerta: boolean;
  motivo: string | null;
};

/** Determina si a una moto le toca (o le está por tocar) el service. */
export function estadoService(moto: MotoService): EstadoService {
  const hoy = new Date();
  const en30 = new Date();
  en30.setDate(hoy.getDate() + 30);

  let vencido = false;
  let proximo = false;
  let motivo: string | null = null;

  if (moto.proximoServiceFecha) {
    const f = new Date(moto.proximoServiceFecha);
    if (f < hoy) {
      vencido = true;
      motivo = "Fecha de service vencida";
    } else if (f <= en30) {
      proximo = true;
      motivo = "Service próximo (por fecha)";
    }
  }

  if (moto.proximoServiceKm != null && moto.kmActual != null) {
    if (moto.kmActual >= moto.proximoServiceKm) {
      vencido = true;
      motivo = "Superó el km de service";
    } else if (moto.proximoServiceKm - moto.kmActual <= 1000 && !vencido) {
      proximo = true;
      motivo = motivo ?? "Service próximo (por km)";
    }
  }

  return { vencido, proximo, alerta: vencido || proximo, motivo };
}
