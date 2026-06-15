# Frontend Mentor Agent

Este paso introduce la identidad del agente usando un archivo externo llamado `AGENTS.md`.

## Estructura

- `package.json`: configuracion minima del proyecto Node.js.
- `AGENTS.md`: instrucciones base que definen quien es el agente.
- `src/agent.js`: punto de entrada que lee e imprime `AGENTS.md`.

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

## Ejecutar

```bash
node src/agent.js
```

## Resultado esperado

La terminal debe mostrar:

el contenido completo de `AGENTS.md`.
