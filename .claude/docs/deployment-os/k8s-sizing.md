# Kubernetes Resource Sizing

> Part of the AI Software Factory — Deployment OS

This document is a sizing framework, not a template. Resource values are
project-specific and must be derived from your application's characteristics.
Use the `/deployment:k8s-config` Claude Code command to generate manifests
for a specific project after reading this guide.

---

## Why Not a Template

A YAML template with placeholder values (`cpu: "500m"`, `memory: "256Mi"`) is
worse than no template. It gets copied without thought, and either:

- **Over-provisions**: wastes cluster resources, inflates cost, masks real usage
- **Under-provisions**: causes OOMKill events and CPU throttling in production

The right values depend on your app's request rate, response time, memory
footprint, startup behaviour, and the cluster's overcommit policy. These are
derived, not guessed.

---

## Core Concepts

### Requests vs Limits

| Field                       | What it does                                     | Consequence of wrong value                                                |
| --------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| `resources.requests.cpu`    | How much CPU the scheduler reserves for this pod | Too low → pod scheduled on overloaded node. Too high → pod won't schedule |
| `resources.requests.memory` | How much RAM the scheduler reserves              | Same as CPU                                                               |
| `resources.limits.cpu`      | Maximum CPU the container can use                | Container is **throttled** (slowed, not killed) when exceeded             |
| `resources.limits.memory`   | Maximum RAM the container can use                | Container is **OOMKilled** (restarted) when exceeded                      |

**Always set both requests and limits.** A pod without limits can consume all
node resources and starve neighbours.

### The limits/requests ratio

A common pattern is to set limits at 2× requests. This gives burst headroom
without allowing runaway consumption:

```
requests.cpu: 250m    limits.cpu: 500m
requests.memory: 256Mi   limits.memory: 512Mi
```

For memory specifically: **set limits close to requests** (1.2–1.5×). Memory
limits don't throttle — they kill. A generous memory limit is safer than a
tight one.

---

## Sizing a Next.js Application

### Step 1 — Measure baseline memory

The Next.js standalone server (`node server.js`) has a baseline memory
footprint before it handles any requests. For a typical App Router application:

- Minimal app (few routes, light dependencies): ~120–180 MB RSS
- Medium app (20–50 routes, standard deps): ~200–350 MB RSS
- Large app (100+ routes, heavy deps, React Server Components cache): ~400–600 MB RSS

**How to measure locally:**

```bash
# Start the production build
node .next/standalone/server.js

# In another terminal
ps aux | grep node
# or
cat /proc/$(pgrep node)/status | grep VmRSS
```

In Kubernetes, use `kubectl top pod` after a load test to observe real usage.

### Step 2 — Add request-time overhead

Memory grows under load as Next.js caches rendered output, holds open
connections, and processes concurrent requests. Add headroom:

- **Low traffic** (< 50 req/s): add 50–100 MB over baseline
- **Medium traffic** (50–200 req/s): add 100–200 MB
- **High traffic** (200+ req/s): add 200–400 MB, consider horizontal scaling

### Step 3 — CPU

Next.js is CPU-intensive during Server Component rendering and RSC payload
generation. A useful starting model:

| Traffic               | requests.cpu | limits.cpu  |
| --------------------- | ------------ | ----------- |
| Low (< 20 req/s)      | 100–200m     | 300–500m    |
| Medium (20–100 req/s) | 250–500m     | 500m–1000m  |
| High (100+ req/s)     | 500m–1000m   | 1000m–2000m |

`1000m` = 1 full CPU core. For reference, a 4-core node can comfortably run
3–4 Next.js pods at medium traffic with headroom for system processes.

### Step 4 — Startup probe vs liveness vs readiness

Next.js takes 2–8 seconds to start depending on bundle size. Configure probes
to avoid premature termination:

```yaml
startupProbe:
  httpGet:
    path: /api/health
    port: 3000
  failureThreshold: 30 # 30 × 1s = 30s max startup time
  periodSeconds: 1

livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 0
  periodSeconds: 15
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 0
  periodSeconds: 5
  failureThreshold: 3
```

### Step 5 — Replica count

| Environment              | Replicas | Reasoning                                      |
| ------------------------ | -------- | ---------------------------------------------- |
| Staging                  | 1        | Cost control; single pod is fine for QA/review |
| Production (low traffic) | 2        | Minimum for zero-downtime rolling deploys      |
| Production (medium/high) | 3+       | Add replicas based on measured CPU saturation  |

With 2+ replicas, a rolling deploy replaces one pod at a time. With 1 replica,
there is a brief gap.

Set `maxUnavailable: 0` and `maxSurge: 1` on your rolling update strategy to
guarantee zero downtime:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 0
    maxSurge: 1
```

---

## Worked Example — Small SaaS App

**Profile:** Internal tool, ~30 concurrent users, 10–40 req/s peak, standard CRUD.

**Measured baseline memory:** 210 MB RSS in production build.
**Load test peak memory:** 290 MB RSS at 40 req/s.
**Observed CPU:** 180m average, 350m at peak.

```yaml
resources:
  requests:
    cpu: "200m"
    memory: "320Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
replicas: 2 # production
```

**Reasoning:**

- Memory request (320 Mi) ≈ peak observed + 10% headroom
- Memory limit (512 Mi) = 1.6× request — comfortable, won't OOMKill on a spike
- CPU request (200m) ≈ average observed
- CPU limit (500m) ≈ 1.4× peak observed — burst headroom without hogging the node
- 2 replicas = zero-downtime rolling deploy

---

## Worked Example — Multi-Tenant Dashboard

**Profile:** External SaaS, 200–500 concurrent users, 80–200 req/s peak, heavy
RSC rendering with Supabase queries per request.

**Measured baseline memory:** 380 MB RSS.
**Load test peak memory:** 620 MB RSS at 200 req/s.
**Observed CPU:** 400m average, 900m at peak.

```yaml
resources:
  requests:
    cpu: "500m"
    memory: "700Mi"
  limits:
    cpu: "1200m"
    memory: "900Mi"
replicas: 3 # production
```

**Reasoning:**

- Memory request (700 Mi) ≈ peak observed + 13% headroom
- Memory limit (900 Mi) = 1.3× request — tight enough to protect the node
- CPU request (500m) = slightly above average (scheduler reserves this reliably)
- CPU limit (1200m) = 1.3× peak — burst headroom; CPU throttle is acceptable
  at extreme peaks, OOMKill is not
- 3 replicas for load distribution and rolling deploy safety

---

## HorizontalPodAutoscaler (HPA)

For production applications with variable traffic, use HPA to scale replicas
automatically based on CPU or memory utilisation.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nextjs-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nextjs-app
  minReplicas: 2
  maxReplicas: 8
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70 # scale up when avg CPU > 70% of request
```

**Key rule:** HPA only works correctly if `resources.requests` is set. The
autoscaler calculates utilisation as `actual usage / request`. Without a
request value, utilisation is undefined and HPA cannot function.

Set `minReplicas: 2` in production. Never `minReplicas: 1` — a single pod
going down during a rolling deploy creates a gap.

---

## ConfigMap — Runtime Environment Variables

`NEXT_PUBLIC_*` variables are injected at container start via ConfigMap, not
baked into the Docker image. The Deployment spec references the ConfigMap via
`envFrom`:

```yaml
# In your Deployment spec, under containers:
envFrom:
  - configMapRef:
      name: nextjs-env
  - secretRef:
      name: nextjs-secrets # SUPABASE_SERVICE_ROLE_KEY, etc.
```

```yaml
# k8s/staging/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nextjs-env
  namespace: app-staging
data:
  NEXT_PUBLIC_SUPABASE_URL: "https://staging-supabase.internal"
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJ..."
  NEXT_PUBLIC_APP_URL: "https://staging.yourapp.com"
  APP_ENV: "staging"
  PORT: "3000"
```

Never put `SUPABASE_SERVICE_ROLE_KEY` or any private key in a ConfigMap.
Use a Kubernetes Secret for those:

```yaml
# k8s/staging/secret.yaml (values are base64-encoded)
apiVersion: v1
kind: Secret
metadata:
  name: nextjs-secrets
  namespace: app-staging
type: Opaque
stringData:
  SUPABASE_SERVICE_ROLE_KEY: "your-service-role-key"
  # Add other server-only secrets here
```

In practice, populate Secrets via your CI/CD pipeline or a secrets manager
(Azure Key Vault, Vault by HashiCorp) rather than committing them to the repo.

---

## Checklist Before Generating a Manifest

Answer these before running `/deployment:k8s-config`:

- [ ] What is the measured baseline memory of the app (local production build)?
- [ ] What is the expected peak concurrent user count?
- [ ] What is the expected peak request rate (req/s)?
- [ ] Is this a CPU-light app (CRUD) or CPU-heavy (RSC-intensive, AI, real-time)?
- [ ] Does it need HPA, or is fixed replica count sufficient?
- [ ] What namespace does staging deploy to?
- [ ] What namespace does production deploy to?
- [ ] What is the staging ingress hostname?
- [ ] What is the production ingress hostname?
- [ ] What ingress controller is the cluster running (nginx, traefik, OCP Route)?
