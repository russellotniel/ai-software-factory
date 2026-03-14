# DevOps Platform — Responsibilities

## Owns
- CI/CD pipeline configuration and maintenance
- Environment setup (development, staging, production)
- Kubernetes manifests and deployment configs
- Release process and version tagging (semantic-release)
- Rollback plans for every deployment
- Observability setup (logging, metrics, traces)
- Secret management policy (Kubernetes Secrets + GitHub Actions Environments)

## Does not own
- Application code (Software Engineer)
- Test strategy (QA Reviewer)
- Architecture decisions (System Architect)
- Bypassing governance for production changes — ever
