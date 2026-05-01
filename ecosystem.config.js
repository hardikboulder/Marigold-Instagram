// PM2 process config for Marigold Studio (Next.js standalone).
// All values flow through process.env — never inline secrets here.
require("dotenv").config({ path: ".env.local" });
require("dotenv").config(); // .env fallback

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || "marigold-studio",
      script: ".next/standalone/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: process.env.PM2_MAX_MEMORY || "1G",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || "3000",
        HOSTNAME: process.env.HOSTNAME || "0.0.0.0",
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        RESEND_API_KEY: process.env.RESEND_API_KEY,
        RESEND_FROM: process.env.RESEND_FROM,
        RESEND_REPLY_TO: process.env.RESEND_REPLY_TO,
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        NVIDIA_API_KEY: process.env.NVIDIA_API_KEY,
      },
    },
  ],
};
