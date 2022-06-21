import * as astronaut from "./lib/adaptui/astronaut/astronaut.js";

import * as main from "./script.js";

export var CategoryHeading = astronaut.component("CategoryHeading", function(props, children) {
    return Heading({level: 2, styles: {
        color: "var(--secondaryUI)"
    }}) (...children);
});

export var UnitListing = astronaut.component("UnitListing", function(props, children) {
    var heading = Heading({level: 3, styles: {
        color: "var(--primaryUI)"
    }}) (props.unit.name);

    var listing = Container() (
        heading,
        Paragraph() (
            Text("This unit, "),
            ElementNode("strong") (props.unit.title),
            Text(", includes:")
        ),
        UnorderedList() (
            props.unit.lessons.map(function(lesson) {
                if (Object.keys(lesson.resources).length == 0) {
                    return ListItem() (`${lesson.name} (in development)`);
                }

                var lessonLink = Link("javascript:void(0);") (lesson.inDevelopment ? `${lesson.name} (in development)` : lesson.name);

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
                Heading(2) (),
                astronaut.repeat(3, Paragraph() ()),
                astronaut.repeat(3, Container (
                    Heading(3) (),
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

    var websiteNavigationButton = Button("navigational") ("Visit the main WoLLoW website");

    websiteNavigationButton.on("click", function() {
        window.open("https://theworldoflanguages.co.uk");
    });

    fetch("resources.json").then(function(response) {
        return response.json();
    }).then(function(data) {
        page.clear().add(
            Section (
                Heading() ("WoLLoW Resources"),
                Accordion({open: true, attributes: {"aui-mode": "boxed"}}) (
                    Text("About these resources"),
                    Paragraph() ("We hope you enjoy using our free WoLLoW lesson resources. You can use our resources in the following ways:"),
                    UnorderedList (
                        ListItem() ("Follow the Key Stage 2 or Key Stage 3 course at a pace that suits the students and time allowed on the curriculum, identifying and exploiting curriculum crossover along the way"),
                        ListItem() ("Follow the course alongside more specific language provision to add a wider dimension to language learning"),
                        ListItem() ("Pick and choose standalone lessons or sequences of lessons to add variety, context and depth to established programmes for specific language learning"),
                        ListItem() ("Use as one-off lessons to encourage students to think about language in different ways")
                    ),
                    Paragraph() ("Our resources are copyrighted to The World of Languages and Languages of the World (WoLLoW). Please keep all lesson resources in their original format and be sure to credit WoLLoW as you teach the course. Please keep the resources to within your school and if any other schools like the look of our work, send them to our website (theworldoflanguages.co.uk) where they can request access to our resources. We would be very grateful for any feedback."),
                    websiteNavigationButton
                ),
                Accordion({open: false, attributes: {"aui-mode": "boxed"}}) (
                    Text("Using this site"),
                    Paragraph() ("The WoLLoW Resources site holds a repository of all the resources created by WoLLoW as PDF files that you can view, download and print."),
                    Paragraph() ("Our resources are divided into units that are relevant to different Key Stages (such as Key Stage 2 or Key Stage 3); and inside each unit, there is around 5-6 lessons."),
                    Paragraph() ("Each lesson typically contains a worksheet, a presentation and a crib sheet, which can all be accessed in the menu for a chosen unit."),
                    Paragraph() ("For each lesson resource, you can view the contents of the resource in your browser without having to download it. We additionally provide you with the option to present a resource in a fullscreen mode, which you can use to deliver our presentations.")
                )
            ),
            Section (
                CategoryHeading() ("Primary resources (Key Stage 2)"),
                Paragraph() ("Our primary resources, worksheets and crib sheets are being finalised; however, we're excited to offer our users some of our already-completed materials that we have been writing for primary school lessons. Please keep checking back to see our added resources when we've completed the development of our units."),
                CategoryListing({category: "primary", units: data.units}) (),
                // TODO: Primary lower years
                // CategoryHeading() ("Alternative primary resources for lower years (Key Stage 2)"),
                // CategoryListing({category: "primaryLowerAlt", units: data.units}) ()
                CategoryHeading() ("Secondary resources for Year 7 (Key Stage 3)"),
                CategoryListing({category: "secondaryYr7", units: data.units}) ()
            )
        );
    });

    return screen;
});