import * as z from "zod";

export const errorHandler = (err: unknown) => {
  const error = err as { message: string; status: number };
  let message = error.message || "internal server error";
  let status = error.status || 500;

  if (err instanceof z.ZodError) {
    message = err.issues[0].message;
    status = 400;
  }

  return Response.json({ message: message }, { status: status });
};
