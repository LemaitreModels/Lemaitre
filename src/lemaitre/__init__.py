"""``lemaitre`` — namespace root for the LemaitreModels package family.

A lightweight *namespace* package: each scientific domain lives in its own
distribution / repository and installs under the shared ``lemaitre`` prefix.
This distribution (``lemaitre``, the **core**) ships nothing but this file —
it owns the namespace root and has no runtime dependencies, so every sibling
can depend on it without inheriting a solver stack.

The family is **two levels deep**, and each level is owned by exactly one
distribution:

===================================================  ==================================
namespace                                            distribution / repository
===================================================  ==================================
``lemaitre``                                         ``lemaitre`` (this file)
                                                     — *Lemaitre*
``lemaitre.initial_data``                            ``LM-initial-data``
                                                     — the umbrella
``lemaitre.initial_data.conformally_flat_puncture``  ``LMID-conformally-flat-puncture``
                                                     — the paper package
``lemaitre.initial_data.curved_puncture``            ``LMID-curved-puncture``
                                                     — its successor
``lemaitre.inspiral``                                ``LM-inspiral``
``lemaitre.ringdown``                                ``LM-ringdown``
===================================================  ==================================

Every distribution carries the name of its repository — the core's ``lemaitre``
and *Lemaitre* differ only in case, which packaging normalises away.

``lemaitre.initial_data`` is itself a namespace level: the umbrella owns its
``__init__.py`` and the two puncture leaves add only their own leaf package, so
the conformally-flat and curved models are installable and releasable
independently while importing as siblings.

``pkgutil.extend_path`` merges every ``lemaitre/`` directory found on
``sys.path`` into one package, so sibling distributions coexist.  A PEP 562
``__getattr__`` lazily imports subpackages on attribute access, so::

    import lemaitre as lm
    lm.initial_data.conformally_flat_puncture.solver.solver_3d   # resolves on first access

works without importing each subpackage explicitly.

Family bookkeeping: exactly ONE installed distribution may own this
``lemaitre/__init__.py``, and that is the ``lemaitre`` core.  A sibling that
ships its own copy will shadow this one non-deterministically.
"""
from pkgutil import extend_path

__path__ = extend_path(__path__, __name__)

__version__ = "0.1.0"


def __getattr__(name):
    import importlib

    try:
        return importlib.import_module(f"{__name__}.{name}")
    except ModuleNotFoundError as exc:
        raise AttributeError(
            f"module {__name__!r} has no attribute {name!r} "
            f"(no installed 'lemaitre.{name}' subpackage)"
        ) from exc
