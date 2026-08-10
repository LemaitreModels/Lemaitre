# Lemaitre

The **LemaitreModels** package family: certified, differentiable, parametric
models of binary-black-hole spacetimes, one scientific domain per repository,
all installing under the shared `lemaitre` namespace.

```python
import lemaitre as lm

lm.initial_data.conformally_flat.solver.solver_3d   # the CF production 3-D xCFC solver
lm.initial_data.conformally_flat.parametric         # the certified/differentiable ROM
lm.initial_data.curved                              # the curved-puncture successor
```

This repository is the **core**: it owns the `lemaitre` namespace root and ships
nothing else. It has **no runtime dependencies**, so every sibling can depend on
it without inheriting a solver stack.

## The family

The namespace is two levels deep, and exactly one distribution owns each level.

| namespace | distribution | repository |
|---|---|---|
| `lemaitre` | `lemaitre` | **Lemaitre** (this repo) |
| `lemaitre.initial_data` | `lemaitre-initial-data` | `LM-initial-data` — the umbrella |
| `lemaitre.initial_data.conformally_flat` | `lemaitre-initial-data-conformally-flat` | `LMID-conformally-flat-puncture` |
| `lemaitre.initial_data.curved` | `lemaitre-initial-data-curved` | `LMID-curved-puncture` |
| `lemaitre.early_inspiral` | `lemaitre-early-inspiral` | `LM-inspiral` |

Each domain is a git submodule of this repository; each installs, tests and
releases independently. `pkgutil.extend_path` merges the `lemaitre/` directories
found on `sys.path` into one package, and a PEP 562 `__getattr__` imports
subpackages lazily, so `import lemaitre` alone is enough to reach any installed
member.

## Install

```bash
git clone --recurse-submodules git@github.com:LemaitreModels/Lemaitre.git
cd Lemaitre

E="--config-settings editable_mode=compat"
pip install -e . $E                                            # the core
pip install -e LM-initial-data $E                              # the umbrella
pip install -e LM-initial-data/LMID-conformally-flat-puncture $E
pip install -e LM-initial-data/LMID-curved-puncture $E

python -c "import lemaitre as lm; lm.initial_data.conformally_flat"   # smoke check
```

Installing a leaf pulls its own dependencies (`jax`, `numpy`, `scipy`,
`matplotlib` for the puncture models) plus the core and umbrella it declares.
Install only the members you need — they are independent distributions.

## License

GPL-3.0 (see `LICENSE`).
