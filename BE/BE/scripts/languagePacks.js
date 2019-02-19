(function() {
    var languagePacks = {
        "en-GB": {
            // if
            "if": "IF",
            "then": "THEN",
            "else": "ELSE",

            // for
            "for": "FOR",
            "from": "FOR",
            "to": "TO",
            "step": "BY",

            // while
            "while": "WHILE",

            // do while
            "do while": "UNTIL",
            "repeat": "RP",
            "until": "UNTIL",

            // switch
            "switch": "SWITCH",
            "case": "CASE",
            // "else": "ELSE",      -> already in if

            // declaration
            "declaration": "DECLARATION",
            "string": "Text",
            "integer": "Number",

            // assignment
            "assignment": "ASSIGNMENT",

            // function call
            "call": "CALL",

            // input
            "input": "INPUT",

            // output
            "output": "OUTPUT",

            // comment
            "comment": "COMMENT",

            // functions
            "name": "Name",

            // context menu
            "delete": "delete",
            "copy": "copy",
            "paste": "paste",
            "documentation": "documentation",
            "documentationPrompt": "Please input the documentation",
            "statementComment": "comment",
            "statementCommentPrompt": "Please input the comment",

            // configurationsDialog
            "simulationDelay": "Simulation delay [ms]:",
            "skipLoopChecks": "Skip loop checks:",
            "hideAddressColumn": "Hide address column:",
            "language": "Language:",
            "languages": {
                "en-GB": "English",
                "de-DE": "German"
            },
            "ok": "Ok",
            "cancel": "Cancel",

            // loadDialog
            "loadDialogQuestion": "Do you want to load the whole diagram or just the subprograms?",
            "loadDialogWarning": "Warning: Loading the whole diagram replaces the current!",
            "wholeDiagram": "Open whole diagram",
            "onlySubprograms": "Open only subprograms",

            // tools
            "save": "Save",
            "load": "Load",
            "generateCCode": "Generate C code",
            "play": "Play",
            "stop": "Stop",
            "finish": "Leave edit mode",
            "unfinish": "Activate edit mode",
            "configurations": "Configurations",
            "help": "Help",

            // simulation
            "variable": "Variable",
            "value": "Value",
            "function": "Function",
            "address": "Address",

            // functions
            "subprogram": "subprogram",
            "addParameter": "Add parameter",
            "return1": "return",
            "return2": "",   // for languages where the verb return is divided into two parts (like in German "gib ... zurück")
            "result": "result"
        },

        "de-DE": {
            // if
            "if": "WENN",
            "then": "DANN",
            "else": "SONST",

            // for
            "for": "ZÄHLE",
            "from": "VON",
            "to": "BIS",
            "step": "MIT",

            // while
            "while": "SOLANGE",

            // do while
            "do while": "BIS",
            "repeat": "WH",
            "until": "BIS",

            // switch
            "switch": "FALLS",
            "case": "FALL",
            // "else": "ELSE",

            // declaration
            "declaration": "DEKLARATION",
            "string": "Text",
            "integer": "Zahl",

            // assignment
            "assignment": "ZUWEISUNG",

            // function call
            "call": "AUFRUF",

            // input
            "input": "EINGABE",

            // output
            "output": "AUSGABE",

            // comment
            "comment": "KOMMENTAR",

            // functions
            "name": "Name",

            // context menu
            "delete": "Löschen",
            "copy": "Kopieren",
            "paste": "Einfügen",
            "documentation": "Dokumentation",
            "documentationPrompt": "Bitte gib die Dokumentation ein",
            "statementComment": "Kommentar",
            "statementCommentPrompt": "Bitte gib den Kommentar ein",

            // configurationsDialog
            "simulationDelay": "Simulationsverzögerung [ms]:",
            "skipLoopChecks": "Iterationsüberprüfungen überspringen:",
            "hideAddressColumn": "Adressenspalte verstecken:",
            "language": "Sprache:",
            "languages": {
                "en-GB": "Englisch",
                "de-DE": "Deutsch"
            },
            "ok": "Ok",
            "cancel": "Abbrechen",

            // loadDialog
            "loadDialogQuestion": "Möchtest du das ganze Blockbild oder nur die Unterprogramme laden?",
            "loadDialogWarning": "Warnung: Das Laden des gesamten Blockbilds ersetzt das aktuelle!",
            "wholeDiagram": "Gesamtes Blockbild laden",
            "onlySubprograms": "Nur die Unterprogramme laden",

            // tools
            "save": "Speichern",
            "load": "Laden",
            "generateCCode": "Generiere C-Code",
            "play": "Abspielen",
            "stop": "Stopp",
            "finish": "Bearbeitungsmodus verlassen",
            "unfinish": "Bearbeitungsmodus aktivieren",
            "configurations": "Konfigurationen",
            "help": "Hilfe",

            // simulation
            "variable": "Variable",
            "value": "Wert",
            "function": "Funktion",
            "address": "Adresse",

            // functions
            "subprogram": "unterprogramm",
            "addParameter": "Parameter hinzufügen",
            "return1": "gib",
            "return2": "zurück",   // for languages where the verb return is divided into two parts (like in German "gib ... zurück")
            "result": "resultat"
        }
    };

    $.extend(window.blockDiagramEditorGlobals, {
        languagePacks: languagePacks,
        languagePack: languagePacks["en-GB"]
    });
})();