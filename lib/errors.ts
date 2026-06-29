export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = "APP_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class IntegrationConfigError extends AppError {
  constructor(service: string, missing: string[]) {
    super(`${service} is not configured. Missing: ${missing.join(", ")}`, 503, "INTEGRATION_NOT_CONFIGURED");
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status });
  }

  if (error instanceof Error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ error: "Unexpected error" }, { status: 500 });
}
