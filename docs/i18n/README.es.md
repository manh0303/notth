# NOTTH

Los comandos npm requieren un paquete publicado; ante E404 usa [código fuente/offline](../getting-started.md#cài-từ-source-khi-registry-chưa-có-package).

[English](../../README.md) · [Tiếng Việt](README.vi.md) · [简体中文](README.zh-CN.md) · **Español**

Agent workflows reutilizables para desarrollar software: **Requirements → Design → Code → Test → Review.**

Entrega una idea, docs existentes o un change request a tu AI coding tool. NOTTH ayuda a inspeccionar el proyecto, aclarar decisiones, implementar el scope aceptado y mantener los spec/docs afectados. Carga solo los roles y skills necesarios.

Los Core workflows sirven para cualquier proyecto. El stack support es opcional y no elige infrastructure ni architecture.

Requiere **Node.js 22+**. Ejecuta en la raíz del proyecto:

```bash
npx --yes @manhd_d/notth init --host codex
```

Host: codex, claude-code, cursor, copilot, gemini-cli, kiro, opencode o windsurf.
En la primera sesión invoca harness-start; si el cliente no descubre el skill, envía:

> Read .agents/skills/harness-start/SKILL.md and follow it for this project. My task: [task].

Kiro ofrece `/harness-start`; el descubrimiento depende del cliente. [Guías](../tool-setup/README.md).

**pip / sin conexión**: requiere un paquete publicado en PyPI; si no existe, usa un wheel offline revisado:

```bash
python -m pip install notth
aih init --host codex
```

Necesita Python 3.9+ y Node.js 22+; incluye el mismo CLI y recursos, sin ejecutar npm/npx.
Sin conexión: `python -m pip install --no-index --no-deps /path/to/package.whl`.
[pip y actualizaciones](../python-installation.md) · [Backup](../configuration-backup.md).
`npx` no crea un comando global aih; comprueba con `npx --yes @manhd_d/notth check`.

| AI tool | Setup |
| --- | --- |
| **Codex** | [Guía](../tool-setup/codex.md) |
| **Claude Code** | [Guía](../tool-setup/claude-code.md) |
| **Cursor** | [Guía](../tool-setup/cursor.md) |
| **GitHub Copilot** | [Guía](../tool-setup/copilot.md) |
| **Gemini CLI** | [Guía](../tool-setup/gemini-cli.md) |
| **Kiro** | [Guía](../tool-setup/kiro.md) |
| **OpenCode** | [Guía](../tool-setup/opencode.md) |
| **Windsurf** | [Guía](../tool-setup/windsurf.md) |

[Docs y ejemplos](../README.md) · [Getting started](../getting-started.md) · [Input/output](../artifact-contract.md) · [Agent configuration](../agent-configuration.md) · [Continuous development](../continuous-development.md) · [MIT](../../LICENSE)

Elegir cliente y migración de proyecto: [Guía](../tool-portability.md).

## Uso diario

Tras cargar el punto de entrada, pide “Corrige este error”, “Añade esta función” o “Continúa la tarea guardada”. El agente elige Quick/Standard/Full según el impacto; no tienes que elegir roles ni gates. Debe indicar lo completado, los bloqueos y la siguiente acción.

[Prompts breves y solución de problemas](../simple-use.md). Una fuente o versión compatible permite `aih start --chat --format human` y `aih status --format human`. JSON sigue siendo el formato predeterminado; los nuevos flags en main no implican publicación en el registro.
