# LemaitreModels

Certified, differentiable, parametric models of binary-black-hole spacetimes.
Each scientific domain is its own repository, and every model installs under
the shared `lemaitre` namespace:

```python
import lemaitre as lm

lm.initial_data.conformally_flat_puncture   # conformally flat puncture initial data
```

## Models with documentation

| Model | Package | Documentation | Code |
|---|---|---|---|
| Conformally flat puncture initial data | `lemaitre.initial_data.conformally_flat_puncture` | [docs](https://lemaitre.readthedocs.io/projects/lmid-conformally-flat-puncture/) | [LMID-conformally-flat-puncture](https://github.com/LemaitreModels/LMID-conformally-flat-puncture) |

Each model's documentation is built from its own repository and versioned with
its code, so a paper can cite the documentation of the exact release it used.
Further models are added here as they are released.

## How the family is organised

The namespace is two levels deep, and exactly one distribution owns each level:
`lemaitre` (this repository) owns the root, a domain umbrella such as
`LM-initial-data` owns `lemaitre.initial_data`, and each model owns only its own
package. The repositories are git submodules of
[Lemaitre](https://github.com/LemaitreModels/Lemaitre), whose README explains
how to clone and install the family together.

```{toctree}
:hidden:

Conformally flat puncture initial data <https://lemaitre.readthedocs.io/projects/lmid-conformally-flat-puncture/>
```
