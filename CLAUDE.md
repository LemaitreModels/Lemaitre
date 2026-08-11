# CLAUDE.md

Guidance for Claude Code working in **Lemaitre**, the superproject of the
LemaitreModels package family.

> Keep this file current: when you add a family member, change the namespace
> layout, change how the family is installed or run, or change the submodule
> cadence, update the relevant section before finishing.

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
  this repo, `lemaitre.initial_data` to `LM-initial-data`, and each model
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

## Environment and commands

**The family shares the `BBHFM` micromamba environment** — the same one
`BBHFM/CLAUDE.md`'s Commands section prescribes for the monorepo. There is no
separate Lemaitre env, and there is no `python` on the bare `PATH`: the system
`/usr/bin/python3` is 3.9, below every `requires-python = ">=3.10"` here, so an
un-activated shell cannot run any of this.

```bash
micromamba activate BBHFM     # python 3.14.3; jax 0.10.1, numpy 2.4.3, scipy 1.17.1,
                              # matplotlib 3.10.8, pytest 9.0.2 already live here
```

Non-interactive shells (agents, hooks, `sbatch`) cannot rely on `micromamba
activate`; address the interpreter directly:

```bash
/Users/frederikd/micromamba/envs/BBHFM/bin/python -m pytest -q
```

**Install: all four distributions, editable, in dependency order.**

```bash
for d in . LM-initial-data \
         LM-initial-data/LMID-conformally-flat-puncture \
         LM-initial-data/LMID-curved-puncture ; do
  python -m pip install -e "$d" --config-settings editable_mode=compat --no-deps
done
```

`editable_mode=compat` is the ground rule above — without it the namespace
silently degrades. `--no-deps` and the **order** go together: none of
`lemaitre`, `LM-initial-data`, `LMID-conformally-flat-puncture` is
published, so pip must not try to resolve them from PyPI, and each must already
be installed before its dependents. The solver stack (`jax`, `numpy`, `scipy`,
`matplotlib`) comes from the env, not from these installs. Verify with the thing
the leaf guards check — lazy attribute access through *both* namespace levels:

```bash
python -c "import lemaitre as lm; lm.initial_data.curved_puncture.operators; print('OK')"
```

**Running the suites.** Only the two initial-data leaves ship tests; the core,
the `LM-initial-data` umbrella, `LM-inspiral` and `LM-ringdown` have none, so a
bare `pytest` there collects nothing and that is not a failure.

```bash
caffeinate -i pytest -q       # in LMID-conformally-flat-puncture: 542 tests, ~36 min
caffeinate -i pytest -q       # in LMID-curved-puncture: 77 tests (1 xfail), ~65 min
caffeinate -i pytest -s -q tests/test_stage0.py   # -s: the gates print every measured number
```

Both full suites run for **tens of minutes** — start them in the background and
do other work rather than blocking, and do **not** pipe them through `tail` or
`head`: that buffers everything until pytest exits, so a run in progress is
indistinguishable from a hung one.

For a quick check that an install or a namespace change is sound,
`tests/test_self_containment.py` alone takes under two seconds — 191 tests in the
conformally-flat leaf, 22 in the curved one. Run it inside **one leaf at a
time**: the two files share a basename, so pytest refuses to collect both in a
single invocation (`import file mismatch`). That is the concrete reason for the
"tests live in the leaves" ground rule above.

The gate tests are written to *print* what they measured, so run them with `-s`
whenever the number, not just the pass, is the point.

**The umbrella's name collides with a retired distribution — do not reinstall
it.** `LM-initial-data` is *also* the name of the pre-migration PARASOL package
under `BBHFM/LemaitreModels/LM-initial-data`, which owns the unrelated
`lm.initial_data` root. Both normalise to the same
`lm_initial_data-0.1.0.dist-info`, and two distributions cannot share a name in
one environment, so installing the umbrella silently replaces it. PARASOL has
therefore been **uninstalled** from the BBHFM env: `import lm` now raises
`ModuleNotFoundError`, and since every `lm.initial_data` consumer lived inside
that package's own tests and paper scripts, nothing else lost anything. Its
source tree is untouched — `pip uninstall` on an editable install removes only
the dist-info and the path hook — so use a *separate* env if you ever need
PARASOL again.

**After renaming a distribution, delete the old `.egg-info` by hand.**
Uninstalling the old name is not sufficient. setuptools leaves the old-name
`src/lemaitre_initial_data.egg-info` beside the newly built
`src/LM_initial_data.egg-info`, and `editable_mode=compat` puts `src/` on
`sys.path` — so `importlib.metadata` reads egg-info out of the *source tree* and
`pip list` resurrects the phantom on the very next install, with an empty
location column. The directories are gitignored and never tracked, so removing
one is safe. This lists what the interpreter actually believes is installed,
source-tree egg-info included, which `pip show` will not tell you — filter on the
distribution *name*, never on the path, or every entry under `Lemaitre/` matches
and the `site-packages` ones appear to be missing:

```bash
python -c "
from importlib.metadata import distributions
for d in sorted(distributions(), key=lambda d: ((d.metadata['Name'] or '').lower(), str(d._path))):
    n = d.metadata['Name'] or ''
    if n.lower().startswith(('lemaitre','lm-','lm_','lmid')): print(f'{n:32s} {d.version}  {d._path}')"
```

Expect **eight lines: four names, each appearing twice** — once as a `.dist-info`
in `site-packages` and once as its own `.egg-info` in the source tree, since
`editable_mode=compat` puts every `src/` on `sys.path`. Both entries per name are
normal. The phantom's signature is a *fifth* name whose **only** entry is a
source-tree egg-info, with no `site-packages` dist-info to match it.

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
