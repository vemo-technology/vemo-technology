import { assertProductionEnvironment } from "@/lib/env";
import { logEvent } from "@/lib/logger";
import type { Instrumentation } from "next";

export function register() {
  const status = assertProductionEnvironment();
  logEvent(status.ok ? "info" : "warn", "application.start", {
    runtime: process.env.NEXT_RUNTIME,
    environment: process.env.NODE_ENV,
    missingCount: status.missing.length,
    invalidCount: status.invalid.length,
  });
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  logEvent("error", "application.request_error", {
    error,
    method: request.method,
    path: request.path,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
  });
};
