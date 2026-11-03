import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  basePath: process.env.GITHUB_PAGES === "true" ? "/field-service-platform-assessment" : "",
  trailingSlash: true,
  images: { unoptimized: true },
};
export default config;
