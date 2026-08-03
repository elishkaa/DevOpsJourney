import type { Challenge } from '../../types/challenge'

/**
 * Observability — fundamentals vocabulary:
 * three-pillars, log-severity, percentiles-tail-latency, metrics-exposition,
 * golden-signals, promql-rate, promql-aggregation, alert-rules,
 * structured-logging, sli-slo-design, error-budgets, alert-fatigue,
 * signal-correlation, metric-cardinality, burn-rate-alerts, blameless-postmortems
 */
export const observabilityChallenges = [
  // ---------------------------------------------------------------- L1
  {
    id: 'observability-l1-which-signal',
    subject: 'observability',
    level: 1,
    type: 'mcq',
    title: 'OPS-1901: build the monthly failed-checkout trend panel',
    scenario:
      'Maya wants a Grafana panel for the monthly review: **"failed checkout rate, as a trend over the last 30 days"**. Tomer suggests querying Loki for every log line containing `payment_failed` and counting them. Dana raises an eyebrow.',
    prompt: 'Which telemetry signal is the right backbone for this panel?',
    options: [
      'Metrics — pre-aggregated numeric time series are built for cheap math over long ranges; a counter of failed checkouts answers this in milliseconds',
      'Logs — counting raw events is always the most accurate way to build a trend',
      'Traces — they capture every checkout end-to-end, so they hold the truth',
      'Uptime checks — a 30-day availability figure comes from the pinger',
    ],
    correctIndex: 0,
    explanation:
      '**Logs** are discrete events (rich detail, expensive to aggregate), **metrics** are numbers pre-aggregated over time (cheap to store, instant to query across months), **traces** follow one request across services. A 30-day trend is pure aggregation — exactly what metrics are for: a `checkout_failures_total` counter costs a few bytes per scrape no matter how much traffic flows. Counting log lines *works* until it doesn’t: at NimbusPay volume the Loki query scans gigabytes and times out, and one log-format change silently breaks the count. Rule of thumb: metrics tell you *that* and *how much*; logs tell you *why*; traces tell you *where*.',
    fundamental: 'three-pillars',
    xp: 10,
    tags: ['three-pillars', 'metrics'],
    estMinutes: 1,
    source: 'seed',
  },
  {
    id: 'observability-l1-trace-latency',
    subject: 'observability',
    level: 1,
    type: 'mcq',
    title: 'INC-3402: one checkout took 11 seconds — find where they went',
    scenario:
      'A merchant reports a single checkout that took **11 seconds**. The request crossed `checkout-web → payments-api → ledger-db`, with a Redis lookup on the way. Metrics confirm p99 spiked at that minute — but Maya asks the sharper question: **"where inside that request did the time go?"**',
    prompt: 'Which signal answers her question directly?',
    options: [
      'A distributed trace — one waterfall of timed spans per hop shows exactly which call ate the 11 seconds',
      'The CPU metrics of every pod involved, overlaid on one dashboard',
      'Grepping each service’s logs for the merchant’s user id and comparing timestamps by hand',
      'kubectl top pods, run during the next occurrence',
    ],
    correctIndex: 0,
    explanation:
      'A **trace** is the story of a single request: every service it touches emits **spans** (start time, duration, parent) stitched together by a shared `trace_id`. The waterfall view turns "checkout is slow" into "the `ledger-db INSERT` span took 9.4s waiting on a lock". Metrics can never say that — they aggregate individual requests away; and correlating logs across three services by timestamp is manual tracing, minus the reliability. This is the division of labor between the pillars: metrics **detect** (p99 spiked), traces **localize** (which hop), logs **explain** (what the ledger said at that exact moment).',
    fundamental: 'three-pillars',
    xp: 10,
    tags: ['traces', 'latency'],
    estMinutes: 1,
    source: 'seed',
  },
  {
    id: 'observability-l1-log-severity',
    subject: 'observability',
    level: 1,
    type: 'mcq',
    title: 'OPS-1903: 900 "errors" that were not errors',
    scenario:
      'Code review on Tomer’s retry handler. When a card-network call times out and the retry **succeeds**, he logs:\n\n```\nlog.error("payment timeout, retry 2 OK, order=%s", orderId)\n```\n\nDana’s comment: "this fired 900 times last night and lit up the error dashboard — nothing was actually broken."',
    prompt: 'Which severity fits an automatically-recovered retry?',
    options: [
      'WARN — something degraded happened but the system healed itself; humans should see it in aggregate, not per event',
      'ERROR — a timeout is an error regardless of the outcome',
      'DEBUG — retries are internal mechanics nobody needs in production',
      'FATAL — payments are involved, so maximum severity is safest',
    ],
    correctIndex: 0,
    explanation:
      'Severity encodes the **required human response**, not how scary the word sounds: `DEBUG` = development detail, `INFO` = normal operation, `WARN` = degraded but self-healed (watch the *rate*), `ERROR` = an operation failed and stayed failed, `FATAL` = the process cannot continue. A successful retry is WARN territory: nobody should act on one, but a climbing WARN rate is the early smoke of a card-network fire. Mislabeling it ERROR poisons the signal — dashboards and alerts key off severity, and after 900 false errors the on-call stops trusting the channel exactly when a real ERROR needs them. That is alert fatigue’s log-side cousin.',
    fundamental: 'log-severity',
    xp: 10,
    tags: ['logging', 'severity'],
    estMinutes: 1,
    source: 'seed',
  },
  {
    id: 'observability-l1-curl-metrics',
    subject: 'observability',
    level: 1,
    type: 'command',
    title: 'OPS-1906: prove the metrics endpoint is alive',
    scenario:
      'Dana added a Prometheus client to payments-api and asks you to sanity-check it before she wires up the scrape config. You are already shelled into the pod; the app serves its metrics on **localhost:9102** at the standard **/metrics** path.',
    prompt: 'Fetch the raw metrics text.',
    answerPatterns: [
      'curl (-s |-sS |-v )?(http://)?(localhost|127\\.0\\.0\\.1):9102/metrics',
      'wget -qO- (http://)?(localhost|127\\.0\\.0\\.1):9102/metrics',
    ],
    acceptExamples: ['curl -s http://localhost:9102/metrics', 'curl localhost:9102/metrics'],
    placeholder: 'curl …',
    explanation:
      'Prometheus is **pull-based**: the app sends nothing anywhere — it just serves its current counters as plain text on `/metrics`, and the Prometheus server scrapes that URL on an interval. That design is why debugging starts with a curl: if this page loads, instrumentation works and any gap is in scrape config; if it doesn’t, no dashboard ever will. Expect lines like `http_requests_total{status="200"} 41823` — a name, labels, and the current value. Every exporter, from node_exporter to your own app, speaks exactly this text format.',
    fundamental: 'metrics-exposition',
    xp: 10,
    tags: ['prometheus', 'metrics-endpoint'],
    estMinutes: 1,
    source: 'seed',
  },
  {
    id: 'observability-l1-p99-tail',
    subject: 'observability',
    level: 1,
    type: 'mcq',
    title: 'INC-3408: "feels slow" but the average looks fine',
    scenario:
      'Support says "checkout feels slow for some of the big merchants", but the latency dashboard’s headline average looks healthy. You open the percentile view:',
    artifact:
      'payments-api latency (last 3h)\n  p50   182ms   flat\n  p95   640ms   steady\n  p99   3.9s    climbing since 14:00',
    artifactLang: 'text',
    prompt: 'What is this dashboard telling you?',
    options: [
      'The slowest ~1% of requests take up to ~3.9s while the typical request is fine — a tail-latency problem that averages hide',
      'The average request now takes 3.9 seconds',
      'The panel is broken: p99 can never be 20× p50',
      'Only 1% of checkouts are succeeding',
    ],
    correctIndex: 0,
    explanation:
      'p99 is the value **99% of requests stay under** — so 1 request in 100 takes up to 3.9s. Averages (and p50) drown that tail: 99 fast requests arithmetically bury one terrible one, which is why "the average looks fine" and "customers are complaining" are both true. Tails are rarely random — the slow 1% usually shares a cause: the biggest carts, a cold cache, one sick pod. Here it is likely the big merchants support mentioned (more line items → heavier ledger queries). Operate on percentiles: p50 shows the typical experience, p95/p99 show the worst — and SLOs are written against the tail, because the tail is where trust is lost.',
    fundamental: 'percentiles-tail-latency',
    xp: 10,
    tags: ['percentiles', 'dashboards', 'latency'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'observability-l1-kubectl-top',
    subject: 'observability',
    level: 1,
    type: 'command',
    title: 'INC-3411: which payments pod is starving?',
    scenario:
      'Checkout latency is creeping up and Dana suspects **one payments-api pod is starved for CPU**. metrics-server is installed on prod-eu. Get the live CPU and memory usage of the pods in the **payments** namespace.',
    prompt: 'Type the command.',
    answerPatterns: [
      'kubectl top pods? (-n|--namespace) payments( --sort-by=cpu)?',
      'kubectl top pods? --namespace=payments( --sort-by=cpu)?',
      'kubectl (-n|--namespace) payments top pods?( --sort-by=cpu)?',
      'kubectl --namespace=payments top pods?( --sort-by=cpu)?',
    ],
    acceptExamples: ['kubectl top pods -n payments'],
    placeholder: 'kubectl …',
    explanation:
      '`kubectl top pods` is the **saturation** check — of the four golden signals (latency, traffic, errors, saturation), it answers "is anything running out of headroom?" in one glance. It reads live usage from metrics-server, so you compare actuals against each pod’s requests and limits: a pod pinned at its CPU limit is being throttled, and throttling reaches users as latency, not as errors — which is exactly the symptom here. Add `--sort-by=cpu` to float the hungriest pod to the top. For history and trends you graduate to Prometheus (`container_cpu_usage_seconds_total`); `kubectl top` is the point-in-time triage tool.',
    fundamental: 'golden-signals',
    xp: 10,
    tags: ['kubernetes', 'saturation'],
    estMinutes: 1,
    source: 'seed',
  },

  // ---------------------------------------------------------------- L2
  {
    id: 'observability-l2-rate-counter',
    subject: 'observability',
    level: 2,
    type: 'mcq',
    title: 'OPS-1915: the error graph that only goes up',
    scenario:
      'Tomer builds his first Grafana panel with the query:\n\n```\nhttp_requests_total{job="payments-api", status="500"}\n```\n\nThe line climbs forever and never comes down — even though the 500s stopped an hour ago. He asks whether Prometheus is broken.',
    prompt: 'What is happening, and what should the query be?',
    options: [
      'http_requests_total is a counter — a running total since process start; graph rate(http_requests_total{…}[5m]) to see errors per second',
      'Prometheus retention is misconfigured, so old points are never deleted',
      'The panel needs sum() to merge duplicate series',
      'The app must be restarted so the counter resets to zero',
    ],
    correctIndex: 0,
    explanation:
      '**Counters only go up** (they reset solely when the process restarts) — they answer "how many, ever", which is almost never the question. The dashboard question is "how many *per second, lately*", and that is `rate(...[5m])`: the per-second slope over the window, automatically compensating for counter resets. A flat rate line means no new errors, even while the raw total stays high forever. This one idea unlocks most of PromQL: counters are for `rate()` and `increase()`; gauges (values that go up *and* down — memory, queue depth) are graphed directly. Restarting the app to reset a counter is fixing the odometer, not the engine.',
    fundamental: 'promql-rate',
    xp: 20,
    tags: ['promql', 'rate', 'counters'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'observability-l2-sum-by-service',
    subject: 'observability',
    level: 2,
    type: 'mcq',
    title: 'OPS-1917: 36 pod lines, one question',
    scenario:
      'The 5xx panel shows **36 separate lines** — one per pod — and pod names churn on every deploy. Maya wants one stable line per service across prod-eu: "errors per second, by service. Nothing else."',
    prompt: 'Which query gives her that?',
    options: [
      'sum by (service) (rate(http_requests_total{status=~"5.."}[5m]))',
      'rate(sum by (service) (http_requests_total{status=~"5.."})[5m])',
      'http_requests_total{status=~"5.."}',
      'count(http_requests_total{status=~"5.."})',
    ],
    correctIndex: 0,
    explanation:
      'Two ideas compose here, in a fixed order. **`rate()` first, per raw series**: it must see each pod’s own counter to handle that pod’s restarts — summing counters before rating turns every restart into a fake cliff (and `rate(sum(…)[5m])` is not even valid PromQL without a subquery). **Then aggregate**: `sum by (service)` adds the per-pod rates and keeps only the `service` label, so 36 churning pod lines collapse into stable per-service lines that survive deploys. The mantra: *rate, then sum — never sum, then rate*. (`count()` is the other trap: it counts time series, not requests.)',
    fundamental: 'promql-aggregation',
    xp: 20,
    tags: ['promql', 'aggregation'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'observability-l2-promtool-check',
    subject: 'observability',
    level: 2,
    type: 'command',
    title: 'OPS-1921: never ship a broken rules file again',
    scenario:
      'Last quarter a malformed rules file shipped and Prometheus silently dropped the **entire alert group** for a weekend — the OPS-1919 postmortem still stings. You just edited **alerts.yml** in the monitoring repo; validate it locally before pushing.',
    prompt: 'Type the validation command.',
    answerPatterns: ['promtool check rules (\\./)?alerts\\.yml'],
    acceptExamples: ['promtool check rules alerts.yml'],
    placeholder: 'promtool …',
    explanation:
      '**Alert rules are code, and unvalidated code ships broken.** `promtool check rules` parses the file exactly the way the server would: YAML structure, the PromQL inside every `expr`, duplicate rule names — and exits non-zero on failure, which is what makes it CI-able. The failure mode it prevents is nasty because it is *silent*: Prometheus logs the bad file and keeps running with the old (or no) rules — monitoring dies, and nothing alerts you that alerting is dead. Wire the same command into the pipeline for every rules file, so a typo becomes a red PR instead of a quiet weekend without coverage.',
    fundamental: 'alert-rules',
    xp: 20,
    tags: ['prometheus', 'promtool', 'ci'],
    estMinutes: 1,
    source: 'seed',
  },
  {
    id: 'observability-l2-alert-raw-counter',
    subject: 'observability',
    level: 2,
    type: 'spot',
    title: 'CR-585: review Tomer’s first alert rule',
    scenario:
      'Tomer wrote his first alert rule and tagged you for review. It validates cleanly — `promtool` is happy — but once this alert fires, **it will never resolve**. Find the line with the flawed logic.',
    snippet:
      'groups:\n  - name: payments-alerts\n    rules:\n      - alert: PaymentsHighErrorRate\n        expr: http_requests_total{job="payments-api", status="500"} > 100\n        for: 10m\n        labels:\n          severity: page\n        annotations:\n          summary: "payments-api is returning 500s"',
    snippetLang: 'yaml',
    buggyLine: 5,
    prompt: 'Click the flawed line.',
    explanation:
      'The expression compares a **raw counter** to a threshold. `http_requests_total` is cumulative since process start — once a pod has served its 101st error *ever*, the condition is true and stays true for the pod’s entire life: the alert fires and never resolves, no matter how healthy the service is now. Thresholds belong on the **rate**: `rate(http_requests_total{…}[5m]) > 1` means "more than one 5xx per second, right now" — it rises with trouble and falls with recovery, so the alert can clear. Syntactically valid but semantically broken is the alert-rule specialty: promtool checks grammar, review checks meaning.',
    fundamental: 'promql-rate',
    xp: 20,
    tags: ['alerting', 'promql', 'review'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'observability-l2-jq-error-logs',
    subject: 'observability',
    level: 2,
    type: 'command',
    title: 'INC-3418: Loki is down, the logs must still answer',
    scenario:
      'Checkout errors spiked while Loki was mid-upgrade (of course). You salvaged the raw structured logs with `kubectl logs payments-api-7d4f9 > payments.log`. One JSON object per line:',
    artifact:
      '{"ts":"2026-08-03T02:41:07Z","level":"info","msg":"payment authorized","trace_id":"9f2c"}\n{"ts":"2026-08-03T02:41:09Z","level":"error","msg":"ledger write failed: connection reset","trace_id":"b81d"}',
    artifactLang: 'text',
    prompt: 'Using jq, print only the error-level entries from payments.log.',
    answerPatterns: [
      "jq (-c )?'select\\(\\.level ?== ?\"error\"\\)' payments\\.log",
      "cat payments\\.log \\| jq (-c )?'select\\(\\.level ?== ?\"error\"\\)'",
    ],
    acceptExamples: ["jq 'select(.level == \"error\")' payments.log"],
    placeholder: "jq 'select(…)' …",
    hint: 'A select() filter on the .level field; keep the jq program in single quotes.',
    explanation:
      'This query is the payoff of **structured logging**. Because each line is JSON with real fields, `select(.level == "error")` filters on *meaning* — no regex guessing whether "Error", "ERROR" or "err:" appears somewhere in prose. The same shape scales up: pipe to `.trace_id` to feed trace lookups, or `group_by(.msg)` to rank failure modes. Had the app logged free-form sentences, this incident would be a grep-and-squint session; instead the log file is a queryable dataset even with Loki down. That is the contract structured logs buy you: log **events with fields**, not sentences — machines aggregate them, humans read the aggregates.',
    fundamental: 'structured-logging',
    xp: 20,
    tags: ['jq', 'structured-logs'],
    estMinutes: 2,
    source: 'seed',
  },

  // ---------------------------------------------------------------- L3
  {
    id: 'observability-l3-error-budget-math',
    subject: 'observability',
    level: 3,
    type: 'mcq',
    title: 'OPS-1931: how much downtime can we afford?',
    scenario:
      'NimbusPay adopts SLOs. Checkout availability gets a target of **99.9% over a rolling 30 days**. In the kickoff, Maya asks the room: "so how much downtime does that leave us to spend — our error budget for the month?"',
    prompt: 'What is the 30-day error budget for a 99.9% availability SLO?',
    options: [
      'About 43 minutes',
      'About 7.2 hours',
      'About 4.3 minutes',
      'Zero — the goal is no downtime',
    ],
    correctIndex: 0,
    explanation:
      'The **error budget is the SLO’s complement**: 100% − 99.9% = 0.1% of the window may fail. Over 30 days that is 43,200 minutes × 0.001 ≈ **43 minutes** (7.2 hours is the 99% budget; 4.3 minutes is 99.99% — each extra nine costs 10×). The reframe is the point: the budget is not shame, it is a **spending account**. Plenty left → ship boldly, run the risky migration. Nearly burned → slow down and spend on reliability instead. That turns "is it safe to deploy?" from opinion into arithmetic — and it is why 100% is the wrong target: it allocates zero budget for any change at all.',
    fundamental: 'error-budgets',
    xp: 35,
    tags: ['slo', 'error-budget'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'observability-l3-alert-fatigue',
    subject: 'observability',
    level: 3,
    type: 'multi',
    title: 'OPS-1934: 41 pages, 3 actionable',
    scenario:
      'Dana was paged **41 times** last week; three pages led to real action. She is exhausted, and Maya is worried the team will start sleeping through the one that matters. You own the cleanup.',
    prompt: 'Pick the changes that cut the noise WITHOUT losing coverage (3):',
    options: [
      'Page only on user-facing symptoms (SLO burn, checkout error rate); route cause-level alerts like CPU, disk and single-pod restarts to dashboards or the ticket queue',
      'Add for: durations so a 30-second blip must persist before it wakes anyone',
      'Audit all 41: any alert that fired without leading to action gets tuned, demoted, or deleted',
      'Lower every threshold so the team hears about problems earlier',
      'Send each page to Slack, email and PagerDuty simultaneously so none get missed',
    ],
    correctIndices: [0, 1, 2],
    explanation:
      'The principle: **every page must be actionable, urgent, and user-relevant** — anything else trains people to ignore the pager, which is how real incidents get slept through. Symptom-based paging keeps 03:00 for "users are hurting"; cause-level signals still exist, demoted to dashboards where they inform instead of interrupt. `for:` durations let self-healing blips self-heal — most spikes resolve before a human could even open a laptop. And the audit closes the loop: an alert that never produces action is noise *by definition*, however plausible it looked when written. The rejected options both raise fatigue — lower thresholds manufacture pages, and triple-channel delivery makes each one louder without making it more actionable.',
    fundamental: 'alert-fatigue',
    xp: 35,
    tags: ['alerting', 'on-call', 'toil'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'observability-l3-signal-correlation',
    subject: 'observability',
    level: 3,
    type: 'order',
    title: 'INC-3437: chase the 5xx spike across all three signals',
    scenario:
      'PagerDuty fires at 03:12: **checkout 5xx rate is burning the SLO**. You have Grafana (metrics), Tempo (traces) and Loki (logs) open. Arrange the triage so each signal hands off to the next — widest view first, root cause last.',
    prompt: 'Order the steps:',
    steps: [
      'Dashboard: scope the blast radius — which endpoints, which regions, how fast it is burning',
      'Metrics: sum the 5xx rate by service to isolate which hop of the checkout path is failing',
      'Traces: open a failing checkout trace and find the span where the errors begin',
      'Logs: query that service’s logs, filtered by the trace_id and timestamp, for the actual error text',
      'After the fix: watch the same SLO panel until the error rate is back at baseline',
    ],
    explanation:
      'Each pillar answers one question and hands the next question onward: metrics say **how bad and roughly where** (detect and scope), traces say **which hop** (localize), logs say **exactly why** (explain), and the loop closes on the metric that opened it (verify). The order matters because it narrows fastest: starting in logs means grepping five healthy services at 03:00, and skipping the scoping step risks confidently fixing one region of a global outage. The `trace_id` is the thread that stitches the handoffs together — which is why structured logs must carry it on every line.',
    fundamental: 'signal-correlation',
    xp: 35,
    tags: ['triage', 'correlation', 'incident'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'observability-l3-sli-selection',
    subject: 'observability',
    level: 3,
    type: 'mcq',
    title: 'OPS-1939: pick the SLI that measures users, not machines',
    scenario:
      'Drafting the checkout SLO, the team brainstorms candidate SLIs on the whiteboard. Maya’s filter for every candidate: **"would this number move if, and only if, users were hurting?"**',
    prompt: 'Which SLI passes her test for checkout availability?',
    options: [
      'Successful checkout requests ÷ total checkout requests, measured at the load balancer',
      'Average CPU utilization across payments-api pods',
      'Number of payments-api pod restarts per day',
      'A synthetic ping from inside the cluster every 60 seconds',
    ],
    correctIndex: 0,
    explanation:
      'A good SLI is a **ratio of good events to total events, measured as close to the user as possible**. The LB-level success ratio moves exactly when users fail — it passes Maya’s test by construction. CPU and restarts are *causes*: pods can burn 95% CPU while every checkout succeeds, or sit idle while everything fails upstream — alert on them and you page on weather, not damage. The in-cluster ping fails the other direction: it bypasses the edge (DNS, TLS, load balancer), so whole classes of user-facing outage are invisible to it, and one probe per minute cannot see the 2% error rate that real traffic measures continuously. Symptoms over causes, edge over interior, real traffic over synthetic.',
    fundamental: 'sli-slo-design',
    xp: 35,
    tags: ['sli', 'slo-design'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'observability-l3-slo-design-free',
    subject: 'observability',
    level: 3,
    type: 'free',
    title: 'OPS-1940: propose NimbusPay’s first checkout SLO',
    scenario:
      'At the INC-3437 review, the VP of Product asked "is checkout reliable *enough*?" and got five different opinions. Maya’s action item is yours: **propose NimbusPay’s first SLO for the checkout flow** — one page, ready to defend in Friday’s review.',
    prompt:
      'Write the proposal: the SLI(s) you would measure, the SLO target and window, the error budget it implies, and what the team does when the budget burns.',
    rubric:
      'A strong answer must include: (1) SLIs as good/total event ratios measured near the user — e.g. non-5xx checkout responses ÷ total at the load balancer, plus a latency SLI such as the fraction of checkouts under 500ms; (2) an achievable target grounded in recent measured performance (e.g. 99.9% if current is ~99.95%), explicitly rejecting 100% as a target; (3) a defined rolling window (e.g. 30 days) and the computed budget (99.9% ⇒ ~43 min/month); (4) an error-budget policy: page on fast burn, and when the budget is exhausted, freeze risky launches and prioritize reliability work — while budget remaining is explicit license to ship; (5) a review cadence with product/stakeholders. Bonus: burn-rate alerting to protect the budget, and naming who owns the SLO dashboard and response.',
    modelAnswer:
      'SLIs, measured at the ALB in front of checkout-web (the closest point to users we control): **availability** = non-5xx checkout responses ÷ all checkout responses; **latency** = share of checkout responses under 500ms. Target: **99.9% availability and 99% under 500ms, over a rolling 30 days**. Last quarter we measured ~99.94%, so 99.9% is honest without being slack — and 100% is off the table because it leaves zero budget for deploys or experiments. Budget: 0.1% of 43,200 minutes ≈ **43 minutes** of full downtime a month, or the equivalent spread as partial error rate. Policy: burn-rate alerts page on fast burn; when the budget is spent, feature launches on the checkout path stop and the sprint goes to reliability — no blame, just the policy; while budget remains, that is explicit permission to take risk. Review monthly with Product so the target keeps tracking what merchants actually need.',
    explanation:
      'An SLO is a **contract written in the user’s units** — success ratio and latency as experienced at the edge, never machine units like CPU. The target sits deliberately below 100% because reliability has a price curve: each nine costs roughly 10× more, and a target with no error budget forbids change entirely. The budget is what converts reliability into a **shared, spendable currency**: product spends it on launches, engineering defends it with reliability work, and the burn rate — not the loudest opinion — decides which mode the team is in. That is what changes Friday’s meeting from five opinions to one number.',
    fundamental: 'sli-slo-design',
    xp: 35,
    tags: ['slo', 'error-budget', 'design'],
    estMinutes: 4,
    source: 'seed',
  },

  // ---------------------------------------------------------------- L4
  {
    id: 'observability-l4-cardinality-blast',
    subject: 'observability',
    level: 4,
    type: 'mcq',
    title: 'INC-3450: one label killed Prometheus',
    scenario:
      'PagerDuty at 03:12: Prometheus itself is dying on prod-eu. Dashboards time out, then go blank — you are flying blind during business hours in three timezones. The only change in the window:',
    artifact:
      'prometheus-0  memory 4.1GiB -> 14.9GiB in 40min, OOMKilled x2\nhead series: 380k -> 6.1M\n\ntop metric by series count:\n  http_requests_total{path, status, user_id}   5,700,000 series\n\ndeploy 02:31  payments-api  "add user_id label to request metrics"',
    artifactLang: 'text',
    prompt: 'Why did one small label take down the whole monitoring stack?',
    options: [
      'Every unique label-value combination is a separate time series — user_id multiplied the series count by the size of the user base, and Prometheus holds every active series in memory',
      'Labels with underscores in their names trigger a known Prometheus parser bug',
      'The label doubled the size of each scrape payload, saturating the network',
      'Adding any new label forces Prometheus to re-index its historical blocks, which spikes memory once',
    ],
    correctIndex: 0,
    explanation:
      '**Cardinality is multiplicative.** A metric’s series count is the product of its labels’ distinct values: 40 paths × 5 statuses = 200 series; add `user_id` with tens of thousands of active users and it is millions — each an independent series with its own memory-resident index entry and chunks. That is why the failure is nonlinear: the label costs nothing in code review and everything at scale. The discipline: label values must be **bounded, low-cardinality sets** (endpoint, status, region — things you would put on a dashboard axis). Unbounded identifiers — user_id, order_id, IP, session — belong in logs and traces, which are built for high cardinality. Per-user questions get answered there, not in Prometheus.',
    fundamental: 'metric-cardinality',
    xp: 50,
    tags: ['prometheus', 'cardinality', 'labels'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'observability-l4-burn-rate-windows',
    subject: 'observability',
    level: 4,
    type: 'mcq',
    title: 'OPS-1948: why does the burn-rate alert need two windows?',
    scenario:
      'After one static-threshold false alarm too many, Dana rewrites the checkout paging rule Google-style:\n\n```\npage when: burn_rate > 14.4 over 1h\n      AND  burn_rate > 14.4 over 5m\n```\n\nTomer, reviewing: "why does the same condition appear twice with two different windows?"',
    prompt: 'What does requiring BOTH windows achieve?',
    options: [
      'The 1h window proves the burn is significant (real budget spent, not a blip); the 5m window proves it is still happening — pages fire only for material, ongoing burn and clear quickly once it stops',
      'Redundancy: if one query fails to evaluate, the other still pages',
      'The 5m window catches slow burns; the 1h window catches fast ones',
      'Two windows halve the evaluation load on Prometheus',
    ],
    correctIndex: 0,
    explanation:
      '**Burn rate is the speed of budget spend**: 1× consumes exactly the whole budget over the SLO window; 14.4× exhausts a 30-day budget in about two days — worth waking someone. Each window alone fails differently. Only the 1h window: a 20-minute outage that already ended keeps paging for the rest of the hour — a stale page with nothing to do. Only the 5m window: every brief spike pages — noise. ANDed together, the long window supplies **significance** and the short window supplies **recency**: you are paged while it burns and silenced minutes after it stops. Production setups add a slow-burn pair (e.g. 6× over 6h + 30m) that opens a ticket instead of paging — same budget math, calmer delivery.',
    fundamental: 'burn-rate-alerts',
    xp: 50,
    tags: ['slo', 'burn-rate', 'alerting'],
    estMinutes: 3,
    source: 'seed',
  },
  {
    id: 'observability-l4-blameless-retro',
    subject: 'observability',
    level: 4,
    type: 'multi',
    title: 'OPS-1952: the INC-3450 retro — keep it blameless',
    scenario:
      'The retro for the INC-3450 cardinality outage is tomorrow. Someone from Finance has already asked Maya "whose fault was it?" — she replied "the review is blameless" and asked you to draft the document properly.',
    prompt: 'What belongs in a blameless postmortem? (pick 3)',
    options: [
      'A timestamped timeline: what happened, what responders saw and decided at each point',
      'Contributing causes: why the system made this failure easy — no cardinality limits, no CI check on metric labels, no alert on series growth',
      'Action items with owners and due dates, tracked like any other engineering work',
      'The name of the engineer who shipped the label, for accountability',
      'A per-person incident tally for this quarter’s performance reviews',
    ],
    correctIndices: [0, 1, 2],
    explanation:
      'Blamelessness is not politeness — it is an **epistemic tool**: people who fear punishment sanitize their accounts, and sanitized accounts hide exactly the details that explain the failure. The working assumption is that Tomer acted reasonably given what he knew; the interesting question is why the *system* let a reasonable action take down monitoring — no series-growth guardrail, a review process that could not see cardinality, no limit on label values. The timeline builds shared facts, contributing causes replace the myth of a single root cause, and owned, dated action items are what make the retro an engineering artifact instead of a therapy session. Naming names produces quieter engineers, not fewer incidents.',
    fundamental: 'blameless-postmortems',
    xp: 50,
    tags: ['postmortem', 'culture', 'incident'],
    estMinutes: 3,
    source: 'seed',
  },
] satisfies Challenge[]
