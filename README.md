# Frontend Mentor Agent

Este paso introduce la primera accion externa del agente: guardar el review como un GitHub Issue.

## Estructura

- `package.json`: configuracion del proyecto y dependencia `dotenv`.
- `.env.example`: ejemplo de configuracion del entorno.
- `AGENTS.md`: instrucciones base que definen quien es el agente.
- `PROJECT_CONTEXT.md`: informacion sobre el proyecto que el agente va a analizar.
- `src/agent.js`: punto de entrada que construye el prompt, genera el review y dispara la accion final.
- `src/github.js`: modulo que encapsula la comunicacion con la API de GitHub.
- `src/git.js`: modulo que consulta informacion del repositorio usando Git.
- `src/ollama.js`: modulo que encapsula la comunicacion con Ollama.
- `skills/`: instrucciones especializadas que se cargan segun el tipo de archivo cambiado.

## Que es AGENTS.md

`AGENTS.md` es el archivo donde vive la identidad del agente.

Aqui se describe:

- su rol
- sus objetivos
- sus responsabilidades
- su comportamiento esperado

## Por que un agente necesita instrucciones

Un agente no solo necesita codigo. Tambien necesita instrucciones que expliquen como debe comportarse.

El codigo dice:

- que archivo leer
- cuando mostrar algo en pantalla

Las instrucciones dicen:

- quien es el agente
- que tipo de ayuda debe dar
- como debe responder

## Diferencia entre codigo y comportamiento del agente

El codigo controla la mecanica del programa.

Por ejemplo:

- abrir un archivo
- leer texto
- imprimir texto en consola

El comportamiento del agente vive fuera del codigo, en `AGENTS.md`.

Eso permite cambiar la identidad del agente sin reescribir la logica del programa.

## Que es el contexto

El contexto es la informacion que ayuda al agente a entender el proyecto en el que trabaja.

En este paso, `PROJECT_CONTEXT.md` explica:

- que tipo de proyecto es
- para quien fue hecho
- que nivel de complejidad conviene usar

## Por que los agentes necesitan contexto

Un agente puede saber quien es, pero aun asi no entender bien el proyecto.

Por ejemplo:

- no es lo mismo revisar una app de produccion que un ejercicio para principiantes
- no es lo mismo hablar con lenguaje avanzado que con lenguaje simple

El contexto ayuda a que el agente adapte sus respuestas al proyecto real.

## Diferencia entre identidad y contexto

Identidad:

- vive en `AGENTS.md`
- define quien es el agente
- define su estilo y sus responsabilidades

Contexto:

- vive en `PROJECT_CONTEXT.md`
- define que proyecto tiene enfrente el agente
- define que informacion adicional necesita para responder mejor

Separar identidad y contexto permite cambiar el proyecto sin cambiar la personalidad base del agente.

## Que es un prompt

Un prompt es el texto completo que se le entregaria a un modelo para pedirle una respuesta.

En este proyecto, el prompt no se escribe como un solo bloque fijo. Se construye uniendo partes.

## Como construye el prompt el agente

En este paso, `src/agent.js` hace esto:

1. lee `AGENTS.md`
2. lee `PROJECT_CONTEXT.md`
3. lee `MODEL_NAME` desde el entorno
4. consulta la rama actual
5. consulta el hash del ultimo commit
6. consulta el mensaje del ultimo commit
7. consulta el diff del ultimo commit
8. extrae la lista de archivos cambiados
9. selecciona skills relevantes para ese commit
10. une esas piezas en un solo texto final
11. envia el prompt a Ollama
12. crea un GitHub Issue con el review generado

La idea central es esta:

`AGENTS.md` + `PROJECT_CONTEXT.md` + Git metadata + diff + skills = prompt -> review -> GitHub Issue

## Por que este enfoque es mas flexible

Si las instrucciones estuvieran hardcodeadas dentro de `src/agent.js`, cualquier cambio obligaria a editar la logica del programa.

Al separar las piezas:

- puedes cambiar la identidad del agente sin tocar la logica
- puedes cambiar el contexto del proyecto sin tocar la logica
- puedes reutilizar el mismo codigo con otros proyectos o con otros agentes

Esto hace que el agente sea mas facil de entender, mantener y expandir en pasos futuros.

## Como se recoge la metadata de Git

En este paso usamos Node.js para ejecutar comandos de Git desde `src/git.js`.

Ese archivo obtiene tres datos:

- rama actual
- hash corto del ultimo commit
- mensaje del ultimo commit

## Por que esta informacion le sirve al agente

La metadata del repositorio ayuda a que el agente no trabaje a ciegas.

- la rama puede indicar el contexto de trabajo
- el hash permite identificar exactamente el commit observado
- el mensaje del commit resume la intencion del cambio

Esto convierte al agente en un agente con conciencia basica del repositorio.

## Como la metadata entra al prompt

`src/agent.js` lee los datos de Git y los agrega como una nueva seccion dentro del prompt.

De esa forma, el modelo no recibe solo identidad y contexto general, sino tambien datos reales del estado actual del repositorio.

## Por que este es el primer paso hacia un agente consciente de commits

Todavia no estamos leyendo el diff ni los archivos cambiados.

Pero ya estamos dando al agente:

- una rama
- un commit identificable
- un mensaje asociado a ese commit

Eso prepara el terreno para los siguientes pasos, donde el agente podra razonar sobre cambios concretos.

## Que hace `git show`

En este paso usamos este comando:

```bash
git show --no-color --stat --patch HEAD
```

Ese comando devuelve:

- los metadatos del commit
- un resumen de archivos cambiados con `--stat`
- el patch completo con las lineas agregadas y eliminadas

`--no-color` evita caracteres de color para que el texto sea mas facil de procesar por el agente.

## Que contiene un diff

Un diff incluye informacion como:

- que archivos cambiaron
- que lineas se agregaron
- que lineas se eliminaron
- en que partes del archivo ocurrio el cambio

Eso convierte al diff en la pieza mas importante para un agente de revision de codigo.

## Por que la metadata sola no alcanza

Saber la rama, el hash y el mensaje del commit ayuda, pero no muestra el cambio real.

Por ejemplo, un mensaje puede decir "improve layout", pero solo el diff revela:

- que archivos tocaron
- que selectores cambiaron
- que HTML se agrego o elimino

## Por que este es el fundamento de un code review agent

Un agente de revision necesita ver el cambio exacto, no solo un resumen humano.

Cuando el prompt incluye el diff:

- el modelo puede hablar sobre lineas reales
- el review se vuelve mas especifico
- la respuesta deja de ser generica y empieza a estar anclada al codigo cambiado

## Que es una skill

Una skill es un bloque pequeno de instrucciones especializadas.

No define quien es el agente. Define en que fijarse para una tarea concreta.

En este paso hay skills para:

- HTML
- CSS
- accesibilidad
- mensajes de commit

## Diferencia entre AGENTS.md, PROJECT_CONTEXT.md, Skills y Git Diff

`AGENTS.md`:

- define la identidad del agente
- describe su rol general

`PROJECT_CONTEXT.md`:

- describe el proyecto que se esta revisando
- ajusta el nivel y el enfoque del agente

`skills/`:

- agregan instrucciones especializadas
- se cargan solo cuando hacen falta

`Git Diff`:

- muestra el cambio real del codigo
- le da evidencia concreta al modelo

## Por que los agentes se construyen con multiples componentes

Un solo bloque de prompt suele mezclar demasiadas responsabilidades.

Separar componentes permite:

- cambiar la identidad sin tocar las skills
- cambiar el proyecto sin tocar la identidad
- activar especializaciones solo cuando aplican
- mantener el prompt mas claro y modular

## Como se cargan las skills en este paso

El agente siempre carga `skills/commit-message.md`.

Si el diff incluye archivos `.html`, carga:

- `skills/html-review.md`
- `skills/accessibility-review.md`

Si el diff incluye archivos `.css`, carga:

- `skills/css-review.md`

Esto hace que la composicion del prompt sea dinamica en vez de fija.

## Que es un GitHub Personal Access Token

Un Personal Access Token es una credencial personal para usar la API de GitHub desde scripts o aplicaciones.

En este paso se usa en:

- `GITHUB_TOKEN`

Para este taller, usa un token de una cuenta personal y prueba contra un repositorio tuyo.

## Formato de GITHUB_REPO

La variable `GITHUB_REPO` debe tener este formato:

```text
owner/repo
```

Ejemplo:

```text
tu-usuario/frontend-mentor-agent
```

## Como funciona el flujo con Issues

En este paso el agente:

1. lee contexto y cambios
2. genera un review con Ollama
3. convierte ese review en un issue persistente en GitHub

Eso separa dos capas del trabajo del agente:

- analisis: entender el cambio y redactar el review
- accion: escribir ese resultado en un sistema externo

## Por que los Issues son utiles como persistencia

La terminal solo muestra el resultado en ese momento.

Un Issue permite:

- guardar el review
- compartirlo con otras personas
- volver a leerlo despues
- tratarlo como seguimiento real del proyecto

## Como probar esto de forma segura

La forma mas segura es usar un repositorio personal de pruebas.

1. crea un repositorio tuyo en GitHub
2. genera un token personal con permisos suficientes para crear issues
3. configura `.env` con `GITHUB_TOKEN` y `GITHUB_REPO`
4. ejecuta `node src/agent.js`
5. confirma que el issue se haya creado en ese repositorio

## Que es Ollama

Ollama es una herramienta para ejecutar modelos de lenguaje localmente en tu computadora.

En este paso la usamos para completar el flujo:

prompt -> modelo local -> respuesta

## Por que usar un LLM local

Un modelo local permite:

- aprender sin depender de una API externa
- experimentar mas rapido
- mantener el proyecto simple para taller

## Como instalar Ollama

Descargalo desde [ollama.com/download](https://ollama.com/download).

## Como instalar Mistral

Despues de instalar Ollama, descarga el modelo:

```bash
ollama pull mistral
```

## Como verificar que Ollama esta corriendo

Puedes probar cualquiera de estas opciones:

```bash
ollama list
```

o:

```bash
curl http://localhost:11434
```

Si Ollama no esta activo, el agente mostrara un error de conexion.

## Ejecutar

```bash
node src/agent.js
```

## Resultado esperado

La terminal debe mostrar:

1. la rama actual
2. el hash del ultimo commit
3. el mensaje del ultimo commit
4. la lista de archivos cambiados
5. la lista de skills seleccionadas
6. la respuesta generada por el modelo local

## Configuracion

Copia `.env.example` a `.env` si quieres definir el modelo de manera explicita:

```bash
cp .env.example .env
```

Contenido esperado:

```text
MODEL_NAME=mistral
GITHUB_TOKEN=tu_token
GITHUB_REPO=tu-usuario/frontend-mentor-agent
```

## Como probar el agente

1. instala dependencias con `npm install`
2. copia `.env.example` a `.env`
3. confirma que Ollama esta corriendo
4. confirma que `mistral` esta instalado con `ollama pull mistral`
5. agrega `GITHUB_TOKEN` y `GITHUB_REPO` en `.env`
6. ejecuta `node src/agent.js`

## Resultado esperado

La terminal debe mostrar:

1. la rama actual
2. el hash del ultimo commit
3. el mensaje del ultimo commit
4. la lista de archivos cambiados
5. la lista de skills seleccionadas
6. el review generado por Ollama
7. la URL del GitHub Issue creado

## Automatizacion con Husky

En este paso agregamos automatizacion local para que el agente corra solo despues de cada commit.

### Que pasa despues de `git commit`

Cuando haces:

```bash
git commit -m "test"
```

Git puede ejecutar hooks locales asociados a ese evento.

En este proyecto usamos el hook:

```text
post-commit
```

Eso significa que el commit termina primero y, justo despues, se ejecuta el agente.

### Que hace Husky

Husky intercepta los hooks de Git y los conecta con archivos versionados dentro del repositorio.

Eso permite que el equipo vea y mantenga los hooks como parte del codigo del proyecto, en vez de depender de configuraciones ocultas en cada maquina.

### Por que elegimos `post-commit`

Elegimos `post-commit` porque este agente necesita leer:

- el commit creado
- su metadata
- su diff

Si el hook corriera antes del commit, el agente no tendria ese estado final consolidado.

### Diferencia entre ejecucion manual y automatizada

Manual:

- tu corres `node src/agent.js`
- util para aprender, depurar y probar

Automatizada:

- Git dispara el agente solo
- util para integrar el flujo al trabajo diario

### Como desactivar hooks temporalmente

Si quieres hacer un commit sin ejecutar hooks:

```bash
git commit --no-verify -m "test"
```

Eso desactiva temporalmente los hooks para ese commit puntual.

### Como diagnosticar Husky

Si Husky no corre:

1. ejecuta `npm install`
2. ejecuta `npm run prepare`
3. confirma que existe `.husky/post-commit`
4. revisa que `node --version` funcione en tu terminal
5. prueba ejecutar manualmente `sh .husky/post-commit`

Si el hook corre pero el agente falla, el problema ya no es Husky: normalmente sera Ollama, GitHub o variables de entorno.

## Flujo Final

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
