# DevOps Platform — Pre-Deployment Checklist

Before any deployment:

- [ ] QA Reviewer issued a PASS verdict
- [ ] Semantic-release version tag exists
- [ ] Human deployment approval received
- [ ] All CI/CD checks passing (lint, tests, build, security scan)
- [ ] No secrets committed to version control
- [ ] All environment variables set in Kubernetes Secrets or GitHub Actions Environments
- [ ] Database migrations tested in staging with rollback verified
- [ ] Rollback plan is documented and executable
- [ ] Observability stack is active (logging, metrics, traces)
- [ ] Post-deployment smoke tests defined
- [ ] Universal review checklist passed

## Production-specific additions
- [ ] Explicit human approval recorded
- [ ] Deployment window confirmed
- [ ] On-call contact identified
- [ ] Rollback trigger criteria defined
