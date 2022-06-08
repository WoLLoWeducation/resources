import * as $g from "https://opensource.liveg.tech/Adapt-UI/src/adaptui.js";
import * as astronaut from "https://opensource.liveg.tech/Adapt-UI/astronaut/astronaut.js";

export var pdfjs = window["pdfjs-dist/build/pdf"];

var PdfControlButton = astronaut.component("PdfControlButton", function(props, children) {
    return Button({
        ...props,
        attributes: {
            "title": props.noTitle ? "" : props.alt,
            "aria-label": props.alt,
            "aui-display": props.desktopOnly ? "desktop" : ""
        },
        styles: {
            ...props?.styles,
            height: "2.5rem",
            margin: "0",
            backgroundColor: "transparent",
            color: "inherit"
        }
    }) (
        Icon({
            icon: props.icon,
            type: "dark embedded",
            styles: {
                display: "inline",
                width: "unset",
                height: "100%",
                verticalAlign: "middle"
            }
        }) (),
        ElementNode("span", {
            attributes: {
                "aui-display": "desktop"
            }
        }) (` ${props.label || ""}`)
    );
});

var PdfControlSpacer = astronaut.component("PdfControlSpacer", function(props, children) {
    return ElementNode("span", {
        ...props,
        styles: {
            flexGrow: "1"
        }
    }) (...children);
});

export var PdfContainer = astronaut.component("PdfContainer", function(props, children) {
    var canvas = ElementNode("canvas", {
        styles: {
            width: "100%",
            height: "calc(100% - 0.5rem)",
            objectFit: "contain"
        }
    }) ();

    var previousButton = PdfControlButton({icon: "back", alt: "Previous page"}) ();
    var nextButton = PdfControlButton({icon: "forward", alt: "Next page"}) ();
    var openExternalButton = PdfControlButton({icon: "opennew", alt: "Open document in new tab"}) ();
    var fitWidthButton = PdfControlButton({icon: "panin", alt: "Fit document by width"}) ();
    var fitFullButton = PdfControlButton({icon: "panout", alt: "Fit document fully"}) ();
    var printButton = PdfControlButton({icon: "print", alt: "Print", noTitle: true, label: "Print"}) ();
    var presentButton = PdfControlButton({icon: "fullscreen", alt: "Present", noTitle: true, label: "Present", desktopOnly: true}) ();

    var pageNumberInput = NumericalInput({
        styles: {
            width: "4rem",
            minWidth: "0",
            margin: "0",
            marginTop: "0.2rem",
            marginBottom: "0.2rem",
            textAlign: "center"
        }
    }) ();

    var pdfDocument = null;
    var currentPage = 1;
    var isFitFully = true;

    function render() {
        return pdfDocument.getPage(currentPage).then(function(page) {
            var viewport = page.getViewport({scale: 2});

            canvas.get().width = viewport.width;
            canvas.get().height = viewport.height;

            page.render({
                canvasContext: canvas.get().getContext("2d"),
                viewport
            });

            pageNumberInput.setValue(currentPage);
        });
    }

    function setFitting(full = true) {
        if (full) {
            fitFullButton.hide();
            fitWidthButton.show();

            canvas.setStyle("height", "calc(100% - 0.5rem)");
            canvas.setStyle("objectFit", "contain");
        } else {
            fitWidthButton.hide();
            fitFullButton.show();

            canvas.setStyle("height", "unset");
            canvas.setStyle("objectFit", "unset");
        }
    }

    function previousPage() {
        if (currentPage <= 1) {
            return;
        }

        currentPage--;

        render();
    }

    function nextPage() {
        if (currentPage >= pdfDocument.numPages) {
            return;
        }

        currentPage++;

        render();
    }

    previousButton.on("click", function() {
        previousPage();
    });

    nextButton.on("click", function() {
        nextPage();
    });

    openExternalButton.on("click", function() {
        window.open(props.url);
    });

    fitWidthButton.on("click", function() {
        setFitting(false);
    });

    fitFullButton.on("click", function() {
        setFitting(true);
    });

    printButton.on("click", function() {
        var embeddedPdf = ElementNode("iframe", {
            attributes: {
                "src": props.url
            }
        }) ();

        $g.sel("body").add(embeddedPdf);

        var interval = setInterval(function() {
            try {
                if (embeddedPdf.get().contentWindow.document.readyState == "complete") {
                    embeddedPdf.get().contentWindow.print();

                    clearInterval(interval);
                }
            } catch (e) {
                window.open(props.url);

                clearInterval(interval);
            }
        }, 500);
    });

    presentButton.on("click", function() {
        canvas.get().requestFullscreen();
    });

    pageNumberInput.on("change", function() {
        currentPage = Number(pageNumberInput.getValue()) || 1;

        if (currentPage < 1) {
            currentPage = 1;
        }

        if (currentPage > pdfDocument.numPages) {
            currentPage = pdfDocument.numPages;
        }

        render();
    });

    $g.sel("body").on("keydown", function(event) {
        if (event.key == "ArrowLeft") {
            previousPage();
        }

        if (event.key == "ArrowRight") {
            nextPage();
        }

        if (event.key == " ") {
            nextPage();
        }
    });

    setFitting();

    pdfjs.getDocument(props.url).promise.then(function(loadedPdf) {
        pdfDocument = loadedPdf;

        render();
    });

    return Container({props, styles: {
        ...props?.styles,
        display: "flex",
        flexDirection: "column"
    }}) (
        Container({styles: {
            height: "0",
            flexGrow: "1",
            overflow: "auto"
        }}) (canvas),
        Container({styles: {
            display: "flex"
        }}) (
            openExternalButton,
            fitWidthButton,
            fitFullButton,
            PdfControlSpacer() (),
            previousButton,
            pageNumberInput,
            nextButton,
            PdfControlSpacer() (),
            printButton,
            presentButton
        )
    );
});