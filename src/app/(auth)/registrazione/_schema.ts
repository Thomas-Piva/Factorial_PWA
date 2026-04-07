import { z } from "zod";
import { RUOLI } from "@/lib/constants";

/**
 * Shared registration schema — imported by both the client form (page.tsx)
 * and the server action (_actions.ts) so validation rules are never duplicated.
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "L'email è obbligatoria")
    .email("Inserisci un'email valida"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
  full_name: z.string().min(2, "Il nome completo è obbligatorio"),
  // H3: phone format validation — blocks stored-XSS via malicious strings
  phone: z
    .string()
    .min(1, "Il telefono è obbligatorio")
    .regex(
      /^\+?[\d\s\-()+]{6,20}$/,
      "Inserisci un numero di telefono valido",
    ),
  role: z.enum([RUOLI.MANAGER, RUOLI.EMPLOYEE] as [string, ...string[]]),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
