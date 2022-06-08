import * as $g from "./lib/adaptui/src/adaptui.js";
import * as astronaut from "./lib/adaptui/astronaut/astronaut.js";

import * as unitsView from "./unitsview.js";
import * as lessonsView from "./lessonsview.js";

astronaut.unpack();

var unitsViewScreen = unitsView.UnitsViewScreen({showing: true}) ();
var currentLessonViewScreen = null;

var root = Container() (
    unitsViewScreen
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

$g.theme.setProperty("fontMain", `"Work Sans", system-ui, sans-serif`);
$g.theme.setProperty("fontHeadings", `"Rubik", system-ui, sans-serif`);

astronaut.render(root);