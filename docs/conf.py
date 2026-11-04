"""Sphinx configuration for the Lemaitre family site, the Read the Docs parent project.

Each released model has its own documentation, built from its own repository and versioned
with its code; Read the Docs serves those as subprojects under /projects/<name>/. This site
is only the family's front page. Build locally with:

    python -m sphinx -b html docs docs/_build

The look is the furo theme recoloured with the Lemaitre style tokens. ``_static/`` is a copy of
the conformally-flat leaf's ``docs/_static/``, itself a copy of LemaitreArtwork's ``style/``.
"""
project = "Lemaitre"
author = "Frederik De Ceuster"
copyright = "2026, Frederik De Ceuster"
release = version = "0.1.0"

extensions = ["myst_parser"]
source_suffix = {".md": "markdown"}
root_doc = "index"
exclude_patterns = ["_build"]
myst_heading_anchors = 2

html_theme = "furo"
html_title = "LemaitreModels"
html_static_path = ["_static"]
html_css_files = ["lemaitre-tokens.css", "lemaitre.css"]
html_theme_options = {
    "source_repository": "https://github.com/LemaitreModels/Lemaitre",
    "source_branch": "main",
    "source_directory": "docs/",
}
