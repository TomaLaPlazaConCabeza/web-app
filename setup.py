from setuptools import setup, find_packages

with open("README.md") as handle:
    LONG_DESCRIPTION = handle.read()

setup(
    name="web_app",
    description="Wep App for TomaLaPlazaConCabeza",
    long_description=LONG_DESCRIPTION,
    version="0.1.0-dev",
    author="TomaLaPlazaConCabeza",
    author_email="sander@sndrtj.eu",
    url="https://github.com/TomaLaPlazaConCabeza/web-app",
    license="BSD-3-clause",
    packages=find_packages(),
    python_requires=">=3.8",
    zip_safe=False,
    install_requires=[
        "Flask>=1.1.2,<1.2.0",
        "numpy>=1.18.4,<1.19.0",
        "Shapely>=1.7.0,<1.8.0",
        "descartes>=1.1.0,<1.2.0",
    ],
)
