import * as astronaut from "https://opensource.liveg.tech/Adapt-UI/astronaut/astronaut.js";

import * as main from "./script.js";

export var UnitListing = astronaut.component("UnitListing", function(props, children) {
    var heading = Heading() (props.unit.name);

    var listing = Container() (
        heading,
        Paragraph() (
            Text("This lesson, "),
            ElementNode("strong") (props.unit.title),
            Text(", includes:")
        ),
        UnorderedList() (
            props.unit.lessons.map((lesson) => ListItem() (lesson.name))
        )
    );

    heading.on("click", function() {
        main.openLessons(props.unit);
    });

    return listing;
});

export var UnitsViewScreen = astronaut.component("UnitsViewScreen", function(props, children) {
    var page = Page(true) (
        Section (
            Heading() ("Hello!")
        )
    );

    var screen = Screen({showing: props.showing}) (
        Header (
            Text("Units")
        ),
        page
    );

    fetch("resources.json").then(function(response) {
        return response.json();
    }).then(function(data) {
        var listing = UnitListing({unit: data.units[0]}) ();

        page.add(
            Section (
                listing
            )
        );
    });

    return screen;
});