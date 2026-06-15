import fetch from "node-fetch";

/**
 * Envía el prompt de revisión al endpoint de Ollama configurado.
 *
 * @param {object} params Parámetros de la solicitud.
 * @param {string} params.ollamaUrl URL del endpoint `/api/generate`.
 * @param {string} params.model Nombre del modelo local.
 * @param {string} params.prompt Prompt final armado por el agente.
 * @returns {Promise<string>} Respuesta del modelo como texto.
 * @throws {Error} Lanza un error claro si la petición falla o el formato es inválido.
 */
export async function requestReviewFromOllama({ ollamaUrl, model, prompt }) {
  try {
    // Esta es la llamada HTTP principal al modelo local.
    // `stream: false` simplifica el taller porque devuelve una sola respuesta JSON.
    const response = await fetch(ollamaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Ollama request failed with status ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();

    // Validamos el formato esperado para evitar que el resto del flujo continúe con datos rotos.
    if (!data.response) {
      throw new Error("Ollama returned an unexpected response format.");
    }

    return data.response.trim();
  } catch (error) {
    // Convertimos errores de conexión en mensajes fáciles de entender para el taller.
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      throw new Error(
        "Could not connect to Ollama. Make sure Ollama is installed, running, and available at the configured OLLAMA_URL."
      );
    }

    if (error.message.includes("ECONNREFUSED") || error.message.includes("ENOTFOUND")) {
      throw new Error(
        "Could not connect to Ollama. Make sure Ollama is installed, running, and available at the configured OLLAMA_URL."
      );
    }

    throw error;
  }
}
