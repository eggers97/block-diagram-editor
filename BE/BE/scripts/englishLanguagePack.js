(function() {
    var languagePack = {
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
        "statementCommentPrompt": "Please input the comment",
        "statementComment": "comment",

        // configurationsDialog
        "simulationDelay": "Simulation delay [ms]:",
        "skipLoopChecks": "Skip loop checks:",
        "hideAddressColumn": "Hide address column:",
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
        "result": "result",
        "return2": ""   // for languages where the verb return is divided into two parts (like in German "gib ... zurück")
    };

    $.extend(window.blockDiagramEditorGlobals, {
        languagePack: languagePack
    });
})();