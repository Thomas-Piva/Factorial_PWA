"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoleGate } from "@/components/shared/role-gate";
import { RUOLI } from "@/lib/constants";
import { registerUser } from "./_actions";
import { registerSchema, type RegisterFormValues } from "./_schema";

// ---------------------------------------------------------------------------
// Form (exported for direct testing)
// ---------------------------------------------------------------------------

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "employee" },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    setSuccess(false);

    const { error } = await registerUser({
      ...values,
      role: values.role as "manager" | "employee",
    });

    if (error) {
      setServerError(error);
      return;
    }

    reset();
    setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Email */}
      <div className="space-y-1">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Nome completo */}
      <div className="space-y-1">
        <label
          htmlFor="full_name"
          className="block text-sm font-medium text-gray-700"
        >
          Nome completo
        </label>
        <input
          id="full_name"
          type="text"
          autoComplete="name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
          {...register("full_name")}
        />
        {errors.full_name && (
          <p className="text-xs text-red-600">{errors.full_name.message}</p>
        )}
      </div>

      {/* Telefono */}
      <div className="space-y-1">
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700"
        >
          Telefono
        </label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-xs text-red-600">{errors.phone.message}</p>
        )}
      </div>

      {/* Ruolo */}
      <div className="space-y-1">
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700"
        >
          Ruolo
        </label>
        <select
          id="role"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
          {...register("role")}
        >
          <option value="employee">Dipendente</option>
          <option value="manager">Manager</option>
        </select>
        {errors.role && (
          <p className="text-xs text-red-600">{errors.role.message}</p>
        )}
      </div>

      {/* Feedback banner */}
      {serverError && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {serverError}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          Utente registrato con successo
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Registrazione in corso…" : "Registra"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page (default export — guarded by RoleGate)
// ---------------------------------------------------------------------------

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-md">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Registra utente
          </h1>
          <p className="text-sm text-gray-500">
            Crea un nuovo account per un membro del team
          </p>
        </div>

        <RoleGate allowedRoles={[RUOLI.MANAGER]} redirectTo="/dashboard">
          <RegisterForm />
        </RoleGate>
      </div>
    </main>
  );
}
