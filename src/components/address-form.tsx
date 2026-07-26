import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomerFormValues } from "@/lib/schemas";

type AddressKey = "billingAddress" | "shippingAddress";

interface AddressErrors {
  line1?: { message?: string };
  line2?: { message?: string };
  city?: { message?: string };
  region?: { message?: string };
  postalCode?: { message?: string };
  country?: { message?: string };
}

const FIELDS = [
  { key: "line1", label: "Address line 1", required: true, span: "sm:col-span-2" },
  { key: "line2", label: "Address line 2 (optional)", required: false, span: "sm:col-span-2" },
  { key: "city", label: "City", required: true, span: "" },
  { key: "region", label: "Province or state", required: true, span: "" },
  { key: "postalCode", label: "Postal or ZIP code", required: true, span: "" },
  { key: "country", label: "Country", required: true, span: "" },
] as const;

export function AddressForm({
  name,
  legend,
  register,
  errors,
}: {
  name: AddressKey;
  legend: string;
  register: UseFormRegister<CustomerFormValues>;
  errors: FieldErrors<CustomerFormValues>;
}) {
  const addressErrors = (errors[name] ?? {}) as AddressErrors;

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold text-foreground">{legend}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => {
          const id = `${name}-${field.key}`;
          const message = addressErrors[field.key]?.message;
          return (
            <div key={id} className={`space-y-1.5 ${field.span}`}>
              <Label htmlFor={id}>{field.label}</Label>
              <Input
                id={id}
                aria-invalid={message ? true : undefined}
                aria-describedby={message ? `${id}-error` : undefined}
                autoComplete="off"
                {...register(`${name}.${field.key}` as const)}
              />
              {message ? (
                <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
                  {message}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}