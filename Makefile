PY ?= python

.PHONY: docs

# The family site: HTML into docs/_build/ (gitignored). Needs the [docs] extra.
docs:
	$(PY) -m sphinx -b html docs docs/_build
