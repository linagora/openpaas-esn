LATEX = xelatex
PDF_VIEWER = evince

# +-----------------------------------+
# | Makefile variable. DON'T EDIT !!! |
# +-----------------------------------+
PDF_OUTPUT = $(patsubst %.tex,%.pdf,$(wildcard *.tex))

.PHONY: all compileall viewPDF clean cleanall

# +-----------+
# | Cible all |
# +-----------+

all: compileall

# +-------------+
# | Cible latex |
# +-------------+

%.pdf : %.tex
	if [ -f $@ ]; then $(LATEX) $<; else $(LATEX) $< && $(LATEX) $<; fi
	@echo "+----------------------------------------+"
	@echo "|----------------------------------------|"
	@echo "| Use 'make viewPDF' for viewing the pdf |"
	@echo "|----------------------------------------|"
	@echo "+----------------------------------------+"

# +------------------+
# | Cible compileall |
# +------------------+

compileall: $(PDF_OUTPUT)

# +---------------+
# | Cible viewPDF |
# +---------------+

viewPDF: compileall
	$(PDF_VIEWER) $(PDF_OUTPUT)

# +-------------+
# | Cible clean |
# +-------------+

clean:
	rm -f *.aux *.log *.out *.toc *.nav *.snm *.vrb

# +----------------+
# | Cible cleanall |
# +----------------+

cleanall: clean
	rm -f $(PDF_OUTPUT)

