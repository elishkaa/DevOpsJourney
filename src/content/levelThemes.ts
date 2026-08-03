import type { SubjectId } from '../types/challenge'

/** Fundamentals ladder per subject — drives the AI generator and the docs. */
export const LEVEL_THEMES: Record<SubjectId, Record<1 | 2 | 3 | 4, string>> = {
  linux: {
    1: 'files, permissions, processes, basic navigation',
    2: 'pipes/grep/sed, systemd units, cron',
    3: 'disk-full incidents, lsof/strace, load triage',
    4: 'cgroups/namespaces, kernel tunables, forensics',
  },
  git: {
    1: 'clone/commit/branch, basic workflow',
    2: 'conflicts, rebase vs merge, undo (reset/revert)',
    3: 'bisect, hotfix cherry-pick, hooks',
    4: 'history surgery, trunk/release models, signing',
  },
  networking: {
    1: 'IP/ports/DNS basics, ping/curl',
    2: 'HTTP status codes, TLS basics, dig/traceroute',
    3: 'load balancers/proxies, tcpdump, MTU/latency',
    4: 'conntrack exhaustion, mTLS, DNS failure modes',
  },
  docker: {
    1: 'images vs containers, run/logs/exec, volumes',
    2: 'Dockerfile layers/cache, compose, container DNS',
    3: 'multi-stage builds, OOM kills, healthchecks',
    4: 'rootless/capabilities, digests, signal handling',
  },
  kubernetes: {
    1: 'pods/deployments/services, kubectl basics',
    2: 'CrashLoopBackOff, probes, requests/limits',
    3: 'scheduling, HPA, ingress, RBAC',
    4: 'etcd/control plane, PDBs, NetworkPolicy debugging',
  },
  cicd: {
    1: 'pipeline anatomy, triggers, artifacts',
    2: 'Actions syntax, caching, secrets, matrix builds',
    3: 'flaky tests, blue-green/canary, environments',
    4: 'OIDC/provenance, monorepos, self-hosted runners',
  },
  iac: {
    1: 'declarative vs imperative, plan/apply',
    2: 'state, variables, drift, Ansible idempotency',
    3: 'modules, remote state locking, IaC testing',
    4: 'state surgery, multi-account, policy-as-code',
  },
  cloud: {
    1: 'regions/AZs, EC2/S3/IAM basics',
    2: 'security groups vs NACLs, IAM policies, ALB',
    3: 'VPC design, autoscaling, cost incidents',
    4: 'assume-role chains, multi-region failover, quotas',
  },
  observability: {
    1: 'logs/metrics/traces, severity levels',
    2: 'PromQL basics, alert rules, log levels',
    3: 'SLI/SLO/error budgets, alert fatigue',
    4: 'cardinality explosions, burn-rate alerts, retros',
  },
  security: {
    1: 'secrets hygiene, least privilege, SSH keys',
    2: 'CVE scanning, dependency risk, cert expiry',
    3: 'container/K8s hardening, SAST/DAST, rotation',
    4: 'supply-chain attacks, zero trust, IR playbooks',
  },
}
