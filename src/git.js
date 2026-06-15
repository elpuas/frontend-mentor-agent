import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Ejecuta un comando de Git y devuelve su salida como texto limpio.
 *
 * @param {string[]} args Argumentos que se enviarán al binario `git`.
 * @returns {Promise<string>} Salida estándar del comando sin espacios extra.
 * @throws {Error} Lanza un error con contexto si Git falla.
 */
async function runGitCommand(args) {
  try {
    const { stdout } = await execFileAsync("git", args, {
      maxBuffer: 10 * 1024 * 1024
    });

    return stdout.trim();
  } catch (error) {
    throw new Error(
      `Git command failed: git ${args.join(" ")}\n${error.stderr || error.message}`
    );
  }
}

/**
 * Lee el diff completo del último commit para tener contexto de revisión.
 *
 * @returns {Promise<string>} Diff del commit `HEAD`, incluyendo patch y stat.
 */
export async function getLatestCommitDiff() {
  return runGitCommand(["show", "--no-color", "--stat", "--patch", "HEAD"]);
}

/**
 * Obtiene el nombre de la rama actual.
 *
 * @returns {Promise<string>} Nombre de la rama activa.
 */
export async function getCurrentBranch() {
  return runGitCommand(["rev-parse", "--abbrev-ref", "HEAD"]);
}

/**
 * Obtiene el hash corto del último commit.
 *
 * @returns {Promise<string>} Hash corto de `HEAD`.
 */
export async function getLatestCommitHash() {
  return runGitCommand(["rev-parse", "--short", "HEAD"]);
}

/**
 * Obtiene el mensaje completo del último commit.
 *
 * @returns {Promise<string>} Mensaje completo de `HEAD`.
 */
export async function getLatestCommitMessage() {
  return runGitCommand(["log", "-1", "--pretty=%B"]);
}

/**
 * Extrae los archivos modificados a partir de las cabeceras `diff --git`.
 *
 * @param {string} diff Texto completo del diff.
 * @returns {string[]} Lista sin duplicados de archivos modificados.
 */
export function getChangedFilesFromDiff(diff) {
  const changedFiles = new Set();
  const lines = diff.split("\n");

  for (const line of lines) {
    // Las cabeceras del diff se ven así: `diff --git a/ruta b/ruta`.
    // Solo esas líneas nos interesan para descubrir qué archivos cambiaron.
    if (!line.startsWith("diff --git ")) {
      continue;
    }

    const parts = line.split(" ");
    const bPath = parts[3];

    if (!bPath) {
      continue;
    }

    changedFiles.add(bPath.replace(/^b\//, ""));
  }

  return [...changedFiles];
}
