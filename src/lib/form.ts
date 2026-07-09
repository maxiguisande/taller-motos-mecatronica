import { ZodError } from "zod";

export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

/** Firma de un server action usado con useActionState. */
export type FormHandler = (
  prev: FormState | undefined,
  fd: FormData,
) => Promise<FormState | undefined>;

/** Devuelve un FormState con los errores de campo de un ZodError. */
export function zodToState(error: ZodError): FormState {
  return { fieldErrors: error.flatten().fieldErrors };
}

/** Lee un campo de texto del FormData; "" -> undefined. */
export function optionalStr(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

/** Lee un campo numérico; "" -> undefined. */
export function optionalNum(fd: FormData, key: string): number | undefined {
  const v = optionalStr(fd, key);
  if (v === undefined) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}
