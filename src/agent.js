import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getCurrentBranch,
  getChangedFilesFromDiff,
  getLatestCommitDiff,
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
 * Lee un archivo de texto usando una ruta relativa a la raiz del proyecto.
 *
 * @param {string} relativePath Ruta relativa dentro del repositorio.
 * @returns {Promise<string>} Contenido del archivo.
 */
async function readFileFromRoot(relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  return fs.readFile(fullPath, "utf8");
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
 * @param {string[]} params.changedFiles Archivos detectados dentro del diff.
 * @param {string} params.diff Diff completo del ultimo commit.
 * @param {string} params.skillBlock Bloque con las skills seleccionadas.
 * @returns {string} Prompt final listo para usarse en un modelo.
 */
function buildPrompt({
  modelName,
  agentsInstructions,
  projectContext,
  branch,
  commitHash,
  commitMessage,
  changedFiles,
  diff,
  skillBlock
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
- Changed Files:
${changedFiles.map((file) => `  - ${file}`).join("\n")}

# Loaded Skills
${skillBlock}

# Latest Commit Diff
${diff}
`.trim();
}

/**
 * Detecta si el commit modifico archivos HTML o CSS.
 *
 * @param {string[]} changedFiles Lista de archivos cambiados.
 * @returns {{ hasHtmlChanges: boolean, hasCssChanges: boolean }} Tipos de cambios detectados.
 */
function detectReviewTargets(changedFiles) {
  return {
    hasHtmlChanges: changedFiles.some((file) => file.endsWith(".html")),
    hasCssChanges: changedFiles.some((file) => file.endsWith(".css"))
  };
}

/**
 * Carga las skills que aplican al commit actual.
 *
 * Una skill es una instruccion especializada para un tipo de revision concreto.
 * Va separada de `AGENTS.md` porque describe una capacidad puntual, no la identidad general del agente.
 *
 * @param {{ hasHtmlChanges: boolean, hasCssChanges: boolean }} targets Tipos de archivos detectados.
 * @returns {Promise<{ selectedSkillPaths: string[], skillBlock: string }>} Rutas cargadas y bloque listo para el prompt.
 */
async function loadSelectedSkills(targets) {
  const selectedSkillPaths = ["skills/commit-message.md"];

  // Las skills se cargan condicionalmente para no llenar el prompt con instrucciones irrelevantes.
  // Esa especializacion ayuda a que el agente responda con mas foco y mejor calidad.
  if (targets.hasHtmlChanges) {
    selectedSkillPaths.push("skills/html-review.md");
    selectedSkillPaths.push("skills/accessibility-review.md");
  }

  if (targets.hasCssChanges) {
    selectedSkillPaths.push("skills/css-review.md");
  }

  const uniqueSkillPaths = [...new Set(selectedSkillPaths)];
  const contents = [];

  for (const skillPath of uniqueSkillPaths) {
    const content = await readFileFromRoot(skillPath);
    contents.push(`## ${skillPath}\n${content}`);
  }

  return {
    selectedSkillPaths: uniqueSkillPaths,
    skillBlock: contents.join("\n\n")
  };
}

/**
 * Punto de entrada del paso 08.
 * En este paso el agente suma especializacion dinamica usando skills.
 *
 * @returns {Promise<void>}
 */
async function main() {
  const modelName = process.env.MODEL_NAME?.trim() || "mistral";

  // AGENTS.md define la identidad del agente:
  // quien es, que rol tiene y como deberia comportarse.
  const agentsInstructions = await readFileFromRoot("AGENTS.md");

  // PROJECT_CONTEXT.md define el contexto del proyecto:
  // que tipo de proyecto es y que clase de informacion necesita saber el agente.
  const projectContext = await readFileFromRoot("PROJECT_CONTEXT.md");

  // Un agente puede necesitar informacion del repositorio para razonar mejor sobre el cambio actual.
  // La rama da contexto de trabajo, el hash identifica exactamente el commit
  // y el mensaje resume que intentaba hacer la persona que hizo el commit.
  const [branch, commitHash, commitMessage, diff] = await Promise.all([
    getCurrentBranch(),
    getLatestCommitHash(),
    getLatestCommitMessage(),
    getLatestCommitDiff()
  ]);

  // Un diff muestra los cambios concretos del commit.
  // Para un agente de revision esto es clave, porque la metadata sola no le dice que lineas cambiaron.
  const changedFiles = getChangedFilesFromDiff(diff);
  const targets = detectReviewTargets(changedFiles);
  const { selectedSkillPaths, skillBlock } = await loadSelectedSkills(targets);

  // Un prompt es el texto completo que luego recibira un modelo.
  // Aqui lo armamos a partir de varias fuentes para que cada parte tenga una responsabilidad clara.
  const prompt = buildPrompt({
    modelName,
    agentsInstructions,
    projectContext,
    branch,
    commitHash,
    commitMessage,
    changedFiles,
    diff,
    skillBlock
  });

  // Separamos identidad y contexto porque no significan lo mismo:
  // la identidad explica como debe comportarse el agente,
  // y el contexto explica sobre que proyecto debe razonar.

  console.log(`Branch: ${branch}`);
  console.log(`Latest Commit Hash: ${commitHash}`);
  console.log(`Latest Commit Message: ${commitMessage}`);
  console.log("Changed Files:");
  for (const file of changedFiles) {
    console.log(`- ${file}`);
  }
  console.log("Selected Skills:");
  for (const skillPath of selectedSkillPaths) {
    console.log(`- ${skillPath}`);
  }
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
