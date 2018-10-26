(function() {
    var languagePack = {
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

        // tools
        "save": "Speichern",
        "load": "Laden",

        // functions
        "name": "Name",

        // context menu
        "delete": "Löschen",
        "documentation": "Dokumentation",
        "documentationPrompt": "Bitte gib die Dokumentation ein",

        // configurationsDialog
        "simulationDelay": "Simulationsverzögerung [ms]:",
        "skipLoopChecks": "Iterationsüberprüfungen überspringen:",
        "hideAddressColumn": "Adressenspalte verstecken:",
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
        "result": "resultat",
        "return2": "zurück"   // for languages where the verb return is divided into two parts (like in German "gib ... zurück")
    };

    $.extend(window.blockDiagramEditorGlobals, {
        languagePack: languagePack
    });
})();