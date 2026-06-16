# Frontend Mentor Agent

Este paso conecta el agente con un modelo local usando Ollama.

## Estructura

- `package.json`: configuracion del proyecto y dependencia `dotenv`.
- `.env.example`: ejemplo de configuracion del entorno.
- `AGENTS.md`: instrucciones base que definen quien es el agente.
- `PROJECT_CONTEXT.md`: informacion sobre el proyecto que el agente va a analizar.
- `src/agent.js`: punto de entrada que construye el prompt y muestra la respuesta final.
- `src/ollama.js`: modulo que encapsula la comunicacion con Ollama.

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
4. une esas piezas en un solo texto final

La idea central es esta:

`AGENTS.md` + `PROJECT_CONTEXT.md` = prompt

## Por que este enfoque es mas flexible

Si las instrucciones estuvieran hardcodeadas dentro de `src/agent.js`, cualquier cambio obligaria a editar la logica del programa.

Al separar las piezas:

- puedes cambiar la identidad del agente sin tocar la logica
- puedes cambiar el contexto del proyecto sin tocar la logica
- puedes reutilizar el mismo codigo con otros proyectos o con otros agentes

Esto hace que el agente sea mas facil de entender, mantener y expandir en pasos futuros.

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

1. el prompt construido internamente
2. la respuesta generada por el modelo local

## Configuracion

Copia `.env.example` a `.env` si quieres definir el modelo de manera explicita:

```bash
cp .env.example .env
```

Contenido esperado:

```text
MODEL_NAME=mistral
```

## Como probar el agente

1. instala dependencias con `npm install`
2. copia `.env.example` a `.env`
3. confirma que Ollama esta corriendo
4. confirma que `mistral` esta instalado con `ollama pull mistral`
5. ejecuta `node src/agent.js`
