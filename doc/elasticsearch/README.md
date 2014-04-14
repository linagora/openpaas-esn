This file describe how to compile LaTeX documentation for Elasticsearch.

Prerequisites
=============

You need a LaTeX compiler in order to compile `.tex` documents. If you have the `pdflatex` and `xelatex` command, you can skip this section.

You can download [TeX Live](https://www.tug.org/texlive/) or [MiKTeX](http://miktex.org/) compiler.

When you have installed one compiler, you have `pdflatex` and `xelatex` command. If you don't have these command, please read your compiler documentation.


Compile and read documentation
==============================

The Makefile in each directory make the compilation. The Makefile targets are :

 * `all` (default) : compile all `.tex` file in current directory
 * `viewPDF` : open the PDF generated file with `evince`.
 * `clean` : delete all LaTeX auxiliary files (such as `.aux`, `.log`, etc.) (usefull to have a clean working directory with the PDF file)
 * `cleanall` : same as `clean` but also delete PDF file generated (usefull to have a clean working directory)

Run compilation with :

      make