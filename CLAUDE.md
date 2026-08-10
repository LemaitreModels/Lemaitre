# CLAUDE.md

Guidance for Claude Code working in **Lemaitre**, the superproject of the
LemaitreModels package family.

> Keep this file current: when you add a family member, change the namespace
> layout, or change the submodule cadence, update the relevant section before
> finishing.

## What this repo is

The **core**: it owns the `lemaitre` namespace root, ships one `__init__.py` and
nothing else, and has **no runtime dependencies** — so every sibling can depend
on it without inheriting a solver stack. Every domain repo is a git submodule
here. See `README.md` for the family table.

Per-model guidance lives in the leaf repos, not here — e.g.
`LM-initial-data/LMID-conformally-flat-puncture/CLAUDE.md`. Read the leaf's
`CLAUDE.md` before working inside it.

## Ground rules (load-bearing)

- **Exactly one distribution owns each namespace level.** `lemaitre` belongs to
  this repo, `lemaitre.initial_data` to `lemaitre-initial-data`, and each model
  owns only its own leaf package. A leaf must **not** ship
  `src/lemaitre/__init__.py` or `src/lemaitre/initial_data/__init__.py` — a copy
  would shadow the owner non-deterministically. Each leaf's
  `tests/test_self_containment.py` pins this; keep it passing.
- **Dependency direction is one-way and never inverted.**
  `lemaitre.initial_data.curved_puncture` depends on
  `lemaitre.initial_data.conformally_flat_puncture` (it reuses the ABT chart,
  the Newton–Krylov solver and the ROM). Nothing in the conformally-flat package
  may import the curved one.
- **Editable installs need `editable_mode=compat`.** setuptools' modern editable
  mode installs each distribution behind a meta-path finder, and `PathFinder`
  runs *before* those, so the leaves' bare `lemaitre/initial_data/` directories
  win as PEP 420 namespace portions and the umbrella's real `__init__.py` is
  never loaded. Direct imports still work; lazy attribute access does not. The
  leaf guards print this as `INSTALL_HINT` when they catch it.
- **Tests live in the leaves.** Run `pytest -q` inside the repo you changed, not
  from here.

## Working across the submodules

The ordering rule is **asymmetric**, and it is the whole discipline.

**Committing and pushing: innermost → outermost.** Push a leaf *before*
committing the pointer that names it. A superproject commit that records a SHA
nobody can fetch breaks the clone for everyone but you.

```bash
# 1. the leaf
git -C LM-initial-data/LMID-curved-puncture commit -m "..."
git -C LM-initial-data/LMID-curved-puncture push origin main
# 2. the umbrella records the new pointer
git -C LM-initial-data add LMID-curved-puncture
git -C LM-initial-data commit -m "Advance the curved-puncture submodule to ..."
git -C LM-initial-data push origin main
# 3. the superproject records the umbrella
git add LM-initial-data && git commit -m "Advance the initial-data umbrella to ..."
git push origin main
```

**Pulling: outermost → innermost.** The superproject tells the submodules where
to go, never the reverse.

```bash
git pull && git submodule update --init --recursive
```

**A submodule commit is not a change until its parent records it.** After any
leaf work, the pointer must be staged in *every* parent up the chain or the work
is invisible to a fresh clone. The check, from the root:

```bash
git submodule status --recursive     # a leading '+' means the parent's pointer is stale
```

**Pointer-bump commit messages must say what moved and why** — `old -> new` plus
a line of content. That message is the only thing a reader of the superproject
history sees; "update submodule" tells them nothing.

**Prefer `git -C <path>` over `cd`.** The shell's working directory persists
between commands, and a failed `cd` in a `cd X && git ...` chain silently runs
git in the wrong repo.

Recommended local config — the first line is the one that matters, because it
makes git *refuse* the innermost/outermost mistake instead of relying on
discipline:

```bash
git config push.recurseSubmodules on-demand   # or 'check' to refuse rather than auto-push
git config submodule.recurse true             # pull/checkout/switch recurse
git config status.submoduleSummary true       # `git status` says which submodule moved
git config diff.submodule log                 # pointer diffs render as commit subjects
```

A leaf's `main` can also advance without any parent noticing. To spot leaves
that have drifted ahead of the recorded pointer:

```bash
git submodule foreach --recursive 'git fetch -q && git status -sb | head -1'
```

## Working cadence

Report-then-wait at milestone boundaries: keep each committed unit
independently tested, run the affected leaf's suite after significant changes,
then propose a commit message and **wait for the user before committing**.
`caffeinate -i` any local run longer than a few seconds, and state an ETA before
anything over ~30 s.
