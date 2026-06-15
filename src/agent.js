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
 * Lee el archivo PROJECT_CONTEXT.md desde la raiz del proyecto.
 *
 * @returns {Promise<string>} Contenido del archivo de contexto.
 */
async function readProjectContextFile() {
  const projectContextPath = path.join(rootDir, "PROJECT_CONTEXT.md");
  return fs.readFile(projectContextPath, "utf8");
}

/**
 * Punto de entrada del paso 03.
 * En este paso el agente todavia no usa IA: solo lee identidad y contexto desde archivos.
 *
 * @returns {Promise<void>}
 */
async function main() {
  // AGENTS.md define la identidad del agente:
  // quien es, que rol tiene y como deberia comportarse.
  const agentsInstructions = await readAgentsFile();

  // PROJECT_CONTEXT.md define el contexto del proyecto:
  // que tipo de proyecto es y que clase de informacion necesita saber el agente.
  const projectContext = await readProjectContextFile();

  // Imprimimos primero la identidad del agente.
  console.log(agentsInstructions);

  console.log("");

  // Imprimimos despues el contexto del proyecto para mostrar que son dos capas distintas.
  console.log(projectContext);
}

main();
