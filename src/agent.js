import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getCurrentBranch,
  getLatestCommitHash,
  getLatestCommitMessage
} from "./git.js";
import { requestFromOllama } from "./ollama.js";

// Carga variables desde `.env` para que el proyecto pueda configurarse sin tocar el codigo.
dotenv.config();

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
 * Construye el prompt final combinando identidad del agente y contexto del proyecto.
 *
 * @param {object} params Datos necesarios para armar el prompt.
 * @param {string} params.modelName Nombre del modelo configurado en el entorno.
 * @param {string} params.agentsInstructions Instrucciones base del agente.
 * @param {string} params.projectContext Contexto del proyecto actual.
 * @param {string} params.branch Rama actual del repositorio.
 * @param {string} params.commitHash Hash corto del commit mas reciente.
 * @param {string} params.commitMessage Mensaje del commit mas reciente.
 * @returns {string} Prompt final listo para usarse en un modelo.
 */
function buildPrompt({
  modelName,
  agentsInstructions,
  projectContext,
  branch,
  commitHash,
  commitMessage
}) {
  return `
Model: ${modelName}

# Agent Identity
${agentsInstructions}

# Project Context
${projectContext}

# Git Metadata
- Branch: ${branch}
- Latest Commit Hash: ${commitHash}
- Latest Commit Message: ${commitMessage}
`.trim();
}

/**
 * Punto de entrada del paso 06.
 * En este paso el agente gana conciencia basica del repositorio usando metadatos de Git.
 *
 * @returns {Promise<void>}
 */
async function main() {
  const modelName = process.env.MODEL_NAME?.trim() || "mistral";

  // AGENTS.md define la identidad del agente:
  // quien es, que rol tiene y como deberia comportarse.
  const agentsInstructions = await readAgentsFile();

  // PROJECT_CONTEXT.md define el contexto del proyecto:
  // que tipo de proyecto es y que clase de informacion necesita saber el agente.
  const projectContext = await readProjectContextFile();

  // Un agente puede necesitar informacion del repositorio para razonar mejor sobre el cambio actual.
  // La rama da contexto de trabajo, el hash identifica exactamente el commit
  // y el mensaje resume que intentaba hacer la persona que hizo el commit.
  const [branch, commitHash, commitMessage] = await Promise.all([
    getCurrentBranch(),
    getLatestCommitHash(),
    getLatestCommitMessage()
  ]);

  // Un prompt es el texto completo que luego recibira un modelo.
  // Aqui lo armamos a partir de varias fuentes para que cada parte tenga una responsabilidad clara.
  const prompt = buildPrompt({
    modelName,
    agentsInstructions,
    projectContext,
    branch,
    commitHash,
    commitMessage
  });

  // Separamos identidad y contexto porque no significan lo mismo:
  // la identidad explica como debe comportarse el agente,
  // y el contexto explica sobre que proyecto debe razonar.

  console.log(`Branch: ${branch}`);
  console.log(`Latest Commit Hash: ${commitHash}`);
  console.log(`Latest Commit Message: ${commitMessage}`);
  console.log("");

  // Enviamos el prompt completo al modelo local.
  // El modelo procesa ese texto y devuelve una respuesta generada.
  const response = await requestFromOllama({
    modelName,
    prompt
  });

  console.log(response);
}

main().catch((error) => {
  console.error("Agent failed.");
  console.error(error.message);
  process.exitCode = 1;
});
