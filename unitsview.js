import * as astronaut from "./lib/adaptui/astronaut/astronaut.js";

import * as main from "./script.js";

export var UnitListing = astronaut.component("UnitListing", function(props, children) {
    var heading = Heading(2) (props.unit.name);

    var listing = Container() (
        heading,
        Paragraph() (
            Text("This unit, "),
            ElementNode("strong") (props.unit.title),
            Text(", includes:")
        ),
        UnorderedList() (
            props.unit.lessons.map(function(lesson) {
                var lessonLink = Link("javascript:void(0);") (lesson.name);

                lessonLink.on("click", function() {
                    main.openLessons(props.unit, lesson);
                })

                return ListItem() (lessonLink);
            })
        )
    );

    heading.on("click", function() {
        main.openLessons(props.unit);
    });

    return listing;
});

export var CategoryListing = astronaut.component("CategoryListing", function(props, children) {
    return Container() (
        ...props.units.filter((unit) => unit.category == props.category).map(function(unit) {
            return UnitListing({unit}) ();
        })
    );
});

export var UnitsViewScreen = astronaut.component("UnitsViewScreen", function(props, children) {
    var page = Page(true) (
        Section () (
            SkeletonLoader("Loading units...") (
                Heading(1) (),
                astronaut.repeat(3, Paragraph() ()),
                astronaut.repeat(3, Container (
                    Heading(2) (),
                    astronaut.repeat(3, Paragraph() ())
                ))
            )
        )
    );

    var screen = Screen({showing: props.showing}) (
        Header (
            Text("WoLLoW Resources")
        ),
        page
    );

    fetch("resources.json").then(function(response) {
        return response.json();
    }).then(function(data) {
        page.clear().add(
            Section (
                Heading() ("Primary resources"),
                CategoryListing({category: "primary", units: data.units}) ()
            )
        );
    });

    return screen;
});