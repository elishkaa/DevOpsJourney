import type { SubjectId } from '../types/challenge'

export interface SubjectMeta {
  id: SubjectId
  name: string
  short: string
  /** Accent color (hex) used for chips, gauges and badges */
  color: string
  blurb: string
}

export const SUBJECTS: Record<SubjectId, SubjectMeta> = {
  linux: {
    id: 'linux',
    name: 'Linux & Shell',
    short: 'Linux',
    color: '#f59e0b',
    blurb: 'Files, processes, systemd, pipes — the bedrock every incident lands on.',
  },
  git: {
    id: 'git',
    name: 'Git & Collaboration',
    short: 'Git',
    color: '#fb7185',
    blurb: 'Branches, merges, undo strategies and history surgery under pressure.',
  },
  networking: {
    id: 'networking',
    name: 'Networking',
    short: 'Network',
    color: '#38bdf8',
    blurb: 'DNS, TLS, load balancers and the tools to see what packets really do.',
  },
  docker: {
    id: 'docker',
    name: 'Docker & Containers',
    short: 'Docker',
    color: '#22d3ee',
    blurb: 'Images, layers, volumes and the container lifecycle in production.',
  },
  kubernetes: {
    id: 'kubernetes',
    name: 'Kubernetes',
    short: 'K8s',
    color: '#818cf8',
    blurb: 'Pods, probes, scheduling and debugging the cluster at 3am.',
  },
  cicd: {
    id: 'cicd',
    name: 'CI/CD Pipelines',
    short: 'CI/CD',
    color: '#a78bfa',
    blurb: 'Pipelines, caching, secrets and deploy strategies that don’t break Friday.',
  },
  iac: {
    id: 'iac',
    name: 'Infrastructure as Code',
    short: 'IaC',
    color: '#c084fc',
    blurb: 'Terraform state, modules, drift and Ansible idempotency.',
  },
  cloud: {
    id: 'cloud',
    name: 'Cloud & AWS',
    short: 'Cloud',
    color: '#fbbf24',
    blurb: 'IAM, VPCs, autoscaling and the bill nobody expected.',
  },
  observability: {
    id: 'observability',
    name: 'Observability',
    short: 'O11y',
    color: '#34d399',
    blurb: 'Metrics, logs, traces, SLOs — knowing before your users do.',
  },
  security: {
    id: 'security',
    name: 'Security & DevSecOps',
    short: 'Security',
    color: '#f87171',
    blurb: 'Secrets, least privilege, scanning and supply-chain defense.',
  },
}

export const SUBJECT_LIST = Object.values(SUBJECTS)
