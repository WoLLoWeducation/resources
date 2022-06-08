import * as astronaut from "https://opensource.liveg.tech/Adapt-UI/astronaut/astronaut.js";
import * as aside from "https://opensource.liveg.tech/Adapt-UI/src/aside.js";

import * as pdfViewer from "./pdfviewer.js";

export const RESOURCE_TYPE_NAMES = {
    worksheet: "Worksheet",
    presentation: "Presentation",
    cribSheet: "Crib sheet"
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
            ElementNode("span") (
                ElementNode("strong") (props.unit.name),
                Text(": "),
                Text(props.unit.title)
            )
        )
    );

    var pagesToAdd = [];
    var firstLessonAdded = false;

    var menu = PageMenu() (...props.unit.lessons.map(function(lesson) {
        var accordion = Accordion() (Text(lesson.name));

        accordion.add(
            ...Object.keys(lesson.resources).map(function(resourceType) {
                var resourceUrl = lesson.resources[resourceType];
                var isDefaultResource = !firstLessonAdded;

                var page = ResourcePage({showing: isDefaultResource, url: resourceUrl}) ();
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

    return screen;
});