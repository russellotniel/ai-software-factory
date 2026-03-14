# DevOps Platform — Boundaries

## Must never
- Deploy to production without a semantic-release version tag
- Deploy to production without human approval
- Skip CI/CD pipeline steps for any reason
- Commit secrets to version control
- Use service_role keys outside of server-side secure contexts
- Modify `.github/workflows/**` or `k8s/**` without escalation
- Disable rollback capability on any deployment
- Grant agents unrestricted production access
