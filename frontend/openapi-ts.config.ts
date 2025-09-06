import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "http://localhost:8000/api/openapi.json",
  output: { path: "services" },
  experimentalParser: true,
  plugins: [
  "legacy/fetch",
  {
    name: "@hey-api/typescript",
    enums: "javascript",
  },
  {
    name: "@hey-api/sdk",
    asClass: true,
    operationId: true,
  },
  "zod",
],
});