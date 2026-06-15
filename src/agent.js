import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

/**
 * Lee el archivo AGENTS.md desde la raiz del proyecto.
 *
 * @returns {Promise<string>} Contenido del archivo de instrucciones.
 */
async function readAgentsFile() {
  const agentsPath = path.join(rootDir, "AGENTS.md");
  return fs.readFile(agentsPath, "utf8");
}

/**
 * Punto de entrada del paso 02.
 * En este paso el agente todavia no usa IA: solo lee su identidad desde un archivo.
 *
 * @returns {Promise<void>}
 */
async function main() {
  // Leemos AGENTS.md para mostrar que el comportamiento del agente puede vivir fuera del codigo.
  const agentsInstructions = await readAgentsFile();

  // Imprimimos el contenido completo para confirmar que el archivo fue cargado correctamente.
  console.log(agentsInstructions);
}

main();
