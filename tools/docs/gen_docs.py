"""Regenera todos los documentos: python -m tools.docs.gen_docs"""
from . import diagramas, gen_ers, gen_estudio, gen_ia, gen_uml

if __name__ == "__main__":
    diagramas.generar()
    for modulo in (gen_ers, gen_uml, gen_ia, gen_estudio):
        print(modulo.generar())
