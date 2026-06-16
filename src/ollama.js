import fetch from "node-fetch";

const OLLAMA_URL = "http://localhost:11434/api/generate";

/**
 * Envia un prompt a Ollama y devuelve la respuesta del modelo.
 *
 * @param {object} params Datos necesarios para la consulta.
 * @param {string} params.modelName Nombre del modelo local.
 * @param {string} params.prompt Prompt final que recibira el modelo.
 * @returns {Promise<string>} Respuesta del modelo como texto.
 */
export async function requestFromOllama({ modelName, prompt }) {
  try {
    // Ollama es un servidor local que ejecuta modelos en la propia computadora.
    // Lo usamos para hacer inferencia local sin depender de servicios en la nube.
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();

      if (response.status === 404) {
        throw new Error(
          `The Ollama model "${modelName}" was not found. Install it first with: ollama pull ${modelName}`
        );
      }

      throw new Error(`Ollama request failed with status ${response.status}: ${errorText}`);
    }

    // La respuesta vuelve en JSON y debe incluir la propiedad `response`.
    const data = await response.json();

    if (typeof data.response !== "string") {
      throw new Error("Ollama returned an invalid response format.");
    }

    return data.response.trim();
  } catch (error) {
    const nestedCode = error.cause?.code;
    const message = error.message || "";

    // Si Ollama no esta corriendo, fetch falla antes de obtener una respuesta HTTP valida.
    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ENOTFOUND" ||
      nestedCode === "ECONNREFUSED" ||
      nestedCode === "ENOTFOUND"
    ) {
      throw new Error(
        "Could not connect to Ollama. Make sure Ollama is installed and running on http://localhost:11434."
      );
    }

    if (
      message.includes("ECONNREFUSED") ||
      message.includes("ENOTFOUND") ||
      message.includes("request to http://localhost:11434/api/generate failed")
    ) {
      throw new Error(
        "Could not connect to Ollama. Make sure Ollama is installed and running on http://localhost:11434."
      );
    }

    throw error;
  }
}
