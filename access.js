import * as $g from "./lib/adaptui/src/adaptui.js";
import * as astronaut from "./lib/adaptui/astronaut/astronaut.js";

const ACCESS_PASSWORD_BASE64 = "ODc1MzM2MTA="; // Only a soft security measure

export function isGranted() {
    return localStorage.getItem("wollow_password") == atob(ACCESS_PASSWORD_BASE64);
}

export var previouslyUnlocked = isGranted();

export var PasswordEntryDialog = astronaut.component("PasswordEntryDialog", function(props, children) {
    var passwordInput = Input({type: "password", placeholder: "Enter password"}) ();
    var confirmationButton = Button() ("OK");
    var errorMessage = Paragraph() ();

    var dialog = Dialog({
        styles: {
            "max-width": "20vw"
        }
    }) (
        Heading() ("Enter password to access resources"),
        DialogContent (
            Paragraph() ("You will have received the password from a confirmation email from us after your request has been approved."),
            passwordInput,
            errorMessage
        ),
        ButtonRow({
            attributes: {
                "aui-mode": "end"
            }
        }) (
            confirmationButton,
            Button({
                mode: "secondary",
                attributes: {
                    "aui-bind": "close"
                }
            }) ("Cancel")
        )
    );

    function checkPassword() {
        if (passwordInput.getValue() == "") {
            errorMessage.setText("Please enter the password.");

            return;
        }

        localStorage.setItem("wollow_password", passwordInput.getValue());

        if (isGranted()) {
            dialog.dialogClose();

            setTimeout(function() {
                showUnlockConfirmationDialog();
            });

            $g.sel("body").emit("unlock");
        } else {
            errorMessage.setText("The password you entered is incorrect. Try again or contact us for help.");
        }
    }

    passwordInput.on("keydown", function(event) {
        if (event.key == "Enter") {
            checkPassword();
        }
    });

    confirmationButton.on("click", function() {
        checkPassword();
    });

    return dialog;
});

export var passwordEntryDialog = null;
export var unlockConfirmationDialog = null;

export function showUnlockConfirmationDialog() {
    if (previouslyUnlocked) {
        return;
    }

    if ($g.core.parameter("old")) {
        return;
    }

    unlockConfirmationDialog.dialogOpen();
}

export function init() {
    passwordEntryDialog = PasswordEntryDialog() ();
    
    unlockConfirmationDialog = Dialog({
        styles: {
            "max-width": "20vw"
        }
    }) (
        Heading() ("Resources unlocked"),
        DialogContent (
            Paragraph() ("All resources have now been unlocked for you to access. Thank you for supporting WoLLoW!")
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
            }) ("OK")
        )
    );
}

export function checkUrl() {
    if ($g.core.parameter("password") != null) {
        localStorage.setItem("wollow_password", $g.core.parameter("password"));
        $g.sel("body").emit("unlock");
    
        $g.waitForLoad().then(function() {
            showUnlockConfirmationDialog();
        });
    }
}