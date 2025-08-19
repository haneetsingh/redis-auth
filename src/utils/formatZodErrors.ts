import { z } from "zod";

export function formatZodError(error: z.ZodError) {
  console.log(">>> error issues", error.issues);
  const errors: Record<string, string> = {};

  error.issues.forEach((issue) => {
    const path = issue.path.join(".") || "form";
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  });

  return errors;
}