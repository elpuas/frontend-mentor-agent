# frontend-mentor-agent

`frontend-mentor-agent` es un repositorio de taller para aprender, paso a paso, cómo conectar un agente local de IA con Git, Ollama y GitHub.

La idea no es construir un sistema complejo. La idea es entender un flujo completo y pequeño:

1. haces un commit
2. Husky ejecuta un hook local
3. el agente lee el último diff
4. el agente selecciona skills según los archivos cambiados
5. Ollama genera un review
6. el proyecto guarda ese review en un GitHub Issue

## Objetivo del taller

Al terminar el taller, la persona participante debería poder:

- explicar qué hace cada archivo del proyecto
- ejecutar el agente manualmente
- entender cómo el agente lee contexto y diffs
- modificar una skill sin romper el flujo
- diagnosticar errores comunes de entorno

## Conceptos clave en español simple

### ¿Qué es un agente?

Un agente es un programa que sigue una serie de pasos para resolver una tarea. En este repositorio, la tarea es revisar el último commit de frontend.

### ¿Qué es una skill?

Una skill es un archivo de instrucciones pequeñas y especializadas. Le dice al modelo en qué fijarse. Por ejemplo, una skill puede pedir que revise HTML semántico o problemas de accesibilidad.

### ¿Qué es el contexto?

El contexto es la información que el modelo recibe antes de responder. Aquí incluye:

- las instrucciones de `AGENTS.md`
- las restricciones de `PROJECT_CONTEXT.md`
- las skills cargadas
- el mensaje del commit
- la lista de archivos cambiados
- el diff del commit

### ¿Qué es un diff?

Un diff es la comparación entre una versión anterior y una nueva de un archivo. Git lo usa para mostrar qué líneas se agregaron, quitaron o cambiaron.

## Requisitos

- Node.js 20 o superior
- Git instalado
- una carpeta que realmente sea un repositorio Git
- Ollama instalado y ejecutándose localmente
- el modelo `mistral` descargado, o cualquier otro modelo configurado en `.env`
- un token de GitHub con permisos para crear issues

## Instalación paso a paso

### 1. Instalar dependencias

```bash
npm install
```

### 2. Preparar Husky

```bash
npm run prepare
```

### 3. Instalar Ollama

Descárgalo desde [ollama.com/download](https://ollama.com/download).

### 4. Descargar el modelo local

```bash
ollama pull mistral
```

Si vas a usar otro modelo, cambia `OLLAMA_MODEL` en `.env`.

### 5. Crear el archivo `.env`

```bash
cp .env.example .env
```

Luego completa estas variables:

- `OLLAMA_URL`
- `OLLAMA_MODEL`
- `GITHUB_TOKEN`
- `GITHUB_REPO`

Ejemplo de `GITHUB_REPO`:

```text
tu-usuario/frontend-mentor-agent
```

## Cómo ejecutar el agente

### Opción 1: Manual

```bash
node src/agent.js
```

Esta es la mejor opción para enseñar, porque deja ver el flujo sin depender de un commit real en ese momento.

### Opción 2: Automática con Git

Después de instalar Husky, cada commit ejecuta este hook:

```bash
.husky/post-commit
```

Ese hook dispara:

```bash
node src/agent.js
```

## Flujo del agente paso a paso

### Paso 1. Cargar variables de entorno

El agente valida que existan `OLLAMA_URL`, `OLLAMA_MODEL`, `GITHUB_TOKEN` y `GITHUB_REPO`.

Si falta alguna, termina con un error claro.

### Paso 2. Leer instrucciones base

El agente lee:

- `AGENTS.md`
- `PROJECT_CONTEXT.md`

Estos archivos forman parte del prompt que recibe el modelo.

### Paso 3. Leer el último commit

El agente consulta Git para obtener:

- rama actual
- hash corto
- mensaje del commit
- diff completo de `HEAD`

### Paso 4. Detectar archivos cambiados

El agente revisa el diff y extrae los paths modificados.

### Paso 5. Seleccionar skills

Según los archivos encontrados:

- siempre carga `skills/commit-message.md`
- si hay HTML, carga `skills/html-review.md`
- si hay HTML, también carga `skills/accessibility-review.md`
- si hay CSS, carga `skills/css-review.md`

### Paso 6. Construir el prompt

El agente combina contexto, skills, metadatos del commit y diff en un solo texto.

El prompt principal permanece en inglés porque eso suele dar respuestas más consistentes en modelos locales pequeños, pero el código y la documentación del taller explican ese paso en español.

### Paso 7. Llamar a Ollama

El proyecto hace una petición HTTP local a Ollama y espera una respuesta completa con `stream: false`.

### Paso 8. Mostrar el review

La respuesta se imprime en la terminal para poder verla de inmediato.

### Paso 9. Crear el GitHub Issue

El review se guarda como issue para que el feedback no quede perdido solo en la terminal.

## Mapa del repositorio

### Archivos principales

- `README.md`: guía completa del taller y referencia del flujo.
- `AGENTS.md`: instrucciones base del agente que se envían al modelo.
- `PROJECT_CONTEXT.md`: contexto y límites del proyecto para el modelo.
- `.env.example`: ejemplo de variables de entorno necesarias.
- `package.json`: scripts, dependencias y versión mínima de Node.

### Carpeta `src/`

- `src/agent.js`: flujo principal del agente.
- `src/git.js`: helpers para leer rama, hash, mensaje y diff desde Git.
- `src/ollama.js`: helper para enviar el prompt al modelo local.
- `src/github.js`: helper para crear el issue en GitHub.

### Carpeta `skills/`

- `skills/html-review.md`: guía de revisión para HTML.
- `skills/css-review.md`: guía de revisión para CSS.
- `skills/accessibility-review.md`: recordatorios de accesibilidad.
- `skills/commit-message.md`: revisión del mensaje del commit.

### Carpeta `examples/`

- `examples/index.html`: archivo simple para practicar cambios de HTML.
- `examples/styles.css`: archivo simple para practicar cambios de CSS.

### Carpeta `.husky/`

- `.husky/post-commit`: hook que ejecuta el agente después de cada commit.

## Modo taller

Usa este orden exacto para enseñar el proyecto:

1. Mostrar la estructura del repositorio.
2. Explicar `README.md`, `AGENTS.md` y `PROJECT_CONTEXT.md`.
3. Abrir `src/agent.js` y recorrer la función `main`.
4. Abrir `src/git.js` y explicar cómo se lee el último commit.
5. Abrir `src/ollama.js` y explicar la llamada al modelo local.
6. Abrir `src/github.js` y explicar cómo se crea el issue.
7. Revisar la carpeta `skills/` y explicar por qué cada skill es pequeña.
8. Mostrar `.env.example` y completar `.env`.
9. Ejecutar `node src/agent.js`.
10. Hacer un cambio pequeño en `examples/`.
11. Crear un commit.
12. Observar el hook `.husky/post-commit`.
13. Leer el review en la terminal.
14. Abrir GitHub y verificar el issue creado.
15. Hacer uno o dos cambios de práctica en una skill para mostrar cómo cambia el review.

## Errores comunes y cómo resolverlos

### Ollama no está corriendo

Síntoma:
El agente muestra un error de conexión a `OLLAMA_URL`.

Solución:

1. abrir la app de Ollama o iniciar el servicio
2. confirmar que responde con `ollama list`
3. volver a ejecutar `node src/agent.js`

### Mistral no está instalado

Síntoma:
Ollama responde que el modelo no existe.

Solución:

```bash
ollama pull mistral
```

O cambiar `OLLAMA_MODEL` por un modelo que sí exista localmente.

### Falta el archivo `.env`

Síntoma:
El agente falla con `Missing environment variable`.

Solución:

```bash
cp .env.example .env
```

Luego completar todas las variables obligatorias.

### El token de GitHub es inválido

Síntoma:
La creación del issue falla aunque Ollama respondió bien.

Solución:

1. generar un token nuevo
2. verificar permisos para crear issues
3. revisar que `GITHUB_TOKEN` esté bien copiado en `.env`

### El hook de Husky no corre

Síntoma:
Haces un commit y no pasa nada.

Solución:

1. ejecutar `npm run prepare`
2. confirmar que existe `.husky/post-commit`
3. revisar que el repositorio tenga hooks habilitados

### Node no se encuentra dentro del hook

Síntoma:
El commit corre el hook pero falla con `node: command not found`.

Solución:

1. confirmar `node --version` en la terminal
2. abrir la configuración del shell usada por Git
3. si hace falta, usar una ruta absoluta a Node dentro del hook o ajustar el `PATH`

### La carpeta no es un repositorio Git real

Síntoma:
El agente falla al leer `HEAD` o Git responde `not a git repository`.

Solución:

1. confirmar que existe la carpeta `.git`
2. abrir el proyecto correcto o clonarlo otra vez
3. ejecutar el agente dentro del repositorio, no en una copia suelta de archivos

## Ejercicio guiado de demo

1. Ejecuta `node src/agent.js` para comprobar que el entorno está listo.
2. Cambia un texto en `examples/index.html`.
3. Haz un commit con un mensaje simple.
4. Lee el review generado.
5. Busca el issue en GitHub.
6. Cambia algo en `examples/styles.css`.
7. Haz otro commit y compara el review con el anterior.

## Retos del taller

### Principiante

- Cambiar el modelo de Ollama.
- Editar una skill.
- Cambiar el título del issue.

### Intermedio

- Agregar una skill para JavaScript.
- Guardar el review en `agent-log.md`.
- Crear issues solo si el agente encontró problemas.

### Avanzado

- Revisar varios commits.
- Generar changelog.
- Revisar pull requests.

## Decisiones de diseño del proyecto

- El código es corto a propósito para que se pueda explicar en una sola sesión.
- Las funciones están separadas por responsabilidad, no por complejidad.
- El prompt se construye en un solo lugar para que sea fácil inspeccionarlo.
- Las skills viven en archivos separados para que el taller pueda modificarlas sin tocar la lógica principal.

## Sugerencias para enseñar mejor

- Mostrar primero el flujo completo antes de explicar detalles internos.
- Ejecutar el agente manualmente antes de depender del hook de Git.
- Hacer cambios pequeños en HTML y CSS para que el diff sea fácil de leer.
- Comparar dos reviews para mostrar cómo influyen las skills.
