import { z } from "zod";
export const registrationSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email address.")
      .max(255),
    password: z.string().min(6, "Use at least 6 characters.").max(200),
    fullName: z.string().trim().min(1, "Enter the name you use.").max(120),
  })
  .strict();
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(255),
  password: z.string().min(1, "Enter your password.").max(200),
});
