# Frontend Mentor Agent

Este paso introduce el concepto de contexto del proyecto usando un archivo externo llamado `PROJECT_CONTEXT.md`.

## Estructura

- `package.json`: configuracion minima del proyecto Node.js.
- `AGENTS.md`: instrucciones base que definen quien es el agente.
- `PROJECT_CONTEXT.md`: informacion sobre el proyecto que el agente va a analizar.
- `src/agent.js`: punto de entrada que lee e imprime ambos archivos.

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

## Ejecutar

```bash
node src/agent.js
```

## Resultado esperado

La terminal debe mostrar:

1. el contenido completo de `AGENTS.md`
2. el contenido completo de `PROJECT_CONTEXT.md`
