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
import { createIssue } from "./github.js";
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
 * Obtiene el modelo configurado y aplica una validacion minima.
 *
 * @returns {string} Nombre del modelo que usara Ollama.
 */
function getModelName() {
  const value = process.env.MODEL_NAME?.trim();
  return value || "mistral";
}

/**
 * Obtiene una variable de entorno obligatoria cuando una accion externa la necesita.
 *
 * @param {string} name Nombre de la variable requerida.
 * @returns {string} Valor validado.
 */
function getRequiredEnvVar(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing environment variable: ${name}. Update .env before running this step.`);
  }

  return value;
}

/**
 * Construye el prompt final de revision usando contexto, skills y datos reales del commit.
 *
 * @param {object} params Datos necesarios para armar el prompt.
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
You are reviewing the latest frontend commit in a workshop repository.

# AGENTS.md
${agentsInstructions}

# PROJECT_CONTEXT.md
${projectContext}

# Loaded Skills
${skillBlock}

# Latest Commit Metadata
- Branch: ${branch}
- Commit Hash: ${commitHash}
- Commit Message: ${commitMessage}
- Changed Files:
${changedFiles.map((file) => `  - ${file}`).join("\n")}

# Latest Commit Diff
${diff}

# Task
Review this commit using the loaded skills.

Requirements:
- Focus on HTML, CSS, accessibility, and commit quality based on the loaded skills.
- Be concise but useful.
- Use beginner-friendly language.
- If nothing is wrong, say that clearly.
- Format the review with these sections:
  1. Summary
  2. Good Changes
  3. Problems Found
  4. Suggested Next Steps
`.trim();
}

/**
 * Extrae la primera linea del mensaje del commit para usarla como titulo corto.
 *
 * @param {string} commitMessage Mensaje completo del commit.
 * @returns {string} Asunto del commit o un texto por defecto.
 */
function getCommitSubject(commitMessage) {
  return commitMessage.split("\n")[0].trim() || "Untitled commit";
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
  // Esta skill siempre se incluye para que el modelo tambien revise el mensaje del commit.
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
    contents.push(`## ${skillPath}\n\n${content}`);
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
  const modelName = getModelName();

  // AGENTS.md define la identidad del agente:
  // quien es, que rol tiene y como deberia comportarse.
  // PROJECT_CONTEXT.md define el contexto del proyecto:
  // que tipo de proyecto es y que clase de informacion necesita saber el agente.
  // Leer ambos archivos por separado permite cambiar identidad y contexto sin tocar la logica.
  const [agentsInstructions, projectContext, branch, commitHash, commitMessage, diff] =
    await Promise.all([
      readFileFromRoot("AGENTS.md"),
      readFileFromRoot("PROJECT_CONTEXT.md"),
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

  if (!targets.hasHtmlChanges && !targets.hasCssChanges) {
    console.log("No HTML or CSS files changed in the latest commit.");
    console.log("The agent will still run commit-message review.");
  }

  // Un prompt es el texto completo que luego recibira un modelo.
  // Aqui lo armamos a partir de varias fuentes para que cada parte tenga una responsabilidad clara.
  const prompt = buildPrompt({
    agentsInstructions,
    projectContext,
    branch,
    commitHash,
    commitMessage,
    changedFiles,
    diff,
    skillBlock
  });

  // Mostramos la informacion que ya conoce el agente antes de llamar al modelo.
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
  console.log(`Model: ${modelName}`);
  console.log("");

  // Enviamos el prompt completo al modelo local.
  // El modelo procesa ese texto y devuelve una respuesta generada.
  const response = await requestFromOllama({
    modelName,
    prompt
  });

  console.log("\n=== AI Review ===\n");
  console.log(response);

  // GitHub Issues son una forma simple de persistir el resultado del agente.
  // El analisis ocurre primero; la accion externa sucede al final, cuando ya existe un resultado util.
  const githubToken = getRequiredEnvVar("GITHUB_TOKEN");
  const githubRepo = getRequiredEnvVar("GITHUB_REPO");
  const commitSubject = getCommitSubject(commitMessage);

  const issueBody = `
## Frontend Review

- Branch: ${branch}
- Commit Hash: ${commitHash}
- Commit Message: ${commitMessage}

## Changed Files
${changedFiles.length > 0 ? changedFiles.map((file) => `- ${file}`).join("\n") : "- No files detected"}

## Selected Skills
${selectedSkillPaths.map((file) => `- ${file}`).join("\n")}

## AI Review

${response}
`.trim();

  // Las acciones suelen ser el ultimo paso del flujo del agente:
  // primero entiende el contexto y genera una conclusion, y solo despues modifica un sistema externo.
  const issueUrl = await createIssue({
    githubToken,
    githubRepo,
    title: `Frontend Review: ${commitSubject}`,
    body: issueBody
  });

  console.log("\nCreated GitHub Issue:");
  console.log(issueUrl);
}

main().catch((error) => {
  console.error("Agent failed.");
  console.error(error.message);
  process.exitCode = 1;
});
