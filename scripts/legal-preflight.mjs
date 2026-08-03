const required = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "OFERTALAB_LEGAL_ALLOWED_EMAILS",
  "OFERTALAB_LEGAL_ADMIN_EMAILS",
];

const optional = ["OFERTALAB_LEGAL_TOKEN", "OFERTALAB_SYNC_TOKEN"];

function present(name) {
  return Boolean(String(process.env[name] || "").trim());
}

function line(label, ok, detail) {
  const marker = ok ? "OK" : "MISS";
  console.log(`${marker}  ${label}${detail ? ` - ${detail}` : ""}`);
}

console.log("Mesa Legal preflight\n");

let failures = 0;

for (const name of required) {
  const ok = present(name);
  line(name, ok, ok ? "configurado" : "definir antes de migrar o iniciar login interno");
  if (!ok) failures += 1;
}

for (const name of optional) {
  const ok = present(name);
  line(name, ok, ok ? "configurado" : "opcional si otro token cubre la sincronizacion");
}

const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
line(
  "Supabase URL format",
  !supabaseUrl || /^https:\/\/.+\.supabase\.co$/i.test(supabaseUrl),
  supabaseUrl ? "revise dominio si no es el proyecto correcto" : "sin validar por falta de valor",
);

const databaseUrl = String(process.env.DATABASE_URL || "").trim();
line(
  "DATABASE_URL format",
  !databaseUrl || databaseUrl.startsWith("postgresql://"),
  databaseUrl ? "debe usar connection string Postgres/Supabase" : "sin validar por falta de valor",
);

console.log("\nMigraciones esperadas");
["0002_flippant_the_order.sql", "0003_opposite_firebrand.sql", "0004_strange_lord_tyger.sql"].forEach((file) => {
  line(file, true, "debe aplicarse en orden con drizzle-kit migrate");
});

console.log("\nSiguiente comando");
console.log("npm run db:migrate");

if (failures > 0) {
  console.error(`\nFaltan ${failures} variable(s) obligatoria(s).`);
  process.exitCode = 1;
}