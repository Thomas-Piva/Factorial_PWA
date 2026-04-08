import { z } from "zod";
import { RUOLI } from "@/lib/constants";

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "L'email è obbligatoria")
    .email("Inserisci un'email valida"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
  first_name: z.string().min(2, "Il nome è obbligatorio"),
  last_name: z.string().min(2, "Il cognome è obbligatorio"),
  phone: z
    .string()
    .min(1, "Il telefono è obbligatorio")
    .regex(
      /^\+?[\d\s\-()+]{6,20}$/,
      "Inserisci un numero di telefono valido",
    ),
  role: z.enum([RUOLI.MANAGER, RUOLI.DIPENDENTE] as [string, ...string[]]),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
