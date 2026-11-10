# LemaîtreModels

Towards parametric models of binary-black-hole spacetimes.

```{raw} html
<div class="lm-imr"></div>
```

*The animation above is only an AI's impression of a parametric binary-black-hole spacetime.*

A black hole binary is set by a handful of numbers: the two masses, the two spins and the orbit.
Einstein's equations turn these numbers into a spacetime, with the gravitational waves our detectors observe.
Today we can follow that map only one binary at a time.

LemaîtreModels aims to model the map itself: the spacetime of a binary black hole as a function of its parameters.
The model should be accurate, fast to evaluate and differentiable, so that we can ask how the geometry and the signal respond when the binary changes.
Waveform models already do this for the signal far from the source.
We want the same for the whole spacetime, so that the <em class="lm-blue">strong-field physics</em> of black holes and their <em class="lm-blue">observations</em> in gravitational waves can be studied with one model.

We build the model in stages.
The first stage is available now: the initial data of a binary as a certified, differentiable function of its separation, mass ratio and spins.


## Parametric initial data

| Model | Paper | Code | Docs |
|---|---|---|---|
| [Conformally flat puncture ID](https://lemaitre.readthedocs.io/projects/lmid-conformally-flat-puncture/) | [arXiv](https://arxiv.org/abs/2609.10173) | [code](https://github.com/LemaitreModels/LMID-conformally-flat-puncture) | [docs](https://lemaitre.readthedocs.io/projects/lmid-conformally-flat-puncture/) |

```{toctree}
:hidden:
:caption: Initial data

Conformally flat puncture ID <https://lemaitre.readthedocs.io/projects/lmid-conformally-flat-puncture/>
```
