import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Ejecuta un comando de Git y devuelve su salida como texto.
 *
 * @param {string[]} args Argumentos enviados al binario `git`.
 * @returns {Promise<string>} Salida limpia del comando.
 */
async function runGitCommand(args) {
  const { stdout } = await execFileAsync("git", args);
  return stdout.trim();
}

/**
 * Obtiene el nombre de la rama actual.
 *
 * La rama puede ser util para que el agente entienda en que linea de trabajo esta parado.
 *
 * @returns {Promise<string>} Nombre de la rama activa.
 */
export async function getCurrentBranch() {
  return runGitCommand(["rev-parse", "--abbrev-ref", "HEAD"]);
}

/**
 * Obtiene el hash corto del commit mas reciente.
 *
 * Un commit hash es el identificador unico de un commit dentro del historial de Git.
 *
 * @returns {Promise<string>} Hash corto del commit actual.
 */
export async function getLatestCommitHash() {
  return runGitCommand(["rev-parse", "--short", "HEAD"]);
}

/**
 * Obtiene el mensaje del commit mas reciente.
 *
 * El commit message resume que cambio hizo la persona en ese punto del historial.
 *
 * @returns {Promise<string>} Mensaje completo del ultimo commit.
 */
export async function getLatestCommitMessage() {
  return runGitCommand(["log", "-1", "--pretty=%B"]);
}

/**
 * Obtiene el diff completo del commit mas reciente.
 *
 * Un diff es la representacion textual de los cambios guardados en un commit.
 * Git almacena las modificaciones comparando versiones de archivos y mostrando
 * que lineas se agregaron, eliminaron o cambiaron.
 *
 * @returns {Promise<string>} Diff completo de `HEAD`, incluyendo stat y patch.
 */
export async function getLatestCommitDiff() {
  return runGitCommand(["show", "--no-color", "--stat", "--patch", "HEAD"]);
}

/**
 * Extrae los archivos modificados a partir de las cabeceras del diff.
 *
 * La metadata del commit ayuda, pero no alcanza para revisar codigo:
 * el diff le muestra al agente los cambios reales sobre los que debe razonar.
 *
 * @param {string} diff Texto completo del diff.
 * @returns {string[]} Lista unica de archivos cambiados.
 */
export function getChangedFilesFromDiff(diff) {
  const changedFiles = new Set();
  const lines = diff.split("\n");

  for (const line of lines) {
    // Las cabeceras `diff --git a/ruta b/ruta` indican el inicio de cada archivo modificado.
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
