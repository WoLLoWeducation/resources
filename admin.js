import * as $g from "./lib/adaptui/src/adaptui.js";
import * as astronaut from "./lib/adaptui/astronaut/astronaut.js";

import * as main from "./script.js";
import * as lessonsView from "./lessonsview.js";

var currentLoadingDialog = null;

var uploadUnitId = null;
var uploadCategory = null;
var uploadLessonId = null;
var uploadResourceType = null;

function fileToBase64(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader;

        reader.addEventListener("load", function() {
            resolve(reader.result.split(",")[1]);
        });

        reader.addEventListener("error", function(event) {
            reject(event);
        });

        reader.readAsDataURL(file);
    });
}

export function getAccessToken() {
    return localStorage.getItem("wollow_accessToken");
}

export function getGithubHeaders() {
    return {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${getAccessToken()}`
    }
}

export var LoadingDialog = astronaut.component("LoadingDialog", function(props, children) {
    return Dialog({
        styles: {
            "max-width": "500px"
        }
    }) (
        Heading() (props.title),
        Paragraph() (props.description),
        DialogContent (
            ElementNode("progress") ()
        ),
        ButtonRow({
            attributes: {
                "aui-mode": "end"
            }
        }) (
            Button({
                attributes: {
                    "aui-bind": "close"
                }
            }) ("Dismiss")
        )
    );
});

export var AddResourceDialog = astronaut.component("AddResourceDialog", function(props, children) {
    var resourceTypeInput = SelectionInput (
        ...Object.keys(lessonsView.RESOURCE_TYPE_NAMES).map((key) => SelectionInputOption(key) (Text(lessonsView.RESOURCE_TYPE_NAMES[key])))
    );

    var addResourceButton = Button() ("Add");

    var dialog = Dialog({
        styles: {
            "max-width": "500px"
        }
    }) (
        Heading() ("Add a new resource"),
        DialogContent (
            Paragraph() ("You can only have one resource of each resource type per lesson."),
            Label (
                Text("Resource type"),
                resourceTypeInput
            )
        ),
        ButtonRow({
            attributes: {
                "aui-mode": "end"
            }
        }) (
            addResourceButton,
            Button({
                mode: "secondary",
                attributes: {
                    "aui-bind": "close"
                }
            }) ("Cancel")
        )
    );

    addResourceButton.on("click", function() {
        uploadResourceToUpdate(props.unitId, props.category, props.lessonId, resourceTypeInput.getValue());

        dialog.dialogClose().then(function() {
            dialog.remove();
        });
    });

    return dialog;
});

export function openLoadingDialog(title = "Loading...", description = "") {
    if (currentLoadingDialog != null) {
        currentLoadingDialog.remove();
    }

    currentLoadingDialog = LoadingDialog({title, description}) ();

    main.root.add(currentLoadingDialog);

    currentLoadingDialog.dialogOpen();

    return currentLoadingDialog;
}

export function closeLoadingDialog(dialog = currentLoadingDialog) {
    dialog.dialogClose().then(function() {
        dialog.remove();

        if (dialog == currentLoadingDialog) {
            currentLoadingDialog = null;
        }
    });
}

export function openAddResourceDialog(uploadUnitId, uploadCategory, uploadLessonId) {
    var dialog = AddResourceDialog({
        unitId: uploadUnitId,
        category: uploadCategory,
        lessonId: uploadLessonId
    }) ();

    main.root.add(dialog);

    dialog.dialogOpen();
}

export function checkUrl() {
    if ($g.core.parameter("admintoken") != null) {
        localStorage.setItem("wollow_accessToken", $g.core.parameter("admintoken"));
        $g.sel("body").emit("unlock");
    }
}

export function waitForBuildSuccess() {
    var dialog = openLoadingDialog("Publishing changes...", "This can take a few minutes. You may dismiss this and carry on making other changes while this process runs in the background.");

    function check() {
        fetch("https://api.github.com/repos/WoLLoWeducation/resources/actions/runs", {cache: "no-store"}).then(function(response) {
            return response.json();
        }).then(function(data) {
            var hasOngoingBuilds = false;
            
            data?.workflow_runs?.forEach(function(run) {
                if (run?.status == "queued" || run?.status == "pending" || run?.status == "in_progress") {
                    hasOngoingBuilds = true;
                }
            });

            if (hasOngoingBuilds) {
                setTimeout(function() {
                    check();
                }, 5_000);
            } else {
                closeLoadingDialog(dialog);
            }
        })
    }

    setTimeout(function() {
        check();
    }, 5_000);
}

export function updateResourceList(modifierFunction) {
    var currentSha;
    var newData;

    return fetch("resources.json", {cache: "no-store"}).then(function(response) {
        return response.json();
    }).then(function(data) {
        return modifierFunction(data);
    }).then(function(data) {
        newData = data;

        return fetch(`https://api.github.com/repos/WoLLoWeducation/resources/contents/resources.json`);
    }).then(function(response) {
        return response.json();
    }).then(function(data) {
        currentSha = data.sha;

        return fetch(`https://api.github.com/repos/WoLLoWeducation/resources/contents/resources.json`, {
            method: "PUT",
            headers: getGithubHeaders(),
            body: JSON.stringify({
                message: "Update resources list",
                content: btoa(JSON.stringify(newData, null, 4)),
                sha: currentSha
            })
        });
    });
}

export function updateResource(unitId, category, lessonId, resourceType, resourceData, newResourceFilename = null) {
    var resources;
    var filePath;
    var createResource = false;
    var currentResourceSha = null;

    openLoadingDialog("Updating resource on site...");

    return fetch("resources.json", {cache: "no-store"}).then(function(response) {
        return response.json();
    }).then(function(data) {
        resources = data;

        filePath = resources
            ?.units
            ?.find((unit) => unit.id == unitId && unit.category == category)
            ?.lessons
            ?.find((lesson) => lesson.id == lessonId)
            ?.resources
            ?.[resourceType]
        ;

        if (!filePath) {
            var categoryPath = resources?.categoryPaths?.[category];

            if (!categoryPath) {
                return Promise.reject(`Tried to create a resource for unit ID \`${unitId}\` and lesson ID \`${lessonId}\` but the unit category's resource path (for category ID \`${category}\`) is unknown`);
            }

            if (!newResourceFilename) {
                return Promise.reject(`Tried to create a resource for unit ID \`${unitId}\` and lesson ID \`${lessonId}\` but no filename for the new resource was chosen`);
            }

            filePath = `${categoryPath}/${newResourceFilename}`;
            createResource = true;
        }

        if (createResource) {
            return Promise.resolve();
        }

        return fetch(`https://api.github.com/repos/WoLLoWeducation/resources/contents/${filePath}`).then(function(response) {
            return response.json();
        }).then(function(data) {
            currentResourceSha = data.sha;

            return Promise.resolve();
        });
    }).then(function() {
        return fetch(`https://api.github.com/repos/WoLLoWeducation/resources/contents/${filePath}`, {
            method: "PUT",
            headers: getGithubHeaders(),
            body: JSON.stringify({
                message: `Update resource for unit ID \`${unitId}\`, category \`${category}\` and lesson ID \`${lessonId}\``,
                content: resourceData,
                sha: !createResource ? currentResourceSha : undefined
            })
        });
    }).then(function() {
        if (!createResource) {
            return Promise.resolve();
        }

        openLoadingDialog("Updating list of resources...");

        return updateResourceList(function(data) {
            var lesson = data
                ?.units
                ?.find((unit) => unit.id == unitId && unit.category == category)
                ?.lessons
                ?.find((lesson) => lesson.id == lessonId)
            ;

            lesson.resources ||= {};
            lesson.resources[resourceType] = filePath;

            return Promise.resolve(data);
        });
    }).then(function() {
        waitForBuildSuccess();
    });
}

export function uploadResourceToUpdate(unitId, category, lessonId, resourceType) {
    uploadUnitId = unitId;
    uploadCategory = category;
    uploadLessonId = lessonId;
    uploadResourceType = resourceType;

    main.fileUploadInput.get().click();
}

$g.waitForLoad().then(function() {
    main.fileUploadInput.on("change", function() {
        if (uploadUnitId != null) {
            fileToBase64(main.fileUploadInput.get().files[0]).then(function(resourceData) {
                console.log(resourceData);
                var extensionParts = main.fileUploadInput.get().files[0].name.split(".");
                var extension = extensionParts[extensionParts.length - 1];

                updateResource(uploadUnitId, uploadCategory, uploadLessonId, uploadResourceType, resourceData, `rename-me-${$g.core.generateKey()}.${extension}`);                

                uploadUnitId = null;
                uploadCategory = null;
                uploadLessonId = null;
                uploadResourceType = null;

                main.fileUploadInput.setValue(null);
            });
        }
    });
});