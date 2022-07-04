import * as astronaut from "./lib/adaptui/astronaut/astronaut.js";
import * as aside from "./lib/adaptui/src/aside.js";
import * as markup from "./lib/adaptui/src/markup.js";

import * as pdfViewer from "./pdfviewer.js";

export const RESOURCE_TYPE_NAMES = {
    unitOverview: "Overview information",
    worksheet: "Worksheet",
    worksheetExtension: "Extension worksheet",
    presentation: "Presentation",
    presentationExtension: "Extension presentation",
    cribSheet: "Crib sheet",
    cribSheetExtension: "Extension crib sheet"
};

export var ResourcePage = astronaut.component("ResourcePage", function(props, children, inter) {
    var page = Page({showing: props.showing, styles: {overflow: "hidden"}}) ();

    var alreadyLoaded = false;

    inter.load = function() {
        if (alreadyLoaded) {
            return;
        }

        page.clear().add(
            pdfViewer.PdfContainer({
                url: props.url,
                downloadFilename: props.downloadFilename,
                styles: {
                    height: "100%"
                }
            }) ()
        );

        alreadyLoaded = true;
    };

    return page;
});

export var LessonsViewScreen = astronaut.component("LessonsViewScreen", function(props, children) {
    var screen = Screen (
        Header (
            IconButton({icon: "back", alt: "Back to units list", attributes: {"aui-bind": "back"}}) (),
            HeaderPageMenuButton() (),
            ElementNode("span") (
                ElementNode("strong") (props.unit.name),
                Text(": "),
                Text(props.unit.title)
            )
        )
    );

    var pagesToAdd = [];
    var firstLessonAdded = false;

    var lessonNumber = 1;

    var menu = PageMenu() (...props.unit.lessons.map(function(lesson, i) {
        var accordion = Accordion() (ElementNode("strong") (!lesson.notNumbered ? `${lessonNumber}. ${lesson.name}` : lesson.name));

        if (lesson.inDevelopment) {
            accordion.add(
                Paragraph() ("This lesson is still in development.")
            );
        }

        if (!lesson.notNumbered) {
            lessonNumber++;
        }

        accordion.add(
            ...Object.keys(lesson.resources).map(function(resourceType, i) {
                var resourceUrl = lesson.resources[resourceType];
                var isDefaultResource = i == 0 && ((props.lesson == null && !firstLessonAdded) || (props.lesson != null && props.lesson.id == lesson.id));

                var page = ResourcePage({
                    showing: isDefaultResource,
                    url: resourceUrl,
                    downloadFilename: `${props.unit.name} - ${lesson.name} - ${RESOURCE_TYPE_NAMES[resourceType]}.pdf`
                }) ();

                var button = PageMenuButton({page}) (RESOURCE_TYPE_NAMES[resourceType]);

                if (isDefaultResource) {
                    accordion.setAttribute("open", "");
                    page.inter.load();
                }

                button.on("click", function() {
                    page.inter.load();
                });

                firstLessonAdded = true;

                pagesToAdd.push(page);

                return button;
            })
        );

        return accordion;
    }));

    aside.addPages(menu.get());

    screen.add(menu, ...pagesToAdd);

    markup.apply(screen.get());

    return screen;
});