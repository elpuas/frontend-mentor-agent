import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  getCurrentBranch,
  getLatestCommitDiff,
  getLatestCommitHash,
  getLatestCommitMessage,
  getChangedFilesFromDiff
} from "./git.js";
import { requestReviewFromOllama } from "./ollama.js";
import { createReviewIssue } from "./github.js";

// Carga las variables de entorno desde `.env` antes de ejecutar el flujo principal.
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

/**
 * Lee un archivo relativo a la raíz del proyecto.
 *
 * @param {string} relativePath Ruta relativa dentro del repositorio.
 * @returns {Promise<string>} Contenido del archivo como texto UTF-8.
 */
async function readFileFromRoot(relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  return fs.readFile(fullPath, "utf8");
}

/**
 * Obtiene una variable de entorno obligatoria y valida que exista.
 *
 * @param {string} name Nombre de la variable de entorno.
 * @returns {string} Valor limpio de la variable.
 * @throws {Error} Lanza un error si la variable falta o está vacía.
 */
function getRequiredEnvVar(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Copy .env.example to .env and fill in all required values.`
    );
  }

  return value;
}

/**
 * Detecta si el commit cambió archivos HTML o CSS para cargar solo las skills necesarias.
 *
 * @param {string[]} changedFiles Lista de archivos detectados en el diff.
 * @returns {{ hasHtmlChanges: boolean, hasCssChanges: boolean }} Tipos de cambios encontrados.
 */
function detectReviewTargets(changedFiles) {
  const hasHtmlChanges = changedFiles.some((file) => file.endsWith(".html"));
  const hasCssChanges = changedFiles.some((file) => file.endsWith(".css"));

  return {
    hasHtmlChanges,
    hasCssChanges
  };
}

/**
 * Carga las skills de revisión según los tipos de archivo modificados.
 *
 * @param {{ hasHtmlChanges: boolean, hasCssChanges: boolean }} targets Resultado de `detectReviewTargets`.
 * @returns {Promise<{ selectedSkillPaths: string[], skillBlock: string }>} Paths elegidos y bloque listo para el prompt.
 */
async function loadSelectedSkills(targets) {
  // Esta skill siempre se incluye para que el modelo también revise el mensaje del commit.
  const selectedSkillPaths = ["skills/commit-message.md"];

  if (targets.hasHtmlChanges) {
    selectedSkillPaths.push("skills/html-review.md");
    selectedSkillPaths.push("skills/accessibility-review.md");
  }

  if (targets.hasCssChanges) {
    selectedSkillPaths.push("skills/css-review.md");
  }

  const uniqueSkillPaths = [...new Set(selectedSkillPaths)];
  const skillContents = [];

  for (const skillPath of uniqueSkillPaths) {
    const content = await readFileFromRoot(skillPath);
    skillContents.push(`## ${skillPath}\n\n${content}`);
  }

  return {
    selectedSkillPaths: uniqueSkillPaths,
    skillBlock: skillContents.join("\n\n")
  };
}

/**
 * Construye el prompt completo que se enviará al modelo local.
 *
 * El contenido se mantiene en inglés porque suele producir respuestas más estables
 * en modelos base pequeños, pero todo el flujo alrededor está documentado en español.
 *
 * @param {object} params Datos del contexto actual del commit.
 * @param {string} params.agentsInstructions Instrucciones base tomadas de `AGENTS.md`.
 * @param {string} params.projectContext Contexto del proyecto tomado de `PROJECT_CONTEXT.md`.
 * @param {string} params.skillBlock Bloque con las skills seleccionadas.
 * @param {string} params.branch Rama actual.
 * @param {string} params.commitHash Hash corto del commit actual.
 * @param {string} params.commitMessage Mensaje completo del commit.
 * @param {string[]} params.changedFiles Lista de archivos cambiados.
 * @param {string} params.diff Diff completo del commit.
 * @returns {string} Prompt final listo para enviarse a Ollama.
 */
function buildPrompt({
  agentsInstructions,
  projectContext,
  skillBlock,
  branch,
  commitHash,
  commitMessage,
  changedFiles,
  diff
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
 * Extrae la primera línea del mensaje del commit para usarla como título corto.
 *
 * @param {string} commitMessage Mensaje completo del commit.
 * @returns {string} Asunto del commit o un texto por defecto.
 */
function getCommitSubject(commitMessage) {
  return commitMessage.split("\n")[0].trim() || "Untitled commit";
}

/**
 * Ejecuta el flujo completo del agente:
 * 1. valida variables de entorno
 * 2. lee instrucciones y contexto
 * 3. consulta el último commit y su diff
 * 4. selecciona skills
 * 5. pide una revisión a Ollama
 * 6. crea un GitHub Issue con el resultado
 *
 * @returns {Promise<void>}
 */
async function main() {
  try {
    // Valida desde el inicio todo lo necesario para evitar fallos más adelante.
    const ollamaUrl = getRequiredEnvVar("OLLAMA_URL");
    const ollamaModel = getRequiredEnvVar("OLLAMA_MODEL");
    const githubToken = getRequiredEnvVar("GITHUB_TOKEN");
    const githubRepo = getRequiredEnvVar("GITHUB_REPO");

    // Lee en paralelo los archivos de instrucciones y los datos del último commit.
    // Aquí es donde el agente toma el contenido de `AGENTS.md` y `PROJECT_CONTEXT.md`
    // para convertirlos en contexto reutilizable para el modelo.
    const [agentsInstructions, projectContext, branch, commitHash, commitMessage, diff] =
      await Promise.all([
        readFileFromRoot("AGENTS.md"),
        readFileFromRoot("PROJECT_CONTEXT.md"),
        getCurrentBranch(),
        getLatestCommitHash(),
        getLatestCommitMessage(),
        getLatestCommitDiff()
      ]);

    // Analiza el diff para saber qué archivos cambiaron y qué skills conviene cargar.
    // Este paso conecta la lectura del último commit con la lectura del diff.
    const changedFiles = getChangedFilesFromDiff(diff);
    const targets = detectReviewTargets(changedFiles);

    // Selecciona las skills correctas según el tipo de archivos tocados.
    const { selectedSkillPaths, skillBlock } = await loadSelectedSkills(targets);
    const commitSubject = getCommitSubject(commitMessage);

    if (!targets.hasHtmlChanges && !targets.hasCssChanges) {
      console.log("No HTML or CSS files changed in the latest commit.");
      console.log("The agent will still run commit-message review and create an issue.");
    }

    // Arma el prompt final que combina instrucciones, contexto, skills y diff.
    const prompt = buildPrompt({
      agentsInstructions,
      projectContext,
      skillBlock,
      branch,
      commitHash,
      commitMessage,
      changedFiles,
      diff
    });

    console.log("Running local review with Ollama...");
    console.log(`Model: ${ollamaModel}`);
    console.log(`Skills: ${selectedSkillPaths.join(", ")}`);

    // Llama a Ollama para obtener la revisión del commit usando el modelo local configurado.
    const review = await requestReviewFromOllama({
      ollamaUrl,
      model: ollamaModel,
      prompt
    });

    console.log("\n=== AI Review ===\n");
    console.log(review);

    // Prepara el cuerpo del issue con suficiente contexto para revisar luego el resultado.
    const issueBody = `
## Frontend Review

- Branch: ${branch}
- Commit Hash: ${commitHash}
- Commit Message: ${commitMessage}

## Changed Files
${changedFiles.length > 0 ? changedFiles.map((file) => `- ${file}`).join("\n") : "- No files detected"}

## Loaded Skills
${selectedSkillPaths.map((file) => `- ${file}`).join("\n")}

## AI Review

${review}
`.trim();

    // Crea un GitHub Issue para guardar el review como tarea o seguimiento.
    await createReviewIssue({
      githubToken,
      githubRepo,
      title: `Frontend Review: ${commitSubject}`,
      body: issueBody
    });

    console.log("\nGitHub Issue created successfully.");
  } catch (error) {
    console.error("\nAgent failed.");
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
