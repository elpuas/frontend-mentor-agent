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
