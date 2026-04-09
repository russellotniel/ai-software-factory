# DevOps Platform — Inputs

## Required before deployment
- QA Reviewer PASS verdict
- Approved semantic-release version tag
- Human deployment approval
- Rollback plan documented
- All environment variables confirmed in Kubernetes Secrets or GitHub Actions Environments

## Required for pipeline changes
- Human approval for any change to `.github/workflows/**` or `k8s/**`
