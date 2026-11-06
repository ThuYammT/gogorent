import { z } from "zod";

export const registrationSchema = z
  .object({
    role: z.enum(["RENTER", "OWNER"]),
    name: z.string().trim().min(1, "Name is required").max(100),
    email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine((value) => new TextEncoder().encode(value).length <= 72, {
        message: "Password must be at most 72 bytes",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
