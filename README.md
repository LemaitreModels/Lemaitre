# Lemaitre

The **LemaitreModels** package family: certified, differentiable, parametric
models of binary-black-hole spacetimes, one scientific domain per repository,
all installing under the shared `lemaitre` namespace.

```python
import lemaitre as lm

lm.initial_data.conformally_flat_puncture.solver.solver_3d   # the CF production 3-D xCFC solver
lm.initial_data.conformally_flat_puncture.parametric         # the certified/differentiable ROM
lm.initial_data.curved_puncture                              # the curved-puncture successor
```

This repository is the **core**: it owns the `lemaitre` namespace root and ships
nothing else. It has **no runtime dependencies**, so every sibling can depend on
it without inheriting a solver stack.

## The family

The namespace is two levels deep, and exactly one distribution owns each level.

| namespace | distribution | repository |
|---|---|---|
| `lemaitre` | `lemaitre` | **Lemaitre** (this repo) |
| `lemaitre.initial_data` | `LM-initial-data` | `LM-initial-data` — the umbrella |
| `lemaitre.initial_data.conformally_flat_puncture` | `LMID-conformally-flat-puncture` | `LMID-conformally-flat-puncture` |
| `lemaitre.initial_data.curved_puncture` | `LMID-curved-puncture` | `LMID-curved-puncture` |
| `lemaitre.inspiral` | `LM-inspiral` | `LM-inspiral` — the umbrella |
| `lemaitre.inspiral.radiative_puncture` | *(not packaged yet)* | `LMI-radiative-puncture` |
| `lemaitre.ringdown` | `LM-ringdown` | `LM-ringdown` — *not packaged yet* |

Each domain is a git submodule of this repository; each installs, tests and
releases independently. `pkgutil.extend_path` merges the `lemaitre/` directories
found on `sys.path` into one package, and a PEP 562 `__getattr__` imports
subpackages lazily, so `import lemaitre` alone is enough to reach any installed
member.

> **Not every member is released yet.** `LM-initial-data` and
> `LMID-conformally-flat-puncture` are public; `LMID-curved-puncture`,
> `LM-inspiral` and `LM-ringdown` accompany papers still in preparation and their
> repositories are not open yet. They are marked `update = none` in
> `.gitmodules`, so `git clone --recurse-submodules` **succeeds** and simply
> leaves those directories empty rather than failing on them. Nothing you can
> install depends on them. Once they are released, `git submodule update --init
> --recursive --checkout` picks them up.

## Install

```bash
git clone --recurse-submodules https://github.com/LemaitreModels/Lemaitre.git
cd Lemaitre

E="--config-settings editable_mode=compat"
pip install -e . $E                                            # the core
pip install -e LM-initial-data $E                              # the initial-data umbrella
pip install -e LM-initial-data/LMID-conformally-flat-puncture $E
pip install -e LM-initial-data/LMID-curved-puncture $E
pip install -e LM-inspiral $E                                  # the inspiral umbrella

python -c "import lemaitre as lm; lm.initial_data.conformally_flat_puncture"   # smoke check
```

Installing a leaf pulls its own dependencies (`jax`, `numpy`, `scipy`,
`matplotlib` for the puncture models) plus the core and umbrella it declares.
Install only the members you need — they are independent distributions.

`editable_mode=compat` is not optional. setuptools' modern editable mode
installs each distribution behind a meta-path finder, and `PathFinder` runs
*before* those, so the leaves' bare `lemaitre/initial_data/` directories win as
PEP 420 namespace portions and the umbrella's real `__init__.py` is never
loaded. Direct imports still work; `lm.initial_data.<model>` does not. Normal
(non-editable) installs are unaffected.

## Working across the submodules

The family is one superproject and one submodule per domain, nested two deep
(`Lemaitre` → `LM-initial-data` → `LMID-*`). The ordering rule is **asymmetric**,
and it is the whole discipline.

**Committing and pushing: innermost → outermost.** Push a leaf *before*
committing the pointer that names it — a superproject commit recording a SHA
nobody can fetch breaks the clone for everyone but its author.

```bash
git -C LM-initial-data/LMID-curved-puncture commit -m "..."      # 1. the leaf
git -C LM-initial-data/LMID-curved-puncture push origin main
git -C LM-initial-data add LMID-curved-puncture                  # 2. the umbrella
git -C LM-initial-data commit -m "Advance the curved-puncture submodule to ..."
git -C LM-initial-data push origin main
git add LM-initial-data                                          # 3. the superproject
git commit -m "Advance the initial-data umbrella to ..." && git push origin main
```

**Pulling: outermost → innermost.** The superproject tells the submodules where
to go, never the reverse: `git pull && git submodule update --init --recursive`.

**A submodule commit is not a change until its parent records it.** The pointer
must be staged in every parent up the chain, or the work is invisible to a fresh
clone. `git submodule status --recursive` from the root flags a stale pointer
with a leading `+`.

Set this up once, and git enforces the first rule for you instead of leaving it
to discipline:

```bash
git config push.recurseSubmodules on-demand   # or 'check' to refuse rather than auto-push
git config submodule.recurse true             # pull/checkout/switch recurse
git config status.submoduleSummary true       # `git status` says which submodule moved
git config diff.submodule log                 # pointer diffs render as commit subjects
```

Pointer-bump commit messages should say what moved and why (`old → new` plus a
line of content): that message is the only thing a reader of the superproject
history sees. A leaf's `main` can also advance without any parent noticing —
`git submodule foreach --recursive 'git fetch -q && git status -sb | head -1'`
spots leaves that have drifted ahead of the recorded pointer.

## License

GPL-3.0 (see `LICENSE`).
