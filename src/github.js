import { Octokit } from "octokit";

/**
 * Valida y separa el repositorio esperado por GitHub en formato owner/repo.
 *
 * @param {string} repo Repositorio en formato `owner/repo`.
 * @returns {{ owner: string, repo: string }} Datos listos para Octokit.
 */
function parseRepository(repo) {
  const [owner, name] = repo.split("/");

  if (!owner || !name) {
    throw new Error(
      'Invalid GITHUB_REPO format. Expected "owner/repo", for example "your-name/frontend-mentor-agent".'
    );
  }

  return { owner, repo: name };
}

/**
 * Crea un GitHub Issue y devuelve su URL.
 *
 * Octokit es el cliente oficial para hablar con la API de GitHub desde Node.js.
 * Lo usamos para que el agente pueda convertir un analisis en una accion persistente.
 *
 * @param {object} params Datos necesarios para crear el issue.
 * @param {string} params.githubToken Token personal de GitHub.
 * @param {string} params.githubRepo Repositorio destino en formato `owner/repo`.
 * @param {string} params.title Titulo del issue.
 * @param {string} params.body Cuerpo del issue.
 * @returns {Promise<string>} URL del issue creado.
 */
export async function createIssue({ githubToken, githubRepo, title, body }) {
  const { owner, repo } = parseRepository(githubRepo);
  const octokit = new Octokit({ auth: githubToken });

  try {
    const response = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body
    });

    return response.data.html_url;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      throw new Error(
        "GitHub rejected the credentials. Check GITHUB_TOKEN and confirm it can create issues in the target repository."
      );
    }

    throw new Error(`Failed to create GitHub Issue: ${error.message}`);
  }
}
