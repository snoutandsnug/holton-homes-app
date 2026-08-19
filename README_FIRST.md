# Holton Homes OS — Worth-It Update v2

This replaces **Studio as a tool catalog** with a workflow-first layer on top of the CRM.

## What you should notice immediately

- **Today:** a Holton Command Center appears above the existing page.
- **Contact:** Holton Intelligence becomes a proper Relationship Copilot with an in-place AI drawer.
- **Studio home:** five primary workspaces replace the wall of tools.
- **Seller Desk:** one seller workspace combines readiness, property, CMA launch, seller prep, net estimate and compliance actions.
- **Content:** a Content Factory appears directly inside the existing Content section.
- **CMA:** v1 evidence-first CMA remains and can now be launched/prefilled from a seller.

## Easiest install

1. Create a fresh branch from the current `main`, e.g. `worth-it-v2`.
2. Use the `upload-ready` folder and upload/replace the files listed in its README.
3. Let Vercel create the preview.
4. Test the preview before merging.

If using a local clone instead, place this package beside the repo or run `INSTALL_WINDOWS.bat` and give it the repo path.

## Ollama

Ollama is optional for the CRM itself. Command Center, scoring, readiness, CMA math and seller net math still work when Ollama is off. Only AI writing/briefing is unavailable.

## Read next

- `docs/WORTH_IT_CRITIQUE.md`
- `docs/V2_WORKFLOW_SPEC.md`
- `VALIDATION_V2.txt`
