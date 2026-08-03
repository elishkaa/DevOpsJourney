import type { Challenge } from '../../types/challenge'

/**
 * Git & Version Control — fundamentals vocabulary:
 * remote-sync, staging-area, branch-pointers, merge-vs-rebase,
 * conflict-resolution, undo-semantics, reflog-recovery, bisect-search,
 * cherry-pick, git-hooks, history-rewrite, branching-models, commit-signing
 */
export const gitChallenges = [
  // ---------------------------------------------------------------- L1
  {
    id: 'git-l1-clone-payments-api',
    subject: 'git',
    level: 1,
    type: 'command',
    title: 'OPS-1301: get the payments-api code onto your laptop',
    scenario:
      'Day one at **NimbusPay**. Maya drops the repo link in Slack: `git@github.com:nimbuspay/payments-api.git`. "Get the code on your laptop and poke around — standup is in an hour."',
    prompt: 'Type the command that copies the repository (with its full history) to your machine.',
    answerPatterns: [
      'git clone (git@github\\.com:|https://github\\.com/)nimbuspay/payments-api(\\.git)?( payments-api)?',
    ],
    acceptExamples: ['git clone git@github.com:nimbuspay/payments-api.git'],
    placeholder: 'git clone …',
    hint: 'One command copies the repo and wires up the remote.',
    explanation:
      '`git clone` copies the **entire repository** — every commit, branch and tag, not just the latest files — and wires up a remote named `origin` pointing back at GitHub. That is why git works offline: you hold the full history locally, and `fetch`/`push` merely synchronize with origin. The `.git` suffix is optional, and SSH (`git@github.com:…`) versus HTTPS (`https://github.com/…`) changes only how you authenticate, not what you get. The first clone is slow and everything afterwards is fast — that is the distributed model paying for itself.',
    fundamental: 'remote-sync',
    xp: 10,
    tags: ['clone', 'remotes'],
    estMinutes: 1,
    source: 'seed',
  },
  {
    id: 'git-l1-missing-from-commit',
    subject: 'git',
    level: 1,
    type: 'mcq',
    title: 'OPS-1304: your commit is missing half the fix',
    scenario:
      'You fixed fee rounding across two files — `api/fees.ts` and `api/rates.ts` — then committed. Reviewing your own PR, only `fees.ts` changed. On your machine:',
    artifact:
      '$ git status\nOn branch fix/fee-rounding\nChanges not staged for commit:\n  modified:   api/rates.ts',
    artifactLang: 'text',
    prompt: 'Why is `rates.ts` missing from your commit?',
    options: [
      'git commit -m can only include one file per commit',
      'git commit records the staging area, and api/rates.ts was never staged with git add',
      'api/rates.ts matches a pattern in .gitignore',
      'You must run git push --all to publish every modified file',
    ],
    correctIndex: 1,
    explanation:
      'Git builds commits from the **staging area** (the index), not from your working directory. `git add` copies a file’s current state into the index; `git commit` snapshots exactly what the index holds — you staged `fees.ts`, never `rates.ts`, so the commit faithfully recorded half your work. Fix: `git add api/rates.ts && git commit`. The staging area exists so you can compose precise commits — `git add -p` even stages individual hunks. Habit worth keeping: read `git status` (staged / modified / untracked) before every commit.',
    fundamental: 'staging-area',
    xp: 10,
    tags: ['staging', 'add', 'status'],
    estMinutes: 1,
    source: 'seed',
  },
  {
    id: 'git-l1-create-branch',
    subject: 'git',
    level: 1,
    type: 'command',
    title: 'OPS-1307: start the fee-rounding fix on a branch',
    scenario:
      'Maya assigns you the fee-rounding bug. House rule at **NimbusPay**: never commit directly on `main`. You are on `main`, freshly pulled, ready to start.',
    prompt: 'Create a branch named `fix/fee-rounding` and switch to it — one command.',
    answerPatterns: [
      'git switch -c fix/fee-rounding',
      'git checkout -b fix/fee-rounding',
      'git branch fix/fee-rounding && git (switch|checkout) fix/fee-rounding',
    ],
    acceptExamples: ['git switch -c fix/fee-rounding', 'git checkout -b fix/fee-rounding'],
    placeholder: 'git …',
    explanation:
      'A git branch is just a **movable pointer to a commit** — creating one writes a tiny ref file, which is why it is instant and free. `git switch -c` (or the older `git checkout -b`) plants the pointer at your current commit and moves `HEAD` onto it, so your next commit advances the new branch and leaves `main` untouched. Branching before every change keeps `main` releasable at all times and gives your work a clean, reviewable unit. Cheap branches are git’s superpower — use one per ticket without a second thought.',
    fundamental: 'branch-pointers',
    xp: 10,
    tags: ['branch', 'switch'],
    estMinutes: 1,
    source: 'seed',
  },
  {
    id: 'git-l1-first-change-flow',
    subject: 'git',
    level: 1,
    type: 'order',
    title: 'OPS-1310: ship your first change the NimbusPay way',
    scenario:
      'Your first real change: the checkout page shows "VAT" where Irish customers must see "Tax". Maya sketches the team workflow on the whiteboard and hands you the marker: "Put it in order."',
    prompt: 'Arrange the steps of a clean change workflow:',
    steps: [
      'git switch main && git pull — start from the latest code',
      'git switch -c fix/tax-label — create a branch for the change',
      'Edit the template and save your change',
      'git add . && git commit -m "show Tax instead of VAT for IE"',
      'git push -u origin fix/tax-label — publish the branch',
      'Open a pull request and request Maya’s review',
    ],
    explanation:
      'The rhythm is **sync, branch, commit, publish, review**. Pulling first means your branch is born from the latest `main`, which minimizes later conflicts. Committing on a branch keeps `main` releasable; `git push -u origin <branch>` publishes the branch and sets its upstream so future `git push`/`git pull` need no arguments. The pull request is where CI and human review gate the change — at NimbusPay nothing reaches `main` without both. This loop is the atom of git collaboration; every fancier workflow you will meet is a variation on it.',
    fundamental: 'remote-sync',
    xp: 10,
    tags: ['workflow', 'pull-request'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'git-l1-fetch-vs-pull',
    subject: 'git',
    level: 1,
    type: 'mcq',
    title: 'OPS-1313: Dana says "fetch first, pull later"',
    scenario:
      'Tomer complains his `main` is three days stale. Dana: "Run `git fetch` first, *look* at what came down, then decide. Don’t reflex-pull." Tomer turns to you: "What’s actually the difference?"',
    prompt: 'What is the difference between `git fetch` and `git pull`?',
    options: [
      'fetch downloads new commits into origin/* tracking branches without touching your work; pull is fetch plus an immediate merge (or rebase) into your current branch',
      'fetch is the old name for pull; modern git treats them identically',
      'fetch only works with SSH remotes, pull only with HTTPS',
      'pull downloads commits; fetch downloads only file metadata for status displays',
    ],
    correctIndex: 0,
    explanation:
      '`git fetch` downloads new commits and updates your **remote-tracking branches** (`origin/main`) — your local `main` and working tree stay exactly as they were, which makes fetch always safe to run. `git pull` is `fetch` followed immediately by a merge (or a rebase, with `pull.rebase`) into whatever branch you are on. Dana’s habit — fetch, then `git log main..origin/main` to inspect what arrived, then integrate deliberately — means changes never land in your work sight-unseen. Separate *downloading* from *integrating* and git stops surprising you.',
    fundamental: 'remote-sync',
    xp: 10,
    tags: ['fetch', 'pull'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'git-l1-detached-head',
    subject: 'git',
    level: 1,
    type: 'mcq',
    title: 'OPS-1316: time-travel to last month’s fee logic',
    scenario:
      'A refund dispute needs last month’s pricing behavior. You check out the old release commit directly and git prints a warning:',
    artifact:
      "$ git checkout 9fc1a2e\nNote: switching to '9fc1a2e'.\n\nYou are in 'detached HEAD' state. You can look around, make experimental\nchanges and commit them, and you can discard any commits you make…",
    artifactLang: 'text',
    prompt: 'What does "detached HEAD" actually mean?',
    options: [
      'The remote branch you were on has been deleted, so HEAD has nothing to attach to',
      'Your working tree is corrupted and git fsck must rebuild it',
      'HEAD points directly at a commit instead of a branch — you can look around freely, but new commits here belong to no branch and can be lost once you switch away',
      'You have uncommitted changes that block branch switching',
    ],
    correctIndex: 2,
    explanation:
      '`HEAD` normally points at a **branch**, and the branch pointer moves forward when you commit. Checking out a raw SHA makes HEAD point straight at that commit — "detached" — which is perfectly safe for *looking around*: build it, run it, read it. The trap is committing here: those commits belong to no branch, so once you switch away nothing references them and they will eventually be garbage-collected. If inspection turns into fixing, plant a branch where you stand — `git switch -c hotfix/pricing` — and your work is anchored again.',
    fundamental: 'branch-pointers',
    xp: 10,
    tags: ['head', 'checkout'],
    estMinutes: 2,
    source: 'seed',
  },

  // ---------------------------------------------------------------- L2
  {
    id: 'git-l2-rebase-vs-merge',
    subject: 'git',
    level: 2,
    type: 'mcq',
    title: 'CR-461: rebase or merge Tomer’s two-week branch?',
    scenario:
      'Review time on `feature/instant-payouts`, now 40 commits behind `main`. Team policy: update the branch and keep history linear. Tomer asks: "`git merge main` or `git rebase main` — what’s actually different?"',
    prompt: 'What does `git rebase main` do to his branch, in contrast to `git merge main`?',
    options: [
      'It creates a merge commit tying the two histories together, preserving all existing SHAs',
      'It replays his commits one by one on top of the latest main — linear history, no merge commit, but every replayed commit gets a new SHA',
      'It resets his branch to main, discarding his commits so he can re-apply them by hand',
      'It pushes his commits directly into main, skipping review',
    ],
    correctIndex: 1,
    explanation:
      'Both commands integrate main’s changes; they differ in the **shape of history**. `git merge main` adds one merge commit joining the two lines and preserves existing SHAs. `git rebase main` lifts your commits and replays them onto the newest main — a straight line, but every replayed commit is a **new commit with a new SHA**: rewritten history. Hence the golden rule: rebase freely on branches only you use, never on anything shared or pushed that teammates may have built on — their history would no longer match yours. Linear history is bought with that one honest constraint.',
    fundamental: 'merge-vs-rebase',
    xp: 20,
    tags: ['rebase', 'merge', 'history'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'git-l2-conflict-markers',
    subject: 'git',
    level: 2,
    type: 'spot',
    title: 'INC-2807: build broke right after the conflict was "resolved"',
    scenario:
      'checkout-web CI went red minutes after Tomer merged `main` into his branch and resolved a conflict in the gateway config: `JSON.parse: unexpected token <`. Look at what got committed.',
    snippet:
      '{\n  "retryAttempts": 3,\n<<<<<<< HEAD\n  "timeoutMs": 5000,\n=======\n  "timeoutMs": 8000,\n>>>>>>> feature/gateway-tuning\n  "currency": "EUR"\n}',
    snippetLang: 'json',
    buggyLine: 3,
    acceptableLines: [5, 7],
    prompt: 'Click a line proving the conflict was never actually resolved.',
    explanation:
      'When both branches touch the same lines, git stops and writes **conflict markers** into the file: `<<<<<<<` your side, `=======` the divider, `>>>>>>>` their side. Resolving means *choosing or blending the content and deleting all three marker lines* — git does not verify you actually did, so committing markers is depressingly easy. Here they turned valid JSON into a parse error, which is the lucky outcome: in some files they would have slipped straight to production. Guard rails: `git diff --check` flags leftover markers, and a CI parse/lint step catches what humans miss.',
    fundamental: 'conflict-resolution',
    xp: 20,
    tags: ['conflicts', 'merge'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'git-l2-revert-pushed',
    subject: 'git',
    level: 2,
    type: 'command',
    title: 'INC-2811: bad commit is live on main — undo it safely',
    scenario:
      'PagerDuty at 16:40: EUR payouts failing since the 15:00 deploy. The culprit is identified and **already pushed to `main`**:',
    artifact:
      '$ git log --oneline -3\na1b2c3d fee rounding hotfix   <- breaks EUR payouts\n9e8d7c6 add payout retries\n5f4e3d2 bump csv exporter',
    artifactLang: 'text',
    prompt: 'Undo commit `a1b2c3d` by creating a new commit — without rewriting shared history.',
    answerPatterns: ['git revert (--no-edit )?a1b2c3d', 'git revert a1b2c3d --no-edit'],
    acceptExamples: ['git revert a1b2c3d'],
    placeholder: 'git …',
    hint: 'History should only move forward on a shared branch.',
    explanation:
      '`git revert` creates a **new commit applying the inverse diff** of the bad one — history only moves forward, nothing is rewritten, so every clone stays consistent and the deploy pipeline simply sees one more commit. That is exactly what a shared branch needs. `git reset` would instead move the branch pointer backwards, and publishing that requires a force-push that rewrites `main` under your teammates’ feet. Rule of thumb: **revert what is public, reset what is private.** Bonus: the revert commit documents the rollback in history — auditors and future-you both approve.',
    fundamental: 'undo-semantics',
    xp: 20,
    tags: ['revert', 'rollback'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'git-l2-history-rewrite-danger',
    subject: 'git',
    level: 2,
    type: 'multi',
    title: 'CR-463: the "forbidden on shared branches" list',
    scenario:
      'Maya is writing the team git guide and wants a danger list: "Which of these can rewrite or overwrite history that teammates may already have pulled — meaning they are **forbidden on shared branches** like `main`?"',
    prompt: 'Select the THREE dangerous ones.',
    options: [
      'git reset --hard HEAD~1',
      'git commit --amend',
      'git revert HEAD',
      'git restore src/checkout.ts',
      'git push --force',
    ],
    correctIndices: [0, 1, 4],
    explanation:
      '`reset --hard` moves the branch pointer backwards (and wipes your working tree); `--amend` replaces the last commit with a new SHA; `push --force` overwrites the remote branch with your rewritten version. All three change or discard history someone may already have pulled — on a shared branch that means broken pulls and lost work. The safe family: `revert` adds a *forward* commit that undoes an old one, and `restore` touches only your working tree. When a force-push is truly unavoidable, `--force-with-lease` at least refuses to overwrite commits you have not seen.',
    fundamental: 'undo-semantics',
    xp: 20,
    tags: ['reset', 'force-push', 'amend'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'git-l2-restore-file',
    subject: 'git',
    level: 2,
    type: 'mcq',
    title: 'OPS-1322: throw away one file’s local edits',
    scenario:
      'You experimented in `src/checkout.ts` for an hour — nothing staged, nothing committed — and the experiment is a dead end. You want that one file back exactly as it is in the last commit, without touching anything else you have in flight.',
    prompt: 'Which command does exactly that?',
    options: [
      'git restore src/checkout.ts',
      'git revert src/checkout.ts',
      'git reset --hard origin/main',
      'git rm --cached src/checkout.ts',
    ],
    correctIndex: 0,
    explanation:
      'Git’s undo tools map onto its **three zones**. `git restore <file>` overwrites the *working-tree* copy from the index/HEAD — precisely "discard my local edits to this file" (`git restore --staged` is its sibling for unstaging). `git revert` operates on *commits*, not dirty files, so it does not apply here. `git reset --hard origin/main` is a chainsaw where you need tweezers — it would obliterate your other in-progress files too. `git rm --cached` stops tracking the file entirely. Match the tool to the zone you want to change and undo stops being scary.',
    fundamental: 'undo-semantics',
    xp: 20,
    tags: ['restore', 'working-tree'],
    estMinutes: 2,
    source: 'seed',
  },

  // ---------------------------------------------------------------- L3
  {
    id: 'git-l3-bisect-workflow',
    subject: 'git',
    level: 3,
    type: 'order',
    title: 'INC-2815: refund emails died somewhere in 200 commits',
    scenario:
      'Refund confirmation emails silently stopped sometime in the last two weeks — roughly **200 commits** ago. No error, no obvious suspect, but you *can* reproduce the failure locally with one script. Maya: "Don’t read 200 diffs. Bisect it."',
    prompt: 'Arrange the bisect session in order:',
    steps: [
      'git bisect start',
      'git bisect bad — mark the currently checked-out, broken commit',
      'git bisect good v2.4.0 — mark the last release known to work',
      'Test the commit git checks out, mark it good or bad, and repeat until git names the first bad commit',
      'git bisect reset — return to where you started, culprit in hand',
    ],
    explanation:
      '`git bisect` runs a **binary search over history**: you declare one bad and one good endpoint, git checks out the midpoint, you vote, and the suspect range halves each round — 200 commits fall in about 8 tests. It works even when you have no idea *what* broke, only *that* it broke, and `git bisect run ./repro.sh` automates the whole loop using the script’s exit code. Two habits make bisect painless: keep commits small and always-buildable (`git bisect skip` exists for the broken ones), and always finish with `reset` so you are not left detached mid-history.',
    fundamental: 'bisect-search',
    xp: 35,
    tags: ['bisect', 'debugging'],
    estMinutes: 3,
    source: 'seed',
  },
  {
    id: 'git-l3-cherry-pick-hotfix',
    subject: 'git',
    level: 3,
    type: 'command',
    title: 'INC-2819: one fix from main must ride to release/2.4',
    scenario:
      'A currency-conversion fix landed on `main` this morning as commit `f00dcafe`. Production runs `release/2.4`, which must NOT take the other 31 unreleased commits sitting on `main`. You already have `release/2.4` checked out.',
    prompt: 'Bring exactly that one commit onto the release branch.',
    answerPatterns: ['git cherry-pick (-x )?f00dcafe'],
    acceptExamples: ['git cherry-pick f00dcafe'],
    placeholder: 'git …',
    hint: 'Transplant a single commit by SHA.',
    explanation:
      '`git cherry-pick <sha>` takes the **diff introduced by one commit** and applies it as a new commit on your current branch — surgical transplantation, ideal for hotfixes: the fix rides to `release/2.4` without dragging along weeks of unreleased work. Because the new commit has a different parent, it gets a **different SHA** — the same change now exists twice in history, which is why `-x` (appends "cherry picked from commit …") is worth the habit for traceability. Teams pick one direction — fix on main then pick to releases, or the reverse — and stick to it, so no fix gets stranded.',
    fundamental: 'cherry-pick',
    xp: 35,
    tags: ['cherry-pick', 'hotfix', 'release'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'git-l3-reflog-rescue',
    subject: 'git',
    level: 3,
    type: 'mcq',
    title: 'INC-2822: Tomer hard-reset away the VAT fix',
    scenario:
      'Tomer, pale, at your desk: "I ran `git reset --hard HEAD~3` on my branch. The VAT fix is *gone*. Three commits. Never pushed." You sit down and type:',
    artifact:
      '$ git reflog -3\n2c9a1e4 HEAD@{0}: reset: moving to HEAD~3\n8b1f0aa HEAD@{1}: commit: round VAT per line item\n77d0e2b HEAD@{2}: commit: add VAT rate table',
    artifactLang: 'text',
    prompt: 'Are the commits recoverable — and how?',
    options: [
      'No — reset --hard deletes commits immediately and permanently',
      'Only if the branch was pushed; origin holds the sole copy',
      'Yes — the reflog still references them: git reset --hard HEAD@{1} (or branch from 8b1f0aa) restores the branch as it was',
      'Only by re-typing the changes from memory',
    ],
    correctIndex: 2,
    explanation:
      'Commits are **immutable objects**; `reset --hard` never destroys them — it only moves the branch pointer so they become *unreachable*. The **reflog** is git’s private journal of everywhere HEAD and each branch have pointed, kept locally for ~90 days. `HEAD@{0}` is now (post-reset); `HEAD@{1}` is the state one move earlier — so `git reset --hard HEAD@{1}`, or `git branch rescue 8b1f0aa`, resurrects the "lost" work instantly. Almost nothing *committed* is ever truly lost in git. Uncommitted work has no reflog, though — which is the real argument for committing early and often.',
    fundamental: 'reflog-recovery',
    xp: 35,
    tags: ['reflog', 'reset', 'recovery'],
    estMinutes: 2,
    source: 'seed',
  },
  {
    id: 'git-l3-hook-not-running',
    subject: 'git',
    level: 3,
    type: 'mcq',
    title: 'OPS-1330: the committed pre-commit hook never fires',
    scenario:
      'The repo ships a linting hook — `scripts/pre-commit` is committed, and the README says "runs automatically on every commit". Yet both new hires keep producing commits with lint errors, and on their laptops the hook visibly never runs.',
    prompt: 'Why does the committed hook not run?',
    options: [
      'Hooks execute from .git/hooks/, which is never cloned — each machine must wire them up, e.g. git config core.hooksPath scripts or a hook manager',
      'GitHub strips client-side hooks from private repositories on push',
      'pre-commit hooks only fire for the repository owner’s commits',
      'The hook file needs a .sh extension to be recognized',
    ],
    correctIndex: 0,
    explanation:
      'Hooks run from `.git/hooks/`, which is **deliberately never cloned or pushed**: cloning a repository must not silently install code that executes on your machine — that would be a security hole. Committing scripts to `scripts/` versions them, but each machine still needs wiring: `git config core.hooksPath scripts` (plus execute bits), or a manager like husky or pre-commit that installs during `npm install`. And since any developer can bypass hooks with `--no-verify`, client-side hooks are a *courtesy*, not a control — the authoritative gate must live server-side: CI checks and branch protection.',
    fundamental: 'git-hooks',
    xp: 35,
    tags: ['hooks', 'core-hookspath', 'ci'],
    estMinutes: 2,
    source: 'seed',
  },

  // ---------------------------------------------------------------- L4
  {
    id: 'git-l4-purge-secret',
    subject: 'git',
    level: 4,
    type: 'mcq',
    title: 'INC-2834: a live AWS key is in the repo history',
    scenario:
      'The secret scanner pages security at 09:05: a live **AWS access key** sits in `config/prod.env`, committed to `payments-api` three weeks ago. Tomer already "fixed" it yesterday — a commit deleting the file. The scanner still fires.',
    prompt: 'What does an actual fix require?',
    options: [
      'Nothing — the deletion commit removed the file; the alert is a false positive',
      'Rotate the key immediately, then rewrite every commit containing it with git filter-repo and force-push — a later deletion leaves the secret in all earlier commits, and it must be treated as already compromised',
      'git revert the commit that originally added the key',
      'Delete and re-create the GitHub repository to clear its caches',
    ],
    correctIndex: 1,
    explanation:
      'History is a chain of **content-addressed snapshots**: deleting the file in a new commit removes it from the *tip*, while every earlier commit still serves the key to anyone who clones or clicks through history — a revert is just another forward commit and changes nothing about the past. Worse, a pushed secret must be presumed harvested: scrapers watch repos in near real time. So the order is fixed: **rotate first** — that is the real mitigation — then `git filter-repo` to rewrite every affected commit, force-push, have everyone re-clone, and ask GitHub to purge cached views. Cleanup without rotation is theater.',
    fundamental: 'history-rewrite',
    xp: 50,
    tags: ['filter-repo', 'secrets', 'security'],
    estMinutes: 3,
    source: 'seed',
  },
  {
    id: 'git-l4-trunk-based',
    subject: 'git',
    level: 4,
    type: 'multi',
    title: 'CR-470: moving payments-api to trunk-based development',
    scenario:
      'After the third week-long merge-conflict festival, Maya proposes moving `payments-api` from GitFlow to **trunk-based development** and asks the team to agree on what that actually means in practice.',
    prompt: 'Which THREE practices belong to trunk-based development?',
    options: [
      'Short-lived feature branches that merge into main within a day or two',
      'Feature flags so unfinished work can ship to production dark',
      'A long-lived develop branch where features integrate before each release',
      'Releases cut from main as tags or short-lived release branches',
      'Merging main into each feature branch once per quarter',
    ],
    correctIndices: [0, 1, 3],
    explanation:
      'Trunk-based development optimizes for **integration frequency**: branches live hours-to-days and merge straight into an always-releasable `main`, so conflicts stay small and CI continuously verifies the *combined* state of everyone’s work. Unfinished features still merge — hidden behind **feature flags** — which decouples *deploying* code from *releasing* behavior. Releases are cut from main as tags or short-lived release branches that receive only cherry-picked fixes. A long-lived `develop` integration branch is the GitFlow pattern this model explicitly abandons, and quarterly syncs are precisely the giant-conflict generator it exists to kill.',
    fundamental: 'branching-models',
    xp: 50,
    tags: ['trunk-based', 'gitflow', 'feature-flags'],
    estMinutes: 3,
    source: 'seed',
  },
  {
    id: 'git-l4-signed-commits',
    subject: 'git',
    level: 4,
    type: 'mcq',
    title: 'CR-474: compliance wants the Verified badge on every commit',
    scenario:
      'After a supply-chain incident at a competitor, compliance mandates **signed commits** on `payments-api`; branch protection will require the Verified badge. Tomer objects: "My name and email are already on every commit — what does signing add?"',
    prompt: 'What does a signature prove that the author field cannot?',
    options: [
      'The author field is self-reported config — anyone can set any name and email; a cryptographic signature proves the commit was made with a private key tied to a verified account',
      'Signing encrypts the commit contents so only NimbusPay employees can read them',
      'Signing compresses history, making clones faster and tamper-proof',
      'Signing is only meaningful for tags, so the requirement is a mistake',
    ],
    correctIndex: 0,
    explanation:
      'The author and committer fields are **self-reported**: `git config user.email maya@nimbuspay.io` and your next commit impersonates the team lead — git will not object, and neither will GitHub’s display. A signed commit adds a cryptographic signature made with your private key (GPG or SSH); the platform verifies it against the public key uploaded to your account and shows **Verified**, making impersonation and tampering detectable — now branch protection can *require* proof of origin. Setup is small: `git config gpg.format ssh`, point at your key, `commit.gpgsign true`. Note the distinction: signing proves *origin and integrity* — it encrypts nothing.',
    fundamental: 'commit-signing',
    xp: 50,
    tags: ['gpg', 'signing', 'supply-chain'],
    estMinutes: 3,
    source: 'seed',
  },
  {
    id: 'git-l4-leak-runbook',
    subject: 'git',
    level: 4,
    type: 'free',
    title: 'INC-2837: write the leaked-credential runbook',
    scenario:
      'Post-incident review for the leaked AWS key (INC-2834). The cleanup worked, but it was improvised over four stressful hours. Maya’s action item for you: **write the permanent runbook** for "a live credential was pushed to a NimbusPay repository" — so the next on-call does it right in thirty minutes.',
    prompt:
      'Write the runbook: the steps in order, and *why* the order matters. Cover both cleanup and prevention.',
    rubric:
      'A strong answer must include, in roughly this order: (1) rotate/revoke the credential FIRST and treat it as already compromised — history cleanup never un-leaks a pushed secret; bonus for auditing usage of the key (e.g. CloudTrail) before and after rotation. (2) Rewrite ALL history containing the secret with git filter-repo (or BFG) — explicitly not just a forward deletion/revert commit. (3) Coordinate the force-push: freeze merges, notify the team, everyone re-clones or hard-resets, open PRs get rebased. (4) Handle residual copies: forks, old clones, CI caches, and GitHub’s cached views/PR refs (support request). (5) Prevention: push protection and secret scanning, pre-commit hooks, secrets moved to a secret manager or env injection instead of tracked files. Answers that put history rewrite before rotation, or claim the deletion commit was sufficient, fail the exercise.',
    modelAnswer:
      'First, assume the key is burned: rotate it immediately, revoke the old one, and audit CloudTrail for any use since the push — this is the actual security fix, and nothing else matters until it is done, because every clone, fork and scraper already has the secret. Second, purge it from history: run git filter-repo (or BFG) to rewrite every commit containing the secret; a deletion or revert commit only cleans the tip while all earlier commits keep serving the key. Third, coordinate the rewrite: freeze merges, force-push the cleaned history, have every developer re-clone or fetch-and-hard-reset, rebase open PRs, and ask GitHub support to purge cached views and orphaned PR refs; chase known forks. Finally, prevent recurrence: enable push protection and secret scanning on the org, add a pre-commit/CI secret scan, and move runtime secrets into the secret manager so they never live in tracked files. Document the timeline in the incident report — the order (rotate, rewrite, coordinate, prevent) is the runbook’s spine.',
    explanation:
      'The core principle: a pushed secret is a **compromised** secret — git history is distributed, so you cannot recall it, only make it worthless via rotation. Everything else (filter-repo, force-push, cache purges) is hygiene that shrinks the future attack surface and silences scanners, and prevention (push protection, secret managers) is what keeps this runbook unused. Order matters more than tooling: rotate before you rewrite, coordinate before you force-push.',
    fundamental: 'history-rewrite',
    xp: 50,
    tags: ['secrets', 'filter-repo', 'runbook', 'incident-response'],
    estMinutes: 4,
    source: 'seed',
  },
] satisfies Challenge[]
