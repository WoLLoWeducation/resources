import * as astronaut from "https://opensource.liveg.tech/Adapt-UI/astronaut/astronaut.js";

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

export function openLessons(unit) {
    if (currentLessonViewScreen != null) {
        currentLessonViewScreen.remove();
    }

    currentLessonViewScreen = lessonsView.LessonsViewScreen({unit}) ();

    root.add(currentLessonViewScreen);

    currentLessonViewScreen.screenForward();
}

astronaut.render(root);