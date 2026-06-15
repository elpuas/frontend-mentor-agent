import { Octokit } from "octokit";

/**
 * Divide el valor `owner/repo` en las partes que necesita la API de GitHub.
 *
 * @param {string} repo Repositorio en formato `owner/repo`.
 * @returns {{ owner: string, repo: string }} Datos listos para Octokit.
 * @throws {Error} Lanza un error si el formato es inválido.
 */
function parseRepo(repo) {
  const [owner, name] = repo.split("/");

  if (!owner || !name) {
    throw new Error(
      'Invalid GITHUB_REPO format. Expected "owner/repo", for example "your-name/frontend-mentor-agent".'
    );
  }

  return { owner, repo: name };
}

/**
 * Crea un GitHub Issue con el review generado por el agente.
 *
 * @param {object} params Parámetros de creación del issue.
 * @param {string} params.githubToken Token personal de GitHub.
 * @param {string} params.githubRepo Repositorio destino en formato `owner/repo`.
 * @param {string} params.title Título del issue.
 * @param {string} params.body Contenido completo del issue.
 * @returns {Promise<void>}
 * @throws {Error} Lanza un error claro si GitHub rechaza la petición.
 */
export async function createReviewIssue({ githubToken, githubRepo, title, body }) {
  const { owner, repo } = parseRepo(githubRepo);
  const octokit = new Octokit({ auth: githubToken });

  try {
    // Guardamos el review en GitHub para que el feedback no se pierda en la terminal.
    await octokit.issues.create({
      owner,
      repo,
      title,
      body
    });
  } catch (error) {
    throw new Error(`Failed to create GitHub Issue: ${error.message}`);
  }
}
