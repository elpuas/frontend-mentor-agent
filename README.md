# frontend-mentor-agent

`frontend-mentor-agent` es un repositorio de taller para aprender, paso a paso, cómo construir un agente local que revisa commits de frontend y guarda su review en GitHub.

La implementación de esta rama es la versión probada del taller. La idea no es enseñar un sistema abstracto, sino recorrer un flujo real, pequeño y entendible de principio a fin.

## Objetivo del taller

Al terminar el taller, la persona participante debería poder:

- explicar qué hace cada archivo principal del proyecto
- entender cómo un agente combina identidad, contexto, skills y diff
- ejecutar el agente manualmente
- automatizar su ejecución con Husky
- diagnosticar errores comunes de entorno
- extender el agente con cambios pequeños y controlados

## Flujo final

```text
Developer
↓
git commit
↓
Husky
↓
Frontend Mentor Agent
↓
Git Diff
↓
Skills
↓
Ollama
↓
GitHub Issue
```

## Progresión por ramas

Estas ramas están pensadas para enseñar una idea nueva por paso:

1. `step-01-project-setup`
2. `step-02-agents-md`
3. `step-03-project-context`
4. `step-04-first-agent`
5. `step-05-ollama-integration`
6. `step-06-git-metadata`
7. `step-07-git-diff`
8. `step-08-skills`
9. `step-09-github-issues`
10. `step-10-husky-automation`
11. `step-11-final-polish`

Cada rama construye sobre la anterior y mantiene cambios mínimos entre pasos.

## Qué significa cada pieza

### AGENTS.md

Define la identidad base del agente:

- qué tipo de agente es
- qué debe revisar
- cómo debe responder

### PROJECT_CONTEXT.md

Define el contexto del proyecto:

- qué clase de repositorio es
- qué nivel de complejidad conviene usar
- qué alcance tiene la revisión

### skills/

Contiene instrucciones especializadas que solo se cargan cuando hacen falta.

Ejemplos:

- revisión de HTML
- revisión de CSS
- revisión de accesibilidad
- revisión del mensaje del commit

### Git metadata

Le da al agente contexto del commit actual:

- rama
- hash
- mensaje del commit

### Git diff

Le muestra al agente el cambio real del código.

Sin diff, el review sería demasiado genérico.

## Estructura del repositorio

- `AGENTS.md`: identidad base del agente.
- `PROJECT_CONTEXT.md`: contexto del proyecto revisado.
- `.env.example`: variables de entorno necesarias.
- `package.json`: dependencias y scripts.
- `.husky/post-commit`: automatización del agente después de cada commit.
- `src/agent.js`: flujo principal del agente.
- `src/git.js`: lectura de metadata y diff desde Git.
- `src/ollama.js`: comunicación con Ollama.
- `src/github.js`: creación de GitHub Issues.
- `skills/`: instrucciones especializadas por tipo de revisión.

## Herramientas requeridas

- Node.js 20 o superior
- Git
- Ollama
- el modelo `mistral` descargado localmente
- una cuenta de GitHub
- un Personal Access Token con permisos para crear issues

## Instalación

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

### 4. Descargar Mistral

```bash
ollama pull mistral
```

### 5. Crear `.env`

```bash
cp .env.example .env
```

Configura estas variables:

```text
MODEL_NAME=mistral
GITHUB_TOKEN=tu_token
GITHUB_REPO=tu-usuario/tu-repo
```

## Configuración de `.env`

### MODEL_NAME

Es el modelo local que usará Ollama.

Valor recomendado para el taller:

```text
MODEL_NAME=mistral
```

### GITHUB_TOKEN

Es un Personal Access Token de GitHub.

Para este taller, lo más seguro es usar una cuenta personal y un repositorio de prueba.

### GITHUB_REPO

Debe usar este formato:

```text
owner/repo
```

Ejemplo:

```text
tu-usuario/frontend-mentor-agent-pruebas
```

## Cómo funciona el agente

Cuando corre `src/agent.js`, el flujo es este:

1. carga variables de entorno
2. lee `AGENTS.md`
3. lee `PROJECT_CONTEXT.md`
4. lee la metadata del último commit
5. lee el diff del último commit
6. detecta archivos cambiados
7. selecciona skills según esos archivos
8. construye el prompt final
9. envía el prompt a Ollama
10. recibe el review
11. crea un GitHub Issue

## Ejecución manual

Puedes correr el agente manualmente con:

```bash
node src/agent.js
```

También puedes usar:

```bash
npm start
```

Esto es útil para:

- aprender el flujo
- depurar errores
- probar cambios antes de crear commits

## Automatización con Husky

Después de instalar Husky, Git ejecuta el hook:

```text
.husky/post-commit
```

Ese hook:

1. verifica que `node` exista
2. corre `node src/agent.js`
3. sale de forma segura si Node.js no está disponible

### Qué pasa después de `git commit`

Cuando haces:

```bash
git commit -m "test"
```

el flujo esperado es:

1. Git crea el commit
2. Husky ejecuta `post-commit`
3. el agente lee contexto, metadata y diff
4. Ollama genera un review
5. el review se guarda como issue

### Cómo desactivar hooks temporalmente

Si necesitas saltarte Husky en un commit puntual:

```bash
git commit --no-verify -m "test"
```

### Diferencia entre ejecución manual y automática

Manual:

- tú disparas el agente
- útil para pruebas y aprendizaje

Automática:

- Git dispara el agente por ti
- útil para integrar el flujo al trabajo diario

## Cómo probar de forma segura

La forma más segura de probar el paso final es esta:

1. usar un repositorio personal de pruebas en GitHub
2. configurar `GITHUB_TOKEN` y `GITHUB_REPO`
3. confirmar que Ollama está corriendo
4. confirmar que `mistral` está instalado
5. ejecutar manualmente `node src/agent.js`
6. confirmar que se crea un issue real
7. hacer un commit de prueba para validar Husky

## Solución de problemas

### Ollama no está corriendo

Síntoma:
El agente falla antes de generar el review.

Verifica:

```bash
ollama list
```

o:

```bash
curl http://localhost:11434
```

### Mistral no está instalado

Síntoma:
Ollama responde que el modelo no existe.

Solución:

```bash
ollama pull mistral
```

### Falta `.env`

Síntoma:
El agente falla por variables faltantes.

Solución:

```bash
cp .env.example .env
```

### GITHUB_REPO tiene formato inválido

Síntoma:
El agente falla al intentar crear el issue.

Formato correcto:

```text
owner/repo
```

### GITHUB_TOKEN es inválido

Síntoma:
GitHub rechaza la creación del issue.

Solución:

- generar un token nuevo
- revisar permisos
- probar con un repositorio propio

### Husky no corre

Síntoma:
Haces un commit y el agente no se ejecuta.

Prueba:

```bash
npm run prepare
sh .husky/post-commit
```

### Node no está disponible dentro del hook

Síntoma:
El hook imprime:

```text
Skipping Frontend Mentor Agent: Node.js is not available.
```

Solución:

- confirmar `node --version`
- revisar el `PATH` del entorno donde corre Git

### El diff es muy grande

Síntoma:
Git falla al devolver la salida completa.

La implementación actual ya aumentó el buffer de lectura, pero si el repositorio acumula demasiados cambios sin limpiar, conviene revisar el tamaño del commit y evitar incluir archivos generados.

## Retos del taller

### Principiante

- cambiar `MODEL_NAME`
- editar una skill
- cambiar el título del issue

### Intermedio

- guardar el review en un archivo local además de GitHub
- crear issues solo cuando el agente detecte problemas reales
- agregar una skill de JavaScript

### Avanzado

- revisar varios commits
- generar changelog
- revisar pull requests en lugar de solo `HEAD`
