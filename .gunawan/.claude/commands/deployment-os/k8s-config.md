# /deployment:k8s-config

Generate Kubernetes manifests for a specific project based on its actual
characteristics. This command asks a structured set of questions and produces
deployment.yaml, service.yaml, configmap.yaml, ingress.yaml, and optionally
hpa.yaml — sized correctly for this project, not from a generic template.

Read `deployment-os/k8s-sizing.md` before starting. The sizing guide contains
the formulas and worked examples that inform the values you will generate.

---

## Step 1 — Gather Context

Ask the following questions. Collect all answers before generating anything.
Group them naturally in conversation — do not fire them as a numbered list.

### App profile

- What is the app name? (used for resource `name:` fields and labels)
- Is this for staging, production, or both?
- What is the measured baseline memory of the production build?
  (If unknown: ask them to run `node .next/standalone/server.js` and check
  `ps aux` or `kubectl top pod` after warmup)
- What is the expected peak concurrent user count?
- What is the expected peak request rate (req/s)?
- Is the app CPU-light (standard CRUD) or CPU-heavy (heavy RSC rendering,
  AI features, real-time processing)?

### Cluster context

- What Kubernetes platform? (AKS / OCP / vanilla)
- What namespaces? (staging namespace, production namespace)
- What ingress controller? (nginx / traefik / OCP Route / other)
- What are the ingress hostnames? (staging hostname, production hostname)

### Scaling

- Fixed replica count, or use HorizontalPodAutoscaler (HPA)?
- If HPA: what min and max replicas?
- If fixed: how many replicas per environment?

### Secrets approach

- How are Kubernetes Secrets populated in this cluster?
  (CI/CD pipeline injection / Azure Key Vault / HashiCorp Vault / manual)
  This determines whether to generate secret.yaml or leave a note.

---

## Step 2 — Derive Resource Values

Using the answers and the sizing formulas from `deployment-os/k8s-sizing.md`:

1. Calculate `requests.memory` = peak observed memory + 10–15% headroom
   (if peak unknown, use baseline × 1.5 as estimate and flag it)
2. Calculate `limits.memory` = requests.memory × 1.3–1.5
   (lean toward 1.3× — memory limits kill, not throttle)
3. Calculate `requests.cpu` based on traffic tier from the sizing table
4. Calculate `limits.cpu` = requests.cpu × 1.5–2×
5. Choose replica count:
   - Staging: 1
   - Production low traffic: 2
   - Production medium/high: 3 or HPA min=2

Show the user your derived values and the reasoning behind each before
generating the YAML. Ask for confirmation or adjustment.

---

## Step 3 — Generate Manifests

Generate all files for the requested environment(s).
Use the confirmed resource values.
Add inline comments explaining non-obvious values.

### File set per environment

```
k8s/
├── staging/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── ingress.yaml
│   └── hpa.yaml          (only if HPA requested)
└── production/
    ├── deployment.yaml
    ├── service.yaml
    ├── configmap.yaml
    ├── ingress.yaml
    └── hpa.yaml          (only if HPA requested)
```

### deployment.yaml template structure

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {app-name}
  namespace: {namespace}
  labels:
    app: {app-name}
    version: "latest"       # updated by CI on each deploy
spec:
  replicas: {derived-replicas}
  selector:
    matchLabels:
      app: {app-name}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0     # zero-downtime: never go below desired count
      maxSurge: 1           # spin up one extra pod during deploy
  template:
    metadata:
      labels:
        app: {app-name}
    spec:
      containers:
        - name: {app-name}
          image: ghcr.io/{org}/{repo}:latest   # CI replaces this with sha/version tag
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: {app-name}-env
            - secretRef:
                name: {app-name}-secrets
          resources:
            requests:
              cpu: "{derived-cpu-request}"
              memory: "{derived-memory-request}"
            limits:
              cpu: "{derived-cpu-limit}"
              memory: "{derived-memory-limit}"
          startupProbe:
            httpGet:
              path: /api/health
              port: 3000
            failureThreshold: 30
            periodSeconds: 1
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            periodSeconds: 15
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            periodSeconds: 5
            failureThreshold: 3
```

### OCP-specific adjustments

If the cluster is OpenShift (OCP):

- Replace `Ingress` with `Route` kind
- Add `securityContext.runAsNonRoot: true` (OCP enforces this by default)
- Drop `allowPrivilegeEscalation` if SecurityContextConstraints require it
- Namespace names follow the project/namespace structure of the OCP cluster

### AKS-specific adjustments

If the cluster is AKS with nginx ingress:

- Use standard `networking.k8s.io/v1` Ingress
- Add `nginx.ingress.kubernetes.io/proxy-buffer-size: "16k"` annotation
  (Next.js JWTs can exceed nginx's default buffer size)

---

## Step 4 — Confirm and Write

After generating, show the complete file set.
Ask: "Does this look right? Should I write these files to `k8s/` in the repo?"
On confirmation, write the files.

Remind the user:

- Replace `latest` image tags with the actual SHA or version tag in CI
  (the workflows in `deployment-os/ci-cd.md` handle this automatically)
- Populate Kubernetes Secrets via your cluster's secrets approach
  (do not commit actual secret values to the repo)
- Run `kubectl apply -k k8s/staging/` or apply each file individually
- After first deploy, run `kubectl top pod -n {namespace}` under load
  and compare to the requested values — adjust if needed

---

## ✅ What's Next

Tell the user:

"Kubernetes manifests generated. Run `/deployment:release` to walk through the pre-release checklist and production deploy gate."

```
Next command: /deployment:release
```
