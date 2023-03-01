import * as $g from "./lib/adaptui/src/adaptui.js";
import * as astronaut from "./lib/adaptui/astronaut/astronaut.js";

astronaut.unpack();

import * as access from "./access.js";
import * as admin from "./admin.js";
import * as unitsView from "./unitsview.js";
import * as lessonsView from "./lessonsview.js";

var unitsViewScreen = unitsView.UnitsViewScreen({showing: true}) ();
var currentLessonViewScreen = null;

export var fileUploadInput = ElementNode("input", {
    attributes: {
        "type": "file"
    },
    styles: {
        "display": "none"
    }
}) ();

access.init();
admin.init();

export var root = Container() (
    unitsViewScreen,
    access.passwordEntryDialog,
    access.unlockConfirmationDialog,
    admin.changesPublishedDialog,
    fileUploadInput
);

export function showUnitsView() {
    unitsViewScreen.screenBack();
}

export function openLessons(unit, lesson = null) {
    if (currentLessonViewScreen != null) {
        currentLessonViewScreen.remove();
    }

    currentLessonViewScreen = lessonsView.LessonsViewScreen({unit, lesson}) ();

    root.add(currentLessonViewScreen);

    currentLessonViewScreen.screenForward();
}

$g.theme.setProperty("primaryHue", "204");
$g.theme.setProperty("primarySaturation", "83%");
$g.theme.setProperty("primaryLightness", "41%");
$g.theme.setProperty("secondaryHue", "42");
$g.theme.setProperty("secondarySaturation", "100%");
$g.theme.setProperty("secondaryLightness", "50%");
$g.theme.setProperty("dark-primaryHue", "204");
$g.theme.setProperty("dark-primarySaturation", "83%");
$g.theme.setProperty("dark-primaryLightness", "41%");
$g.theme.setProperty("dark-secondaryHue", "42");
$g.theme.setProperty("dark-secondarySaturation", "100%");
$g.theme.setProperty("dark-secondaryLightness", "50%");

$g.theme.setProperty("fontMain", `"Work Sans", system-ui, sans-serif`);
$g.theme.setProperty("fontHeadings", `"Rubik", system-ui, sans-serif`);

astronaut.render(root);

access.checkUrl();
admin.checkUrl();