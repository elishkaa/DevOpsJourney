import type { Challenge } from '../../types/challenge'

/**
 * Cloud (AWS) — fundamentals vocabulary:
 * region-az-model, shared-responsibility, credential-hygiene, s3-object-model,
 * ec2-lifecycle, sg-stateful-nacl-stateless, iam-policy-evaluation,
 * alb-target-health, vpc-routing, private-egress, autoscaling-signals,
 * cost-attribution, assume-role-trust, permission-boundary, service-quotas,
 * multi-region-failover
 */
export const cloudChallenges = [
  // ---------------------------------------------------------------- L1
  {
    id: 'cloud-l1-region-vs-az',
    subject: 'cloud',
    level: 1,
    type: 'mcq',
    title: 'OPS-1801: why three copies of everything?',
    scenario:
      'Week one at **NimbusPay**. The architecture doc says prod-eu runs across `eu-west-1a`, `eu-west-1b` and `eu-west-1c`. Tomer, also new, asks: "why three zones in one region — wouldn’t one AZ be cheaper, or `us-east-1` as a fourth zone be even safer?"',
    prompt: 'What is the correct mental model of regions and Availability Zones?',
    options: [
      'AZs are physically separate datacenter groups inside one region, linked by fast fibre — multi-AZ survives a datacenter failure cheaply; multi-region is a separate, much bigger decision for surviving regional disasters',
      'AZs are just different racks in the same building, so multi-AZ mainly protects against a single rack dying',
      'A region is a marketing name for one datacenter; eu-west-1a and us-east-1 are equivalent building blocks you can mix freely',
      'All AZs in a region share one power grid and network, so real resilience always requires a second region',
    ],
    correctIndex: 0,
    explanation:
      'AWS geography has two layers. A **region** (like `eu-west-1`) is an independent geographic area; inside it, **Availability Zones** are physically separated groups of datacenters — their own power, cooling and networking — connected by low-latency fibre. Spreading across AZs protects against a building-level failure while keeping replication fast enough to be *synchronous*, which is why it is the default posture for anything stateful like **ledger-db**. Spreading across *regions* protects against a whole-region event, but brings asynchronous replication, data-residency questions and real latency — an architecture project, not a checkbox. The working rule: **AZs for high availability; regions for disaster recovery, latency and compliance.**',
    fundamental: 'region-az-model',
    xp: 10,
    tags: ['regions', 'availability-zones'],
    estMinutes: 1,
    source: 'seed',
  },
  {
    id: 'cloud-l1-shared-responsibility',
    subject: 'cloud',
    level: 1,
    type: 'multi',
    title: 'OPS-1802: the auditor asks who patches what',
    scenario:
      'A PCI auditor is on-site. Her first question comes straight from the **shared responsibility model**: "for the EC2 instances running `checkout-web`, list what NimbusPay must secure — versus what AWS handles." Maya slides the question over to you.',
    prompt: 'Which THREE of these are NimbusPay’s responsibility?',
    options: [
      'Patching the Ubuntu guest OS on the instances',
      'Writing the security-group rules that control traffic to the instances',
      'Rotating the database credentials checkout-web uses',
      'Replacing failed drives in the eu-west-1 datacenters',
      'Patching the hypervisor the instances run on',
    ],
    correctIndices: [0, 1, 2],
    explanation:
      'The **shared responsibility model** draws the security line: AWS secures the *cloud itself* — facilities, hardware, hypervisor — and you secure *what you put in it*. For EC2 that means the guest OS and its patches, the network rules you define, IAM, your data and your secrets are NimbusPay’s job. The line *moves with the service*: on RDS, AWS patches the database OS for you; on Lambda, the runtime too — one reason managed services shrink your audit surface. Auditors start here because the overwhelming majority of cloud breaches are customer-side misconfigurations (open buckets, leaked keys), not AWS failures — so the line decides your entire patching and hardening programme.',
    fundamental: 'shared-responsibility',
    xp: 10,
    tags: ['shared-responsibility', 'compliance'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'cloud-l1-whoami',
    subject: 'cloud',
    level: 1,
    type: 'command',
    title: 'OPS-1803: which account is this shell pointed at?',
    scenario:
      'New laptop, two AWS profiles configured. Maya’s onboarding doc, step one, in bold: "**before you run anything against AWS, confirm which identity your shell is actually using**".',
    artifact:
      '$ cat ~/.aws/config\n[profile nimbus-staging]\nsso_account_id = 111111111111\n\n[profile nimbus-prod]\nsso_account_id = 222222222222',
    artifactLang: 'ini',
    prompt: 'Type the command that prints the account and ARN of the credentials your CLI is currently using.',
    answerPatterns: [
      'aws sts get-caller-identity',
      'aws sts get-caller-identity(?: --profile \\S+)?(?: --output (?:json|table|text))?',
      'aws sts get-caller-identity --output (?:json|table|text)',
    ],
    acceptExamples: ['aws sts get-caller-identity'],
    placeholder: 'aws …',
    explanation:
      'The CLI resolves credentials from a chain — environment variables, `--profile`, SSO cache, instance role — and the winner is not always the one you assume. `aws sts get-caller-identity` asks STS to decode the credentials actually in use and returns the **account ID, ARN and user ID**; it requires no permissions and works for any valid principal. Make it a reflex before any mutating command in a multi-account setup: half of all "wrong environment" incidents begin with a shell quietly pointed at the wrong profile. It is also the first `AccessDenied` debugging step — before asking *why was I denied*, confirm **who "I" even is**.',
    fundamental: 'credential-hygiene',
    xp: 10,
    tags: ['aws-cli', 'sts', 'identity'],
    estMinutes: 1,
    source: 'seed',
  },
  {
    id: 'cloud-l1-bucket-namespace',
    subject: 'cloud',
    level: 1,
    type: 'mcq',
    title: 'OPS-1804: BucketAlreadyExists — but we own no such bucket',
    scenario: 'Your PR creates an S3 bucket for invoice exports. CI fails on apply:',
    artifact:
      'Error: creating S3 Bucket (invoices): BucketAlreadyExists: The requested\nbucket name is not available. The bucket namespace is shared by all users\nof the system. Please select a different name and try again.',
    artifactLang: 'text',
    prompt: 'Nobody at NimbusPay owns a bucket called `invoices`. Why did creation fail?',
    options: [
      'Bucket names are globally unique across every AWS account in the world — someone, somewhere owns `invoices`; use a prefixed name like `nimbuspay-invoices-prod-eu`',
      'The name is shorter than the 12-character S3 minimum',
      'Buckets must be created in us-east-1 before they can exist in eu-west-1',
      'S3 is having an outage in eu-west-1; retry until it succeeds',
    ],
    correctIndex: 0,
    explanation:
      'S3 bucket names live in **one global namespace shared by every AWS account on Earth** — if anyone anywhere owns `invoices`, nobody else can create it, and the API answers `BucketAlreadyExists`. Inside a bucket the model is flat: **objects** stored under **keys**, where `reports/2026/07.csv` is one key whose prefixes merely look like folders. Practical consequences: always prefix names with org, purpose and environment (`nimbuspay-invoices-prod-eu`) so collisions stop happening, and treat names as unclaimable — never assume a name will be free, and never let code trust a bucket your account does not verifiably own, because predictable names invite squatting.',
    fundamental: 's3-object-model',
    xp: 10,
    tags: ['s3', 'naming'],
    estMinutes: 1,
    source: 'seed',
  },
  {
    id: 'cloud-l1-instance-role',
    subject: 'cloud',
    level: 1,
    type: 'mcq',
    title: 'INC-3301: access keys baked into the AMI',
    scenario:
      'The new secret scanner blocks Tomer’s deploy: a pair of long-lived access keys (`AKIA…`) sits in the `.env` file baked into the checkout-web AMI. Tomer pushes back: "the app *needs* S3 access — where else would credentials come from?"',
    prompt: 'What is the right way for an EC2-hosted app to get AWS permissions?',
    options: [
      'Attach an IAM role via an instance profile — the app receives short-lived, auto-rotated credentials from the instance metadata service, and no secret is stored on disk at all',
      'Keep the keys in the AMI but base64-encode them so scanners stop flagging them',
      'Create one shared IAM user for all servers and rotate its keys once a year',
      'Put the keys in a private S3 bucket that the app downloads at boot',
    ],
    correctIndex: 0,
    explanation:
      'Long-lived access keys are the classic cloud breach: baked into an AMI they leak through snapshots, repos and old laptops, they never expire, and rotating them means redeploying everything. The right pattern for anything running *inside* AWS is an **IAM role via an instance profile**: the instance fetches **short-lived STS credentials from the metadata service (IMDSv2)**, the SDK and CLI pick them up automatically with zero code changes, rotation is continuous, and revocation is one API call. Least privilege comes along free — the role carries exactly the S3 permissions checkout-web needs and nothing more. Keys are for the rare humans and external systems that genuinely cannot use a role.',
    fundamental: 'credential-hygiene',
    xp: 10,
    tags: ['iam', 'ec2', 'credentials'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'cloud-l1-ephemeral-public-ip',
    subject: 'cloud',
    level: 1,
    type: 'mcq',
    title: 'INC-3302: the partner bank rejects our uploads',
    scenario:
      'A partner bank whitelists the exact public IP of the reporting instance that pushes them settlement files. Overnight, Dana stopped and started that instance to change its type. Now the partner’s SFTP rejects every upload: **connection from unknown IP**.',
    prompt: 'What happened, and what is the durable fix?',
    options: [
      'The auto-assigned public IPv4 was released at stop and replaced at start — associate an **Elastic IP** so the address survives stop/start (and long-term, stop whitelisting individual instance IPs)',
      'AWS rotates all public IPs every 24 hours for security; the partner must re-whitelist daily',
      'Changing the instance type moved it to a different region, which changed its IP',
      'Stopping an instance deletes it; Dana actually created a brand-new instance, hence the new IP',
    ],
    correctIndex: 0,
    explanation:
      'On **stop**, an instance leaves its physical host: EBS volumes and the private IP survive, but an *auto-assigned* public IPv4 returns to the pool, and **start** draws a fresh one (a reboot keeps it; terminate deletes the instance and its identity entirely). Dana’s resize therefore silently broke the whitelist. An **Elastic IP** is a static address your account owns and associates — it survives stop/start and can move between instances. The deeper lesson: pinning a partner contract to an instance’s address couples it to your most disposable resource; long-term, put the traffic behind something stable (NLB static IPs, or a NAT gateway’s EIP for egress) — but today, an EIP unblocks the partner.',
    fundamental: 'ec2-lifecycle',
    xp: 10,
    tags: ['ec2', 'elastic-ip'],
    estMinutes: 2,
    source: 'seed',
  },

  // ---------------------------------------------------------------- L2
  {
    id: 'cloud-l2-nacl-return-traffic',
    subject: 'cloud',
    level: 2,
    type: 'mcq',
    title: 'INC-3310: the hardened subnet stopped answering',
    scenario:
      'After a compliance review, Dana replaces the default NACL on the payments subnets with a locked-down one: inbound allows 443 from the ALB subnets, outbound allows 443 to anywhere. Within minutes, **every request through the ALB hangs and times out** — yet the security groups are untouched and correct.',
    prompt: 'Why did the subnet stop answering, and why did security groups alone never need such rules?',
    options: [
      'NACLs are **stateless** — response packets are filtered like any other traffic, and responses go back to the client’s ephemeral port (1024–65535), which "outbound 443 only" blocks; security groups are **stateful** and allow return traffic automatically',
      'NACLs override security groups entirely, so the SG rules stopped applying the moment a custom NACL appeared',
      'The NACL is missing an inbound rule for port 80, which ALBs require for health checks',
      'NACLs only take effect after every instance in the subnet reboots, so the timeouts are a propagation delay',
    ],
    correctIndex: 0,
    explanation:
      '**Security groups are stateful**: they track connections, so the reply to an allowed request is allowed automatically — you never write "return traffic" rules. **NACLs are stateless**: every packet is checked against the numbered rules with no connection memory, in each direction independently. A client connects to 443; the response leaves from port 443 *toward the client’s ephemeral port* (1024–65535) — and Dana’s outbound rules only allow destination port 443, so replies die at the subnet boundary and every connection hangs. The default NACL allows everything, which is why SG-only setups never notice this. Fix: allow outbound to the ephemeral range. Practice: SGs are the precision tool; NACLs are coarse subnet guardrails.',
    fundamental: 'sg-stateful-nacl-stateless',
    xp: 20,
    tags: ['nacl', 'security-groups', 'vpc'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'cloud-l2-policy-evaluation',
    subject: 'cloud',
    level: 2,
    type: 'multi',
    title: 'OPS-1812: "but my policy says s3:*!"',
    scenario:
      'Lunch-and-learn. Tomer is confused: "my role has `s3:*` on the data-lake bucket, but I still get `AccessDenied` on one prefix — and attaching yet another allow policy didn’t help." Dana turns it into a quiz on **how IAM actually evaluates a request**.',
    prompt: 'Which THREE statements about IAM policy evaluation are true?',
    options: [
      'By default everything is denied — access exists only if some policy explicitly allows it',
      'An explicit Deny in any applicable policy overrides every Allow, no matter where the allow lives',
      'Permissions from multiple attached policies combine as the union of all their Allow statements',
      'When two policies conflict, the most recently attached policy wins',
      'An Allow in an identity policy overrides a deny coming from a service control policy (SCP)',
    ],
    correctIndices: [0, 1, 2],
    explanation:
      'IAM evaluation is a fixed algorithm, not a pile of heuristics: start from **implicit deny**; gather every applicable policy; if any **explicit `Deny`** matches, the request dies — nothing outranks it; otherwise the request succeeds if *any* policy allows it, so multiple policies **union** their allows. Attachment order and recency mean nothing. Around that core sit the caps: SCPs, permission boundaries and session policies do not grant anything — they *limit which allows may take effect*, and an identity `Allow` never beats them. Debug `AccessDenied` in exactly that order: is it explicitly denied somewhere? is it allowed anywhere? is a guardrail capping the allow? Tomer’s `s3:*` is losing to a deny — by design.',
    fundamental: 'iam-policy-evaluation',
    xp: 20,
    tags: ['iam', 'policy-evaluation'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'cloud-l2-target-health-cli',
    subject: 'cloud',
    level: 2,
    type: 'command',
    title: 'INC-3311: ask the ALB what it thinks of its targets',
    scenario:
      'PagerDuty, 07:40: checkout error rate through the roof. The ALB is answering, the app "looks fine" in Grafana. Dana on the bridge: "ask the load balancer what *it* thinks — pull the health of every target in the checkout target group."',
    artifact:
      'ALERT #7712 checkout-web availability\nHTTPCode_ELB_502_Count (5m): 214\nTarget group:\narn:aws:elasticloadbalancing:eu-west-1:222222222222:targetgroup/checkout-web-tg/73e2d6bc24d8a067',
    artifactLang: 'text',
    prompt: 'Type the AWS CLI command that lists each target and its health state for that target group.',
    answerPatterns: [
      'aws elbv2 describe-target-health --target-group-arn \\S+',
      'aws elbv2 describe-target-health --target-group-arn \\S+(?: --output (?:json|table|text))?',
    ],
    acceptExamples: [
      'aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:eu-west-1:222222222222:targetgroup/checkout-web-tg/73e2d6bc24d8a067',
    ],
    placeholder: 'aws elbv2 …',
    hint: 'The service is elbv2; the command needs the target group ARN from the alert.',
    explanation:
      'A **target group** is the ALB’s registry of backends plus its verdict on each one: `healthy`, `unhealthy`, `draining`, `unused`. When an ALB throws 5xx, your first question is "does the LB currently have anyone healthy to send traffic to?" — `describe-target-health` answers it in one call, and its `Reason` codes point at the failing layer: `Target.Timeout` means packets never arrive (security groups, routing), `Target.FailedHealthChecks` means the app answered wrongly (bad status or path), `Target.NotInUse` means registration or AZ mismatch. A 502/503 storm with zero healthy targets is a health-check problem, not a traffic problem — fix the checks and the errors stop themselves.',
    fundamental: 'alb-target-health',
    xp: 20,
    tags: ['aws-cli', 'alb', 'target-groups'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'cloud-l2-object-arn-bug',
    subject: 'cloud',
    level: 2,
    type: 'spot',
    title: 'CR-561: the read-only policy that cannot read',
    scenario:
      'Tomer’s PR adds a read-only IAM policy for the new `invoice-exporter` service. In staging the service lists the bucket fine, but every download fails with `AccessDenied` — "even though the policy clearly allows GetObject!" One line is wrong. Find it.',
    snippet:
      '{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Sid": "InvoiceRead",\n      "Effect": "Allow",\n      "Action": ["s3:GetObject"],\n      "Resource": "arn:aws:s3:::nimbuspay-invoices"\n    },\n    {\n      "Sid": "InvoiceList",\n      "Effect": "Allow",\n      "Action": ["s3:ListBucket"],\n      "Resource": "arn:aws:s3:::nimbuspay-invoices"\n    }\n  ]\n}',
    snippetLang: 'json',
    buggyLine: 8,
    acceptableLines: [7],
    prompt: 'Click the line that causes the AccessDenied.',
    explanation:
      'IAM matches an action against the **resource type that action operates on**. `s3:ListBucket` is a *bucket* action, so `arn:aws:s3:::nimbuspay-invoices` is correct for it; but `s3:GetObject` is an *object* action, and objects have their own ARN form: `arn:aws:s3:::nimbuspay-invoices/*`. A statement allowing an object action on a bucket ARN matches **no request at all**, and unmatched requests fall through to the implicit deny — hence `AccessDenied` while the policy "clearly allows it". This bucket-vs-object split is the single most common S3 policy bug. Fix line 8 to `"Resource": "arn:aws:s3:::nimbuspay-invoices/*"` — and remember most read policies need *both* statements: `ListBucket` on the bucket, `GetObject` on `bucket/*`.',
    fundamental: 'iam-policy-evaluation',
    xp: 20,
    tags: ['iam', 's3', 'policy'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'cloud-l2-alb-sg-reference',
    subject: 'cloud',
    level: 2,
    type: 'mcq',
    title: 'INC-3312: every target unhealthy, app perfectly fine',
    scenario:
      'The sequel to INC-3311: the target health you pulled explains the 502s — every target is failing its checks. The instances’ security group allows port 8080 **only from the office VPN range**, a leftover from early manual testing.',
    artifact:
      '{\n  "TargetHealthDescriptions": [\n    {\n      "Target": { "Id": "i-0f3a9c1b2d4e5a6b7", "Port": 8080 },\n      "TargetHealth": {\n        "State": "unhealthy",\n        "Reason": "Target.Timeout",\n        "Description": "Request timed out"\n      }\n    }\n  ]\n}',
    artifactLang: 'json',
    prompt: 'Why are the health checks failing, and what is the correct fix?',
    options: [
      'Health checks originate from the **ALB’s own nodes inside the VPC** — add an inbound rule on port 8080 whose source is *the ALB’s security group*, so checks and traffic are admitted no matter how the ALB scales',
      'Health checks come from AWS’s public IP ranges — open port 8080 to 0.0.0.0/0',
      'ALB health checks use ICMP ping, so the security group needs an ICMP allow rule',
      'The ALB verifies targets over SSH before sending traffic — port 22 must be open to the ALB',
    ],
    correctIndex: 0,
    explanation:
      'ALB health checks do not come from the internet — they originate from the **load balancer’s own network interfaces inside your subnets**, carrying the ALB’s security group. An instance SG that only admits the office VPN silently times those probes out; the target flips `unhealthy`, the ALB pulls it from rotation, and users get 502s even though the app is fine. The fix doubles as the fundamental habit: **reference security groups, not CIDRs** — an inbound rule on port 8080 sourced from *the ALB’s SG* stays correct no matter how the ALB scales or renumbers. The full chain: world → ALB (443 open) → targets (traffic port open *only* to the ALB’s SG).',
    fundamental: 'alb-target-health',
    xp: 20,
    tags: ['alb', 'security-groups', 'health-checks'],
    estMinutes: 2,
    source: 'seed',
  },

  // ---------------------------------------------------------------- L3
  {
    id: 'cloud-l3-private-egress-nat',
    subject: 'cloud',
    level: 3,
    type: 'mcq',
    title: 'INC-3320: private nodes cannot reach anything',
    scenario:
      'Dana adds a new **private** subnet pair for the payments-api node group. Pods on the new nodes cannot pull public images or reach the card network’s API. The subnet’s route table:',
    artifact: 'Destination        Target\n10.20.0.0/16       local',
    artifactLang: 'text',
    prompt:
      'What gives these private nodes outbound internet access without exposing them to inbound connections?',
    options: [
      'A **NAT gateway in a public subnet**, plus a `0.0.0.0/0` route to it in the private route table — outbound-initiated traffic leaves via the NAT’s Elastic IP, and no inbound path exists',
      'A `0.0.0.0/0` route straight to the internet gateway — the IGW handles private instances automatically',
      'Enable auto-assign public IPs on the subnet so each node can reach the internet directly',
      'Attach a second internet gateway dedicated to the private subnets',
    ],
    correctIndex: 0,
    explanation:
      '"Public" and "private" are not subnet settings — they are **routing facts**. A subnet is public when its route table sends `0.0.0.0/0` to an **internet gateway**, and the IGW only works as a 1:1 NAT for instances that hold public IPs: a route to the IGW without public IPs blackholes, and handing the nodes public IPs would expose them. The pattern for private subnets is a **NAT gateway**: it lives *in a public subnet* with an Elastic IP, and the private route table points `0.0.0.0/0` at it. Connections can only be *initiated outward* — replies flow back through the NAT’s connection state, but nothing outside can open a connection in. Outbound yes, inbound never: exactly what a private node group needs.',
    fundamental: 'vpc-routing',
    xp: 35,
    tags: ['vpc', 'nat-gateway', 'routing'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'cloud-l3-nat-bill-triage',
    subject: 'cloud',
    level: 3,
    type: 'order',
    title: 'INC-3321: the bill is at 240% and climbing',
    scenario:
      'Finance escalates: month-to-date AWS spend for prod-eu is at **240% of budget**, with no change in instance counts. Maya: "find it, fix it, and make sure the next one can’t hide for three weeks." Put your triage steps in order.',
    prompt: 'Arrange the steps:',
    steps: [
      'Open Cost Explorer grouped by service to find which line item is growing',
      'Drill into usage type and region — the spike is NAT gateway data processing (per-GB) in eu-west-1',
      'Use VPC Flow Logs to attribute the gigabytes: payments-api is pulling from S3 through the NAT',
      'Add an S3 gateway endpoint to the private route tables so S3 traffic bypasses the NAT',
      'Verify the drop at daily granularity and add a cost anomaly alert for next time',
    ],
    explanation:
      'Cost triage is incident triage with a different dashboard: **measure → attribute → root-cause → fix → guard**. Cost Explorer grouped by service names the offender; usage type and region turn a vague "EC2-Other" into the real line item — NAT gateway **data processing**, billed for every gigabyte that transits the NAT. Flow Logs then attribute those gigabytes to a workload: payments-api fetching from S3 *through* the NAT, the classic silent burner. The architectural fix beats any amount of dashboard-staring: an **S3 gateway endpoint** keeps that traffic on the AWS backbone for free. Finally, verify at daily granularity and add an anomaly alert — a bill you only read monthly is an incident you detect thirty days late.',
    fundamental: 'cost-attribution',
    xp: 35,
    tags: ['cost', 'nat-gateway', 'finops'],
    estMinutes: 3,
    source: 'seed',
  },
  {
    id: 'cloud-l3-average-cpu-trap',
    subject: 'cloud',
    level: 3,
    type: 'mcq',
    title: 'INC-3322: latency on fire, autoscaler asleep',
    scenario:
      'Payday traffic. The checkout p99 alarm fires, but the checkout-web ASG sits at 4 instances and refuses to grow. The scaling policy and per-instance CPU:',
    artifact:
      'ASG checkout-web-asg  desired=4  min=2  max=12\nPolicy: target-tracking on ASGAverageCPUUtilization, target=60%\n\nInstance CPU (5m avg):\n  i-0a91…  97%\n  i-0b22…  21%\n  i-0c7f…  18%\n  i-0d40…  19%     → group average: 39%',
    artifactLang: 'text',
    prompt: 'Why is there no scale-out, and what is the right fix?',
    options: [
      'Target tracking follows the **group average**, and one pinned instance cannot move it — scale on a demand-proportional signal like `ALBRequestCountPerTarget`, and fix whatever is skewing load onto one instance',
      'Max capacity has been reached, which silently disables the scaling policy',
      'CloudWatch publishes CPU metrics only once per day, far too slow for scaling decisions',
      'ASGs refuse to scale while any single instance is above 90% CPU, to protect it during rebalancing',
    ],
    correctIndex: 0,
    explanation:
      'A scaling policy is only as good as its **signal**. Target tracking on `ASGAverageCPUUtilization` moves on the *group average* — and averages hide skew: one instance pinned at 97% while three idle averages out to 39%, so the policy is behaving exactly as configured while users suffer. Two fixes, in order: scale on a metric **proportional to demand per instance** — `ALBRequestCountPerTarget` is purpose-built for this — so load, not CPU accounting, drives capacity; then hunt the *cause* of the skew (sticky sessions, hot cache keys, uneven routing), because a fleet that cannot spread load will not be saved by more instances. Lowering the CPU target instead just buys permanent over-provisioning to mask a routing bug.',
    fundamental: 'autoscaling-signals',
    xp: 35,
    tags: ['autoscaling', 'cloudwatch', 'alb'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'cloud-l3-vpc-endpoints',
    subject: 'cloud',
    level: 3,
    type: 'multi',
    title: 'OPS-1830: S3 and ECR without touching the NAT',
    scenario:
      'Post-incident action from INC-3321, assigned to you: "private subnets must reach **S3 and ECR** without a NAT gateway in the path — for cost, and so image pulls keep working even if the NAT dies."',
    prompt: 'Which TWO changes achieve this?',
    options: [
      'Add an **S3 gateway endpoint** and put it in the private route tables — free, and S3 traffic stays on the AWS network',
      'Create **interface endpoints** for `ecr.api` and `ecr.dkr` in the private subnets (image pulls also need the S3 endpoint, since layers live in S3)',
      'Attach an internet gateway to the private route tables for AWS-bound traffic only',
      'Give the nodes public IPs so their S3 traffic no longer transits the NAT',
      'Resize the NAT gateway to a larger tier with cheaper per-GB pricing',
    ],
    correctIndices: [0, 1],
    explanation:
      'VPC endpoints give private subnets a path to AWS services that never touches the internet — or the NAT bill. Two kinds: **gateway endpoints** (S3 and DynamoDB only) are free route-table entries; **interface endpoints** (PrivateLink, nearly everything else) are ENIs with private IPs, billed hourly plus per-GB but far cheaper than NAT data processing at volume. The ECR subtlety that catches everyone: image pulls need `ecr.api` *and* `ecr.dkr` **and the S3 gateway endpoint**, because image layers are stored in S3. IGWs, public IPs and "bigger NATs" all miss the point (managed NAT has no size tiers anyway): the goal is traffic that stays on the AWS network — more private *and* dramatically cheaper.',
    fundamental: 'private-egress',
    xp: 35,
    tags: ['vpc-endpoints', 'ecr', 's3'],
    estMinutes: 2,
    source: 'seed',
  },

  // ---------------------------------------------------------------- L4
  {
    id: 'cloud-l4-assume-role-cli',
    subject: 'cloud',
    level: 4,
    type: 'command',
    title: 'INC-3350: borrow prod access, leave a paper trail',
    scenario:
      'Sev-2 in prod. Your SSO user holds **no standing permissions** in the prod account — by design. The break-glass path is assuming `arn:aws:iam::222222222222:role/prod-eu-readonly`. Maya: "use the ticket ID as the session name, so CloudTrail explains itself six months from now."',
    prompt: 'Type the STS command that assumes that role with session name `inc-3350`.',
    answerPatterns: [
      'aws sts assume-role --role-arn arn:aws:iam::222222222222:role/prod-eu-readonly --role-session-name \\S+(?: --duration-seconds \\d+)?',
      'aws sts assume-role --role-session-name \\S+ --role-arn arn:aws:iam::222222222222:role/prod-eu-readonly(?: --duration-seconds \\d+)?',
    ],
    acceptExamples: [
      'aws sts assume-role --role-arn arn:aws:iam::222222222222:role/prod-eu-readonly --role-session-name inc-3350',
    ],
    placeholder: 'aws sts …',
    hint: 'aws sts assume-role needs the role ARN and a session name.',
    explanation:
      '**AssumeRole is the credential mechanism of multi-account AWS.** STS checks two sides of a handshake — the role’s *trust policy* must name your principal, and your own policy must allow `sts:AssumeRole` on that role — then issues **short-lived credentials** (an hour by default) for the role. Nobody holds standing prod power; you *borrow* it, scoped and expiring. The `--role-session-name` is not decoration: it is stamped onto every CloudTrail event the session produces, which is why NimbusPay mandates ticket IDs as session names — `inc-3350` explains *why* someone was reading prod long after everyone forgot. Export the three returned values (AccessKeyId, SecretAccessKey, SessionToken) and you *are* the role until they expire.',
    fundamental: 'assume-role-trust',
    xp: 50,
    tags: ['sts', 'assume-role', 'multi-account'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'cloud-l4-permission-boundary',
    subject: 'cloud',
    level: 4,
    type: 'mcq',
    title: 'CR-565: the role that allows itself something it cannot do',
    scenario:
      'The platform team lets CI create IAM roles for services — on one condition, enforced on the `deployer` role: every created role must carry the permission boundary `NimbusPayWorkloadBoundary`. Tomer’s new `invoice-exporter` role has an identity policy allowing `dynamodb:PutItem`, yet:',
    artifact:
      'AccessDenied: User: arn:aws:sts::222222222222:assumed-role/invoice-exporter/task\nis not authorized to perform: dynamodb:PutItem on resource:\ntable/invoice-idempotency because no permissions boundary allows the\ndynamodb:PutItem action\n\nNimbusPayWorkloadBoundary allows: s3:*, sqs:*, logs:* (on nimbuspay-* resources)',
    artifactLang: 'text',
    prompt: 'Why is the request denied even though the role’s own policy allows it?',
    options: [
      'Effective permissions are the **intersection** of the identity policy and the permission boundary — the boundary includes no DynamoDB actions, so the allow can never take effect; boundaries cap permissions, they grant nothing',
      'The boundary must also be attached to the DynamoDB table itself, and it is not',
      'The role’s trust policy needs to list DynamoDB as a trusted service before the action can be allowed',
      'The deployer role that created invoice-exporter lacks DynamoDB permissions, and created roles inherit their creator’s limits',
    ],
    correctIndex: 0,
    explanation:
      'A **permission boundary** is a cap, not a grant: effective permissions are the **intersection** of the identity’s policies and its boundary (with explicit denies, and org-level SCPs, still trumping everything). The role’s policy allows `dynamodb:PutItem`; the boundary allows only S3, SQS and logs — the intersection contains no DynamoDB, so the request falls to implicit deny, and the error says so precisely: *"no permissions boundary allows"*. Boundaries exist to make **delegation safe**: CI may mint roles freely, but every minted role is capped, so a compromised pipeline cannot create an admin. That is also why the fix routes through the boundary’s owners on the platform team — piling more allows onto the role’s own policy changes nothing.',
    fundamental: 'permission-boundary',
    xp: 50,
    tags: ['iam', 'permission-boundary'],
    estMinutes: 3,
    source: 'seed',
  },
  {
    id: 'cloud-l4-vcpu-quota',
    subject: 'cloud',
    level: 4,
    type: 'mcq',
    title: 'INC-3351: the scale-out that hit an invisible wall',
    scenario:
      'Marketing’s "surprise" campaign triples checkout traffic. The checkout-web ASG tries to scale from 12 toward 28 instances (ASG max: 40) and stalls at 16. Scaling activity history:',
    artifact:
      'Launching a new EC2 instance failed: You have requested more vCPU capacity\nthan your current vCPU limit of 64 allows for the instance bucket that the\nspecified instance type belongs to. Please visit\nhttp://aws.amazon.com/contact-us/ec2-request to request an adjusted limit.',
    artifactLang: 'text',
    prompt: 'What actually blocked the scale-out, and what is the right long-term posture?',
    options: [
      'A per-region **service quota** (Running On-Demand Standard vCPUs) is exhausted — request the increase now, and long-term: alarm on quota usage and raise limits *ahead of* known events, because the pool is shared by every workload in the account and region',
      'eu-west-1 has physically run out of servers — the only fix is failing over to another region',
      'The ASG’s own max was reached; raising max in the ASG settings would have let the launches through',
      'These are Spot interruptions; switching the ASG to On-Demand instances makes the error disappear',
    ],
    correctIndex: 0,
    explanation:
      '**Service quotas are per-account, per-region soft limits** — for EC2 On-Demand, a *vCPU-based* pool shared across the standard instance families and by **every workload in the account and region**: checkout-web’s scale-out and a data team’s batch job drain the same 64-vCPU bucket. Note this is a quota error, not a capacity error — `InsufficientInstanceCapacity` (AWS genuinely short of hardware in an AZ) reads differently and has different fixes. The mature posture: know your peak vCPU math per region, **request increases before launches** (they can take hours or days), alarm at ~80% on the usage metrics Service Quotas publishes to CloudWatch, and put "quota headroom checked" into every launch-readiness review. Raising limits mid-incident is the posture you are trying to retire.',
    fundamental: 'service-quotas',
    xp: 50,
    tags: ['service-quotas', 'ec2', 'autoscaling'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'cloud-l4-region-failover-free',
    subject: 'cloud',
    level: 4,
    type: 'free',
    title: 'OPS-1850: make payments survive losing eu-west-1',
    scenario:
      'After June’s four-hour eu-west-1 degradation (INC-3349), the board signed a mandate: **payments must survive a full region outage** with RTO 15 minutes and RPO ≤ 1 minute. Today everything — EKS prod-eu, ledger-db (RDS Postgres), Redis, S3 — lives in `eu-west-1`, deployed by Terraform. Maya: "write the failover design; assume `eu-central-1` is the standby."',
    prompt:
      'Describe your multi-region failover design: what runs in eu-central-1, how data replicates, how traffic moves over, and how you prove the RTO/RPO numbers are real.',
    rubric:
      'A strong answer must include: (1) an explicit strategy choice — warm standby (active-passive) vs active-active — justified against RTO 15 min / RPO ≤ 1 min and cost; (2) the data layer: a cross-region replica for ledger-db (RDS read replica or Aurora Global Database), acknowledgement that replication is asynchronous so RPO > 0, an explicit promotion step during failover, and a plan for reconciling writes lost in replication lag; (3) traffic: Route 53 failover (or latency) routing with health checks and low TTLs, plus a deliberate trigger — human decision or well-tested automation — that avoids flapping and split-brain (never two writable primaries); (4) standby readiness: the same Terraform provisioning eu-central-1 (separate state), container images and secrets replicated, and service quotas raised in the standby region ahead of time; (5) rehearsal: scheduled game days that actually execute the failover, a runbook, and measured RTO/RPO compared against the targets. Bonus: S3 cross-region replication, Redis rebuild-vs-replicate reasoning, failback plan, cost of warm standby.',
    modelAnswer:
      'I would run **warm standby in eu-central-1**: full infrastructure applied by the same Terraform modules under a separate state key, EKS at minimal node count, images replicated into an eu-central-1 ECR registry, secrets synced — active-active doubles the consistency problem for a payments ledger, and a 15-minute RTO does not require it. Data: ledger-db gets a **cross-region read replica**; replication is asynchronous, so I monitor replica lag with an alarm at 45 seconds to protect the RPO ≤ 1 min promise. Failover promotes the replica to writable, and a reconciliation job compares the last minute of transactions against the card processor’s records to find anything lost in the lag window. Redis is cache — rebuilt cold, not replicated. Traffic: Route 53 **failover routing** with health checks on the eu-west-1 ALB and 60-second TTLs; DNS shifts automatically, but promotion is a human runbook decision — an explicit "accept RPO loss" gate — so a flapping health check can never create two writable databases. Standby readiness includes **service quotas raised in eu-central-1** (vCPUs, EIPs, NAT gateways), verified quarterly. Finally, **game days**: fail over staging quarterly and prod annually, measure actual RTO/RPO, and report those drill numbers — not the architecture diagram — to the board.',
    explanation:
      'A region is AWS’s largest blast-radius unit, so surviving one means owning three hard problems *in order*. **Data first**: cross-region replication for RDS is asynchronous, so RPO is never zero — failover *chooses* to lose the last seconds of writes, and promotion is a one-way door that demands a reconciliation story. **Capacity second**: a standby region is fiction unless images, secrets, infrastructure code *and service quotas* are already there — quota requests do not process faster because you are down. **Traffic last**: Route 53 health-checked failover with low TTLs is the easy part, but the trigger must be deliberate to avoid split-brain with two writable primaries. And none of it is real until rehearsed: a DR plan that has never run in a game day is a document, not a capability — measured RTO/RPO from drills is the only number worth reporting.',
    fundamental: 'multi-region-failover',
    xp: 50,
    tags: ['multi-region', 'disaster-recovery', 'route53'],
    estMinutes: 4,
    source: 'seed',
  },
] satisfies Challenge[]
