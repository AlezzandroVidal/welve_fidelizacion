// Este script se ejecuta una sola vez cuando el contenedor de Mongo
// arranca por primera vez (solo si el volumen está vacío).
// Crea la base de datos 'welve' y un usuario de aplicación con permisos
// limitados (readWrite sobre 'welve' únicamente).

db = db.getSiblingDB("welve");

db.createUser({
  user: process.env.MONGO_APP_USER || "welve_app",
  pwd: process.env.MONGO_APP_PASSWORD || "changeme_app",
  roles: [{ role: "readWrite", db: "welve" }],
});

// Colección inicial para que la base de datos exista
db.createCollection("_init");
print("✅  Base de datos 'welve' y usuario de aplicación creados.");
