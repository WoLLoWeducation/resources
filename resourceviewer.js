import * as $g from "./lib/adaptui/src/adaptui.js";
import * as astronaut from "./lib/adaptui/astronaut/astronaut.js";

import * as access from "./access.js";
import * as admin from "./admin.js";

export var pdfjs = window["pdfjs-dist/build/pdf"];

var ViewerControlButton = astronaut.component("ViewerControlButton", function(props, children) {
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

var ViewerControlSpacer = astronaut.component("ViewerControlSpacer", function(props, children) {
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

    var previousButton = ViewerControlButton({icon: "back", alt: "Previous page"}) ();
    var nextButton = ViewerControlButton({icon: "forward", alt: "Next page"}) ();
    var updateButton = ViewerControlButton({icon: "edit", alt: "Update this resource", label: "Update"}) ();
    var downloadButton = ViewerControlButton({icon: "download", alt: "Download document"}) ();
    var openExternalButton = ViewerControlButton({icon: "opennew", alt: "Open document in new tab"}) ();
    var fitWidthButton = ViewerControlButton({icon: "panin", alt: "Fit document by width"}) ();
    var fitFullButton = ViewerControlButton({icon: "panout", alt: "Fit document fully"}) ();
    var printButton = ViewerControlButton({icon: "print", alt: "Print", noTitle: true, label: "Print"}) ();
    var presentButton = ViewerControlButton({icon: "fullscreen", alt: "Present", noTitle: true, label: "Present", desktopOnly: true}) ();

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

    updateButton.on("click", function() {
        admin.uploadResourceToUpdate(props.unit.id, props.unit.category, props.lesson.id, props.resourceType);
    });

    downloadButton.on("click", function() {
        var link = $g.create("a");

        link.setAttribute("href", props.url);
        link.setAttribute("download", props.downloadFilename || props.url);

        link.get().click();
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
        setFitting(true);

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

    var container = Container({props, styles: {
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
            updateButton,
            downloadButton,
            openExternalButton,
            fitWidthButton,
            fitFullButton,
            ViewerControlSpacer() (),
            previousButton,
            pageNumberInput,
            nextButton,
            ViewerControlSpacer() (),
            printButton,
            presentButton
        )
    );

    if (!access.isAdmin()) {
        updateButton.remove();
    }

    return container;
});

export var OfficeEmbedContainer = astronaut.component("OfficeEmbedContainer", function(props, children) {
    var updateButton = ViewerControlButton({icon: "edit", alt: "Update this resource", label: "Update"}) ();
    var downloadButton = ViewerControlButton({icon: "download", alt: "Download document", label: "Download"}) ();
    var openExternalButton = ViewerControlButton({icon: "opennew", alt: "Open document in new tab"}) ();

    var embedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${new URL(props.url, window.location.href).href}`;

    downloadButton.on("click", function() {
        var link = $g.create("a");

        link.setAttribute("href", props.url);
        link.setAttribute("download", props.downloadFilename || props.url);

        link.get().click();
    });

    openExternalButton.on("click", function() {
        window.open(embedUrl);
    });

    var container = Container({props, styles: {
        ...props?.styles,
        display: "flex",
        flexDirection: "column"
    }}) (
        Container({styles: {
            display: "flex",
            height: "0",
            flexGrow: "1",
            overflow: "auto"
        }}) (
            ElementNode("iframe", {
                attributes: {
                    "src": embedUrl,
                    "allowfullscreen": true
                },
                styles: {
                    width: "100%",
                    height: "100%",
                    border: "none"
                }
            }) ()
        ),
        Container({styles: {
            display: "flex"
        }}) (
            updateButton,
            downloadButton,
            openExternalButton
        )
    );

    if (!access.isAdmin()) {
        updateButton.remove();
    }

    return container;
});