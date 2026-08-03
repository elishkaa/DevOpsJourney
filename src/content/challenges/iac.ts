import type { Challenge } from '../../types/challenge'

/**
 * Infrastructure as Code — fundamentals vocabulary:
 * declarative-model, iac-workflow, plan-before-apply, state-source-of-truth,
 * drift-detection, variables-outputs, idempotency, remote-state-locking,
 * resource-import, iac-testing, module-composition, policy-as-code,
 * state-surgery, environment-isolation
 */
export const iacChallenges = [
  // ---------------------------------------------------------------- L1
  {
    id: 'iac-l1-declarative-mindset',
    subject: 'iac',
    level: 1,
    type: 'mcq',
    title: 'OPS-1701: where do I write the "create server" commands?',
    scenario:
      'Tomer opens his first PR against the **NimbusPay** infra repo and comments: "This `main.tf` just *describes* an EC2 instance — where do I write the actual create commands, and the if-exists checks?"',
    prompt: 'What should you tell him about how Terraform (a declarative tool) works?',
    options: [
      'You declare the desired end state; Terraform compares it to reality and computes the create/update/delete steps itself',
      'HCL is compiled into a bash script of AWS CLI calls that runs top to bottom',
      'You must add explicit create commands — the resource block is only documentation',
      'Terraform records your console clicks and replays them',
    ],
    correctIndex: 0,
    explanation:
      'The core split in IaC is **declarative vs imperative**. Imperative tools (scripts) list *steps*: create this, then attach that — and you own every edge case ("what if it already exists?"). Declarative tools take a *description of the end state*, diff it against the real world, and derive the steps. That is why the same config is safe to run once or fifty times: if reality already matches, Terraform does nothing. Tomer never writes create commands — he edits the description and lets `plan` show the computed steps.',
    fundamental: 'declarative-model',
    xp: 10,
    tags: ['terraform', 'declarative'],
    estMinutes: 1,
    source: 'seed',
  },
  {
    id: 'iac-l1-clickops-ban',
    subject: 'iac',
    level: 1,
    type: 'mcq',
    title: 'OPS-1702: why is the AWS console read-only for prod?',
    scenario:
      'Day two at NimbusPay. You notice your prod console access is **read-only** and every infra change goes through a Terraform PR. Tomer grumbles: "clicking is faster." Maya asks you to explain the policy in the onboarding doc.',
    prompt: 'What is the strongest reason infrastructure is managed as code instead of console clicks?',
    options: [
      'Code is versioned, reviewable and repeatable — every change has an author, a diff and a rollback, and the same config can rebuild the environment',
      'The AWS console charges extra per manual change',
      'Terraform is required by AWS for all production accounts',
      'Console changes are slower to take effect than API calls',
    ],
    correctIndex: 0,
    explanation:
      'IaC turns infrastructure into what software already has: **git history, code review, and reproducibility**. A clicked change lives only in one person’s memory; a merged `.tf` diff shows *what* changed, *who* approved it and *why* — and `git revert` is your rollback. Reproducibility is the quiet superpower: staging can be a faithful copy of prod, and disaster recovery becomes "run the code in a new account", not "remember what we clicked over three years". Speed of a single click is real — and it is exactly how unexplainable snowflake environments are born.',
    fundamental: 'declarative-model',
    xp: 10,
    tags: ['iac', 'change-management'],
    estMinutes: 1,
    source: 'seed',
  },
  {
    id: 'iac-l1-init-fresh-clone',
    subject: 'iac',
    level: 1,
    type: 'command',
    title: 'OPS-1703: fresh clone, first error',
    scenario:
      'You clone the `nimbus-infra` repo onto your new laptop and immediately try a plan:',
    artifact:
      '$ terraform plan\n│ Error: Backend initialization required, please run "terraform init"\n│ Reason: Initial configuration of the requested backend "s3"',
    artifactLang: 'text',
    prompt: 'Type the command that prepares this working directory (backend, providers, modules).',
    answerPatterns: ['terraform init', 'terraform init -upgrade', 'terraform init -reconfigure'],
    acceptExamples: ['terraform init'],
    placeholder: 'terraform …',
    explanation:
      '`terraform init` is the setup step every fresh working directory needs: it configures the **backend** (where state lives — S3 for NimbusPay), downloads the **provider plugins** (the AWS API client), and fetches any **modules**. None of that ships in the repo, so a clone cannot plan until init runs. It is safe to re-run any time — init never touches real infrastructure. The rhythm you will repeat for years: `init` once per checkout/backend change, then `plan` and `apply` per change.',
    fundamental: 'iac-workflow',
    xp: 10,
    tags: ['terraform', 'init'],
    estMinutes: 1,
    source: 'seed',
  },
  {
    id: 'iac-l1-plan-preview',
    subject: 'iac',
    level: 1,
    type: 'command',
    title: 'OPS-1704: show me the diff before you touch anything',
    scenario:
      'Tonight’s change window covers your security-group edit. Maya on Slack: "Before anything runs against prod-eu, paste exactly **what Terraform would change** — without changing it."',
    prompt: 'Type the command that previews the changes without applying them.',
    answerPatterns: [
      'terraform plan',
      'terraform plan -out[= ]\\S+',
      'terraform plan -no-color',
      'terraform plan -detailed-exitcode',
    ],
    acceptExamples: ['terraform plan'],
    placeholder: 'terraform …',
    explanation:
      '`terraform plan` is the dry run at the heart of the IaC workflow: it refreshes what exists, diffs it against your config, and prints the actions apply *would* take — creating nothing. The habit that keeps fintechs calm: **nobody applies a plan they haven’t read**. In pipelines you will see `plan -out=tfplan`, which saves the exact plan so `apply tfplan` executes precisely what was reviewed — no surprise drift between review and execution. A plan is a proposal; apply is the contract.',
    fundamental: 'plan-before-apply',
    xp: 10,
    tags: ['terraform', 'plan'],
    estMinutes: 1,
    source: 'seed',
  },
  {
    id: 'iac-l1-first-change-order',
    subject: 'iac',
    level: 1,
    type: 'order',
    title: 'CR-540: your first infra change, done properly',
    scenario:
      'Your first real task: allow port **8443** in the payments security group, via the Terraform repo. Maya reviews your runbook before granting apply rights. Put the steps in the order a careful engineer uses.',
    prompt: 'Arrange the steps:',
    steps: [
      'Edit the security-group rule in main.tf on a branch',
      'Run terraform validate to catch syntax and reference errors',
      'Run terraform plan and read every line of the diff',
      'Get the plan output reviewed in the pull request',
      'Run terraform apply for the approved change',
    ],
    explanation:
      'Edit → **validate** → **plan** → review → apply. `validate` fails fast on typos before you ever hit AWS. `plan` is the ground truth of what will happen — and pasting it into the PR means the *reviewer approves an outcome, not just code*. Only then does apply run. This mirrors the backup/validate/reload rhythm from server land: every cheap check happens before the expensive, irreversible step. Skipping straight from edit to apply works fine — right up until the day the diff contains a destroy you didn’t expect.',
    fundamental: 'plan-before-apply',
    xp: 10,
    tags: ['terraform', 'workflow', 'review'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'iac-l1-plan-replace-symbol',
    subject: 'iac',
    level: 1,
    type: 'mcq',
    title: 'CR-541: what does -/+ mean in this plan?',
    scenario:
      'You are reviewing Tomer’s PR that renames the ledger database identifier. The pasted plan says:',
    artifact:
      '  # aws_db_instance.ledger must be replaced\n-/+ resource "aws_db_instance" "ledger" {\n      ~ identifier = "ledger-db" -> "ledger-db-eu" # forces replacement\n    }\n\nPlan: 1 to add, 0 to change, 1 to destroy.',
    artifactLang: 'text',
    prompt: 'What will apply actually do to the production database?',
    options: [
      'Destroy the existing DB instance and create a new one — a destructive replacement, because this attribute cannot change in place',
      'Rename it in place with a few seconds of downtime',
      'Only update tags and metadata',
      'Nothing — the -/+ symbol means the change was rejected',
    ],
    correctIndex: 3 - 3,
    explanation:
      'Plan symbols are a language: `+` create, `-` destroy, `~` update in place, and **`-/+` destroy-then-recreate**. Some attributes (like an RDS identifier) are immutable in the API, so Terraform’s only path to your desired state is replacement — it even tells you which attribute `# forces replacement`. On a stateless web server that is routine; on **ledger-db** it means data loss unless snapshots and a migration plan exist. Reading plans for these symbols before approving is the single highest-value review habit in IaC.',
    fundamental: 'plan-before-apply',
    xp: 10,
    tags: ['terraform', 'plan', 'replacement'],
    estMinutes: 2,
    source: 'seed',
  },

  // ---------------------------------------------------------------- L2
  {
    id: 'iac-l2-delete-state',
    subject: 'iac',
    level: 2,
    type: 'mcq',
    title: 'INC-3210: "let’s just delete terraform.tfstate and start clean"',
    scenario:
      'An apply failed halfway and now every plan errors on a duplicate resource. Tomer suggests: "delete `terraform.tfstate`, run apply again, fresh start." Dana goes pale.',
    prompt: 'Why is deleting the state file a terrible idea?',
    options: [
      'State is Terraform’s only map between config and real resources — delete it and Terraform forgets everything it built, then plans to create duplicates while the originals run on unmanaged',
      'The state file is needed to compile HCL syntax',
      'AWS blocks all API calls from accounts without a state file',
      'Deleting state instantly destroys the resources it tracked',
    ],
    correctIndex: 0,
    explanation:
      'Config says what you *want*; the **state file records what Terraform actually created and which real IDs belong to which resource blocks**. Delete it and nothing in AWS changes — but Terraform is now amnesiac: the next plan shows every resource as "to create", and applying builds a second VPC, second database, second everything, while the originals become orphans still costing money. Recovery from a bad state is surgery (`terraform state` subcommands, import, or restoring a backup) — never deletion. Treat state like a database, because it is one.',
    fundamental: 'state-source-of-truth',
    xp: 20,
    tags: ['terraform', 'state'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'iac-l2-console-drift',
    subject: 'iac',
    level: 2,
    type: 'mcq',
    title: 'INC-3212: plan shows a change nobody made',
    scenario:
      'Routine pre-window plan for prod-eu prints a diff you did not write:',
    artifact:
      '  # aws_security_group.payments_api will be updated in-place\n  ~ resource "aws_security_group" "payments_api" {\n      - ingress {\n          - cidr_blocks = ["0.0.0.0/0"]\n          - from_port   = 22\n          - to_port     = 22\n        }\n    }\n\nPlan: 0 to add, 1 to change, 0 to destroy.',
    artifactLang: 'text',
    prompt: 'What happened, and what will apply do?',
    options: [
      'Someone opened SSH to the world in the console (drift); apply will remove the manual rule and converge reality back to the code',
      'Terraform corrupted its state and invented a rule; refresh will fix it',
      'The AWS provider added a default SSH rule that must stay',
      'Apply will add the 0.0.0.0/0 rule shown with the minus signs',
    ],
    correctIndex: 0,
    explanation:
      '**Drift** is reality diverging from code — usually a human "quick fix" in the console. Plan detects it because Terraform refreshes real resource attributes and diffs them against config: the minus signs mean *this exists in AWS but not in code, so apply will remove it*. Here drift detection just caught a world-open SSH rule in a payments account — worth an incident review, not just a revert. The discipline: config is the source of intent, so either codify the manual change or let apply erase it. Scheduled `plan` runs make drift a daily report instead of a 3am surprise.',
    fundamental: 'drift-detection',
    xp: 20,
    tags: ['terraform', 'drift', 'security-group'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'iac-l2-variable-sources',
    subject: 'iac',
    level: 2,
    type: 'multi',
    title: 'OPS-1712: same module, different sizes per environment',
    scenario:
      'The payments module declares `variable "instance_type" {}`. Staging should run `t3.medium`, prod `m5.large`. Dana asks which mechanisms can legitimately feed a value into that variable.',
    prompt: 'Which THREE are valid ways to set a Terraform input variable?',
    options: [
      'A terraform.tfvars (or *.auto.tfvars / -var-file) file per environment',
      'The CLI flag -var="instance_type=m5.large"',
      'An environment variable named TF_VAR_instance_type',
      'Editing the value directly into terraform.tfstate',
      'Declaring the value in an output "instance_type" block',
    ],
    correctIndices: [0, 1, 2],
    explanation:
      '**Variables are the input contract** of a configuration — the same code, parameterised per environment. Terraform accepts values from tfvars files, `-var`/`-var-file` flags, and `TF_VAR_*` environment variables (later sources override earlier ones), which is exactly how one module serves staging and prod without copy-paste. The traps: *state* is Terraform’s record of reality, never an input — hand-editing it corrupts the map; and *outputs* are the opposite direction, exporting values (like an ALB DNS name) for humans, scripts or other configurations to consume.',
    fundamental: 'variables-outputs',
    xp: 20,
    tags: ['terraform', 'variables', 'tfvars'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'iac-l2-output-alb-dns',
    subject: 'iac',
    level: 2,
    type: 'command',
    title: 'OPS-1714: hand Dana the ALB address',
    scenario:
      'The new load balancer just applied cleanly. Its address is exported by the config as `output "alb_dns"`. Dana needs the value for her smoke-test script — "read it from Terraform, don’t copy it from the console."',
    prompt: 'Type the command that prints the value of that output.',
    answerPatterns: [
      'terraform output alb_dns',
      'terraform output -raw alb_dns',
      'terraform output -json alb_dns',
      'terraform output',
    ],
    acceptExamples: ['terraform output alb_dns', 'terraform output -raw alb_dns'],
    placeholder: 'terraform …',
    explanation:
      '**Outputs are a configuration’s public interface**: values Terraform computed (IDs, DNS names, ARNs) exposed on purpose, read with `terraform output <name>` straight from state. `-raw` strips the quotes for scripting (`URL=$(terraform output -raw alb_dns)`), `-json` feeds machines. This matters beyond convenience: copying values from the console invites typos and staleness, while outputs always reflect what the last apply actually built — and other configurations can consume them via `terraform_remote_state`, chaining stacks together cleanly.',
    fundamental: 'variables-outputs',
    xp: 20,
    tags: ['terraform', 'outputs'],
    estMinutes: 1,
    source: 'seed',
  },
  {
    id: 'iac-l2-ansible-idempotency',
    subject: 'iac',
    level: 2,
    type: 'spot',
    title: 'CR-542: this playbook breaks a little more every run',
    scenario:
      'Tomer’s Ansible playbook configures the payments hosts. It "works", but after every nightly run the firewall rules file grows and a config-drift alert fires. One task violates the rule that makes Ansible safe to re-run. Find it.',
    snippet:
      '- name: Configure payments hosts\n  hosts: payments\n  become: true\n  tasks:\n    - name: Install nginx\n      apt:\n        name: nginx\n        state: present\n    - name: Allow the checkout port\n      shell: echo "allow 8443" >> /etc/nimbus/firewall.rules\n    - name: Ensure nginx is running\n      service:\n        name: nginx\n        state: started',
    snippetLang: 'yaml',
    buggyLine: 10,
    acceptableLines: [9],
    prompt: 'Click the non-idempotent line.',
    explanation:
      '**Idempotency** means running the same automation twice leaves the system in the same state — the property that makes config management safe on a schedule. Modules like `apt: state=present` and `service: state=started` check reality first and change nothing if it already matches. `shell: echo … >> file` checks nothing: it *appends every run*, so the file grows nightly — one duplicate line per run, forever. The fix is a declarative module (`lineinfile` with the exact line, or a `template` owning the whole file). Rule of thumb: raw `shell`/`command` tasks are guilty of non-idempotency until proven innocent.',
    fundamental: 'idempotency',
    xp: 20,
    tags: ['ansible', 'idempotency'],
    estMinutes: 2,
    source: 'seed',
  },

  // ---------------------------------------------------------------- L3
  {
    id: 'iac-l3-state-lock-error',
    subject: 'iac',
    level: 3,
    type: 'mcq',
    title: 'INC-3230: Error acquiring the state lock',
    scenario:
      'Your 03:20 hotfix apply for prod-eu refuses to start:',
    artifact:
      'Error: Error acquiring the state lock\n\nLock Info:\n  ID:        9f1c22e4-77aa-4b02-b1d2-3c9e1a6f\n  Path:      nimbuspay-tf-state/prod/payments/terraform.tfstate\n  Who:       runner@gh-actions-runner-42\n  Created:   2026-08-02 03:11:09 UTC',
    artifactLang: 'text',
    prompt: 'What is happening, and what is the correct response?',
    options: [
      'A CI apply holds the DynamoDB lock; check whether that run is alive and wait — use terraform force-unlock only after confirming the holder is truly dead',
      'The state file is corrupted; delete it from S3 and re-apply',
      'Run terraform apply -lock=false to bypass the stale lock quickly',
      'DynamoDB is down; retry until the error stops',
    ],
    correctIndex: 0,
    explanation:
      '**State locking exists because two concurrent applies writing one state file corrupt it** — each would save its own view, losing the other’s resources. NimbusPay’s S3 backend uses a DynamoDB lock table so only one operation mutates state at a time; the error is the lock *working*, and `Who` tells you the holder: a GitHub Actions run from nine minutes ago. Check that run first. `force-unlock <ID>` is legitimate only when the holder crashed without releasing; `-lock=false` while another apply is live is how you earn a corrupted-state incident at 4am.',
    fundamental: 'remote-state-locking',
    xp: 35,
    tags: ['terraform', 'state-lock', 'dynamodb'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'iac-l3-import-bucket',
    subject: 'iac',
    level: 3,
    type: 'command',
    title: 'OPS-1730: adopt the hand-made audit bucket',
    scenario:
      'Compliance found an S3 bucket **nimbuspay-audit-logs** that someone created by hand last year. It must come under Terraform management *without being touched*. You have already written the matching block:\n\n```hcl\nresource "aws_s3_bucket" "audit_logs" {\n  bucket = "nimbuspay-audit-logs"\n}\n```',
    prompt: 'Type the command that binds the real bucket to that resource address in state.',
    answerPatterns: [
      'terraform import aws_s3_bucket\\.audit_logs nimbuspay-audit-logs',
      "terraform import 'aws_s3_bucket\\.audit_logs' nimbuspay-audit-logs",
      'terraform import "aws_s3_bucket\\.audit_logs" nimbuspay-audit-logs',
    ],
    acceptExamples: ['terraform import aws_s3_bucket.audit_logs nimbuspay-audit-logs'],
    placeholder: 'terraform import …',
    hint: 'terraform import <resource address> <real-world ID>',
    explanation:
      '`terraform import` writes an entry into **state** linking a resource address to an existing real-world ID — it changes nothing in AWS and nothing in your code. That is the point: adoption, not creation. The full ritual is write the block → import → `terraform plan` until it shows **no changes**, tuning the config to match reality (import alone does not generate config for you, though newer Terraform’s `import` blocks with `-generate-config-out` can help). Skip the import and apply would try to create a bucket whose name is already taken; skip the plan-to-zero step and the next apply "corrects" the live bucket in ways you never reviewed.',
    fundamental: 'resource-import',
    xp: 35,
    tags: ['terraform', 'import', 's3'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'iac-l3-pipeline-order',
    subject: 'iac',
    level: 3,
    type: 'order',
    title: 'OPS-1733: design the infra pipeline gates',
    scenario:
      'After the SSH-drift scare, Maya wants the GitHub Actions pipeline for `nimbus-infra` rebuilt "so a bad change dies at the cheapest possible gate". Order the stages so each one catches what the previous cannot.',
    prompt: 'Arrange the pipeline stages:',
    steps: [
      'terraform fmt -check and terraform validate on the PR',
      'terraform plan -out=tfplan against staging',
      'Policy checks (OPA/conftest) evaluate the plan JSON',
      'Apply the reviewed plan to staging',
      'Smoke tests hit the staging endpoints',
      'Plan, review and apply the same code to prod',
    ],
    explanation:
      '**IaC testing is a funnel ordered by cost**: syntax and reference errors die in seconds (`fmt`/`validate`, no cloud access needed); the plan then materialises *intended changes* so policy engines can veto rule-breakers (public buckets, missing tags) before anything exists; a staging apply proves the change works against real APIs — plan cannot catch quota errors or IAM denies; smoke tests prove the *system* still works, not just the infra; and only survivors reach prod, re-planned because prod state differs from staging’s. Each gate is roughly 10x more expensive than the last — so you want failures as early as possible.',
    fundamental: 'iac-testing',
    xp: 35,
    tags: ['terraform', 'ci', 'testing'],
    estMinutes: 3,
    source: 'seed',
  },
  {
    id: 'iac-l3-unpinned-module',
    subject: 'iac',
    level: 3,
    type: 'mcq',
    title: 'CR-543: the VPC module with no version',
    scenario:
      'Reviewing Dana’s PR that adopts the shared VPC module for a new environment:',
    artifact:
      'module "vpc" {\n  source = "git::https://github.com/nimbuspay/tf-modules.git//vpc"\n  cidr   = "10.40.0.0/16"\n}',
    artifactLang: 'hcl',
    prompt: 'What must be fixed before this merges?',
    options: [
      'The source has no ?ref= pin — every init pulls the module repo’s default branch, so prod can silently change whenever tf-modules moves; pin a tag like ?ref=v1.4.2',
      'Modules cannot take a cidr argument; it must be hardcoded inside the module',
      'git:: sources are forbidden; modules must be copied into the repo',
      'The module block is missing a provider alias, which always fails',
    ],
    correctIndex: 0,
    explanation:
      '**Modules are versioned interfaces, not shared folders.** A module call is a dependency, and unpinned dependencies make builds unreproducible: today’s plan and next month’s plan can pull *different infrastructure code* from the same config — the IaC equivalent of depending on `latest`. Worse, staging pinned yesterday and prod initialised today may differ silently. Pinning `?ref=v1.4.2` (or `version =` for registry modules) makes upgrades deliberate, reviewable diffs: bump the ref, read the plan, roll forward env by env. The variables in, outputs out shape is exactly right — only the version discipline is missing.',
    fundamental: 'module-composition',
    xp: 35,
    tags: ['terraform', 'modules', 'versioning'],
    estMinutes: 2,
    source: 'seed',
  },

  // ---------------------------------------------------------------- L4
  {
    id: 'iac-l4-policy-gate',
    subject: 'iac',
    level: 4,
    type: 'mcq',
    title: 'OPS-1745: "human reviewers missed the public bucket"',
    scenario:
      'Last week a world-readable S3 bucket sailed through PR review and reached prod-eu. The post-incident action item, owned by you: "**automated guardrails** — reviewers should never be the last line of defence." Maya asks how policy-as-code (OPA/Sentinel) actually plugs in.',
    prompt: 'Where does policy-as-code enforcement belong?',
    options: [
      'In the pipeline between plan and apply: rules evaluate the machine-readable plan and block the run on violations — versioned, testable, and applied to every change',
      'As a nightly script that scans the console and emails a report of what already shipped',
      'As an IAM policy denying s3:CreateBucket to everyone, forever',
      'As a mandatory second human approver on every infra PR',
    ],
    correctIndex: 0,
    explanation:
      '**Policy-as-code moves guardrails from human memory into the pipeline.** The plan (exported as JSON via `terraform show -json`) describes every attribute of every intended change *before it exists* — the perfect interception point. Rules like "no `acl = public-read`", "encryption required", "every resource tagged with an owner" run in seconds on each PR, and because the policies are code they are themselves versioned, reviewed and unit-tested. Nightly scans find violations *after* exposure; blanket IAM denies block legitimate work; more reviewers just means more tired eyes. Preventive, automated, at plan time — that is the pattern.',
    fundamental: 'policy-as-code',
    xp: 50,
    tags: ['opa', 'sentinel', 'governance'],
    estMinutes: 3,
    source: 'seed',
  },
  {
    id: 'iac-l4-state-mv-rename',
    subject: 'iac',
    level: 4,
    type: 'command',
    title: 'INC-3250: the refactor that wants to destroy prod',
    scenario:
      'Your cleanup PR renamed `aws_instance.payments` to `aws_instance.payments_api` in code. The prod plan is alarming:',
    artifact:
      '  # aws_instance.payments will be destroyed\n  # (because aws_instance.payments is not in configuration)\n\n  # aws_instance.payments_api will be created\n\nPlan: 1 to add, 0 to change, 1 to destroy.',
    artifactLang: 'text',
    prompt: 'Type the state command that makes the existing instance answer to its new name — no destroy, no create.',
    answerPatterns: [
      'terraform state mv aws_instance\\.payments aws_instance\\.payments_api',
      "terraform state mv 'aws_instance\\.payments' 'aws_instance\\.payments_api'",
      'terraform state mv "aws_instance\\.payments" "aws_instance\\.payments_api"',
    ],
    acceptExamples: ['terraform state mv aws_instance.payments aws_instance.payments_api'],
    placeholder: 'terraform state …',
    hint: 'You are moving a resource to a new address inside the state.',
    explanation:
      'Terraform identifies resources by **state address**, not by what they are in AWS — rename the address in code and Terraform sees "old one gone (destroy), new one wanted (create)". `terraform state mv` re-keys the existing real resource to the new address, after which plan shows **no changes**: pure state surgery, zero API calls to AWS. Two disciplines make it safe: back up first (`terraform state pull > backup.tfstate`) and re-plan to zero as proof. Modern alternative worth knowing: a `moved { from = … to = … }` block ships the rename *inside* the PR, so every workspace migrates automatically — surgery as code.',
    fundamental: 'state-surgery',
    xp: 50,
    tags: ['terraform', 'state-mv', 'refactoring'],
    estMinutes: 3,
    source: 'seed',
  },
  {
    id: 'iac-l4-wrong-account-role',
    subject: 'iac',
    level: 4,
    type: 'spot',
    title: 'CR-545: prod pipeline config — one line will cross the streams',
    scenario:
      'NimbusPay separates staging (account 111111111111) and prod (222222222222) into different AWS accounts on purpose. Dana’s PR wires up the new **prod** payments pipeline. One line quietly defeats the whole isolation model. Find it.',
    snippet:
      'terraform {\n  backend "s3" {\n    bucket         = "nimbuspay-tf-state"\n    key            = "prod/payments/terraform.tfstate"\n    region         = "eu-west-1"\n    dynamodb_table = "tf-locks"\n  }\n}\n\nprovider "aws" {\n  region = "eu-west-1"\n  assume_role {\n    role_arn = "arn:aws:iam::111111111111:role/staging-deployer"\n  }\n}',
    snippetLang: 'hcl',
    buggyLine: 13,
    prompt: 'Click the line that breaks environment isolation.',
    explanation:
      '**Multi-account isolation only works if every layer agrees on which account it is talking to.** The backend stores *prod* state, but the provider assumes the **staging-deployer role in the staging account (111111111111)** — so "prod" applies would build and mutate resources in staging while recording them in prod state: a corrupted map of two environments, and a pipeline whose blast radius quietly spans both. The fix: assume `arn:aws:iam::222222222222:role/prod-deployer`. Mature setups make this mistake impossible — the role ARN comes from a per-environment variable, and a policy check asserts that the state key’s environment matches the target account ID.',
    fundamental: 'environment-isolation',
    xp: 50,
    tags: ['terraform', 'multi-account', 'assume-role'],
    estMinutes: 3,
    source: 'seed',
  },
  {
    id: 'iac-l4-split-state-free',
    subject: 'iac',
    level: 4,
    type: 'free',
    title: 'OPS-1750: split the monolithic state — without destroying anything',
    scenario:
      'The prod-eu root module has become a monolith: **VPC, EKS, RDS (ledger-db), Redis, IAM and app config in one state file**. Plans take 9 minutes, and every apply holds the lock so releases queue behind each other. Yesterday a tag change waited 40 minutes. Maya asks you to write the migration plan to split it into layers — with **zero resources destroyed or recreated**.',
    prompt:
      'Describe your migration plan: the target layout, how resources move between states, and how you prove nothing gets destroyed.',
    rubric:
      'A strong answer must include: (1) backing up state before surgery (terraform state pull > backup file; S3 bucket versioning as a second net); (2) a sensible layer split (e.g. network / data / platform / app), each layer with its own backend key so plans shrink and locks stop colliding; (3) moving resources WITHOUT touching AWS — terraform state mv between state files (or state rm from the monolith plus terraform import into the new layer); (4) re-wiring cross-layer references via terraform_remote_state data sources or data lookups instead of direct resource references; (5) the verification gate: terraform plan in every layer (and the shrinking monolith) must show zero changes before the migration is called done; (6) operational care: a merge/apply freeze during the move, migrating one layer at a time, and a rollback path (restore the backed-up state). Bonus: mentioning smaller blast radius per apply, faster plans, per-layer permissions, and moved blocks as the code-native mechanism.',
    modelAnswer:
      'First I freeze infra merges and take backups: `terraform state pull > prod-eu-monolith.backup.tfstate`, and confirm versioning is on for the state bucket — every step must be reversible. Target layout: four roots with separate state keys — `network` (VPC, subnets, endpoints), `data` (RDS, Redis), `platform` (EKS, IAM), `app` (payments config) — ordered by change frequency so a fast-moving app apply never locks the VPC. Migration, one layer at a time: copy the relevant HCL into the new root, run `terraform init`, then move each resource with `terraform state mv -state=monolith.tfstate -state-out=network.tfstate aws_vpc.main aws_vpc.main` (state surgery only — no AWS API calls). Replace cross-layer references (like subnet IDs) with `terraform_remote_state` data sources. The acceptance gate is non-negotiable: after each layer moves, `terraform plan` must print **no changes** in both the new layer and the remaining monolith; any diff means stop and investigate. When the monolith’s state is empty, retire it. Rollback at any point: restore the backup state and re-point the pipeline.',
    explanation:
      'State surgery moves **pointers, not infrastructure**: `terraform state mv` rewrites which state file claims a resource, while AWS never hears a single API call. That is why the whole migration hinges on one invariant — after every move, `terraform plan` must show **zero changes** on both sides. The plan is your proof that code, state and reality still agree. Backups (state pull + bucket versioning) make each step reversible, and layering roots by change frequency shrinks both blast radius and lock contention forever after.',
    fundamental: 'state-surgery',
    xp: 50,
    tags: ['terraform', 'state', 'architecture'],
    estMinutes: 4,
    source: 'seed',
  },
] satisfies Challenge[]
