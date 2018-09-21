/// <reference path="../frameworks/jquery-ui-1.11.4/external/jquery/jquery.js" />
/// <reference path="../frameworks/jquery-ui-1.11.4/jquery-ui.js" />
/// <reference path="../frameworks/jquery-ui-1.11.4/jquery-ui.js" />
/// <reference path="diagramControls.js" />

"use strict";


function initializeApplication(applicationContainer, mainStatementsContainer) {
    Statement.applicationContainer = applicationContainer;
    Statement.functionContainers = new Array();

    Statement.functionContainers.push(mainStatementsContainer);
}

function initializeDiagram(diagramContainer) {
    var statements = $(Statements.htmlSkeleton).appendTo($(diagramContainer));

    statements.data("codebehindObject", new Statements(statements, Statement.useGiven, statements));
}


// ---------- Util for functions (in diagram)

function FunctionPropertyHolder() {
    var _name = "function";
    var _parameters = new Array();
    var _returnType = "void";

    this.getName = function() {
        return _name;
    };
   /* 
    this.setName = function(name) {
        var successful = false;

        if (FunctionPropertyHolder.names.findIndex(name) == -1) {
            if (_name == null) {
                FunctionPropertyHolder.names.push(name);
            }
            else {
                FunctionPropertyHolder.names.splice(FunctionPropertyHolder.names.indexOf(_name), 1, name);
            }

            successful = true;
            _name = name;
        }

        return successful;
    };*/

    this.setName = function (name) {
        _name = name;

        Statement.applicationContainer.find(".functionCallStatement").each(function (index, functionCallStatement) {
            $(functionCallStatement).data("codebehindObject").prepareFunctionField();
        });

        this.onUpdateName();
    };

    this.addParameter = function (parameter) {
        _parameters.push(parameter);
    };

    this.removeParameter = function (parameter) {
        var positionToRemove = _parameters.indexOf(parameter);

        _parameters.splice(positionToRemove, 1);
    };

    this.getParameters = function () {
        return _parameters;
    };

    this.getReturnType = function () {
        return _returnType;
    };

    this.setReturnType = function (returnType) {
        _returnType = returnType;
    };

    this.onUpdateName = function () { };

    FunctionPropertyHolder.functions.push(this);
}
FunctionPropertyHolder.functions = new Array();
FunctionPropertyHolder.functionNameCounter = 1;

FunctionPropertyHolder.getByName = function (name) {
    var fn = null;

    this.functions.some(function (func) {
        if (func.getName() == name) {
            fn = func;

            return true;
        }
        
        return false;
    });

    return fn;
};

function FunctionParameter(functionPropertyHolder) {
    var _name;
    var _type;
    var _onlyIn = true;
    var _documentation;
    var _functionPropertyHolder = functionPropertyHolder;
    /*
    this.setName = function (name) {
        var successful = true;

        _functionPropertyHolder.getParameters().forEach(function (parameter) {
            if (parameter.getName() == name) {
                successful = false;
            }

            return successful;
        });

        if (successful) {
            _name = name;
        }
        
        return successful;
    };*/

    this.setName = function (name) {
        _name = name;
    };

    this.getName = function () {
        return _name;
    };

    this.setType = function (type) {
        _type = type;
    };

    this.getType = function () {
        return _type;
    };

    this.getOnlyIn = function () {
        return _onlyIn;
    };

    this.setOnlyIn = function (onlyIn) {
        _onlyIn = onlyIn;
    };

    this.getDocumentation = function () {
        return _documentation;
    };

    this.setDocumentation = function (documentation) {
        _documentation = documentation;
    };

    this.getFunctionPropertyHolder = function () {
        return _functionPropertyHolder;
    };

    functionPropertyHolder.addParameter(this);
}


function getFunctionSkeleton(onResultStatementsChanged) {
    var functionPropertyHolder = new FunctionPropertyHolder();
    var functionSkeleton = $("<div></div>").data("codebehindObject", functionPropertyHolder);

    $('<button>Out</button>').appendTo(functionSkeleton).button({
        disabled: true,
        icons: {
            primary: "ui-icon-arrowthick-1-n"
        },
        text: false
    });

    functionSkeleton.append('<input value="void" onchange="$(this).parent().data(\'codebehindObject\').setReturnType(this.value);" />');
    functionSkeleton.find("input").autocomplete({
        autoFocus: true,
        source: ["void", languagePack["string"], languagePack["integer"]],
        delay: 0,
        minLength: 0,
        select: function (event, ui) {
            event.target.value = ui.item.value; // update textfield (else it gets updated after the event -> triggering "update" changes nothing)
            $(event.target).trigger("change");
            $.tabNext();
        }
    });
    functionSkeleton.find("input").first().change(function () {
        var returnType = this.value;

        if (returnType == languagePack["integer"] || returnType == languagePack["integer"] + "[]" || returnType == languagePack["string"] || returnType == languagePack["string"] + "[]") {
            var firstStatement = functionSkeleton.children(".statements").children().first();

            if ($(firstStatement.find("input")[0]).prop("disabled") == true) {  // it's an auto-generated result-declaration
                functionSkeleton.children(".statements").data("codebehindObject").remove(firstStatement);
            }

            functionSkeleton.children(".statements").data("codebehindObject").prepend(DeclarationStatement);

            var declarationOfReturn = functionSkeleton.children(".statements").children().first();

            $(declarationOfReturn.find("input")[0]).prop("value", returnType);
            $(declarationOfReturn.find("input")[0]).trigger("change");
            $(declarationOfReturn.find("input")[0]).prop("disabled", true);
            $(declarationOfReturn.find("input")[1]).prop("value", languagePack.result);
            $(declarationOfReturn.find("input")[1]).trigger("change");
            $(declarationOfReturn.find("input")[1]).prop("disabled", true);
            $(declarationOfReturn.find("input")[2]).addClass("resultInitializationValue");
            $(declarationOfReturn).addClass("functionResultDeclaration");

            functionSkeleton.find(".visibleIfNotVoid").css("display", "block");

            onResultStatementsChanged(functionSkeleton.children(".statements"), true, false);
        }
        else if (returnType == "void") {
            var firstStatement = functionSkeleton.children(".statements").children().first();

            if ($(firstStatement.find("input")[0]).prop("disabled") == true) {  // it's an auto-generated result-declaration
                functionSkeleton.children(".statements").data("codebehindObject").remove(firstStatement);
                functionSkeleton.find(".visibleIfNotVoid").css("display", "none");

                onResultStatementsChanged(functionSkeleton.children(".statements"), false, true);
            }
        }
        else {
            this.value = "void";
            $(this).trigger("change");
        }
    });

    functionSkeleton.append('<input onchange="$(this).parent().data(\'codebehindObject\').setName(this.value);" type="text" value="' + languagePack.subprogram + (FunctionPropertyHolder.functionNameCounter === 1 ? '' : FunctionPropertyHolder.functionNameCounter) + '"></input>');
    FunctionPropertyHolder.functionNameCounter++;

    functionSkeleton.find("input").autoGrowInput({
        minWidth: 20,
        comfortZone: 3
    });

    functionSkeleton.append('<br /><div class="parameters"></div>');

    $('<button onclick="addParameter($(this).prev(), $(this).parent().data(\'codebehindObject\'));">' + languagePack.addParameter + '</button>').appendTo(functionSkeleton).button({
        icons: {
            primary: "ui-icon-plusthick"
        },
        text: false
    });

    initializeDiagram(functionSkeleton);
    Statement.functionContainers.push(functionSkeleton.find(".statements"));

    functionSkeleton.append('<div class="visibleIfNotVoid"><span>' + languagePack.return1 + ' ' + languagePack.result + ' ' + languagePack.return2 + '</span></div>');

    functionSkeleton.find(".visibleIfNotVoid").css("display", "none");

    return functionSkeleton;
}

function addParameter(container, functionPropertyHolder) {
    var typeInput = '<input type="text" onchange="$(this).closest(\'.parameter\').data(\'codebehindObject\').setType(this.value);"></input>';
    var nameInput = '<input type="text" onchange="$(this).closest(\'.parameter\').data(\'codebehindObject\').setName(this.value);"></input>';
    var callByButton = '<button>In</button>';

    container.append("<div class='parameter'></div>");

    var parameter = container.children().last();

    parameter.append(callByButton).append(typeInput).append("<span>:</span>").append(nameInput).append("<span></span>").data("codebehindObject", new FunctionParameter(functionPropertyHolder));

    parameter.find("input[type='text']").autoGrowInput({
        minWidth: 30,
        comfortZone: 3
    });

    parameter.find("input[type='text']").first().autocomplete({
        autoFocus: true,
        source: [languagePack["string"], languagePack["integer"], languagePack["string"] + "[]", languagePack["integer"] + "[]"],
        delay: 0,
        minLength: 0,
        select: function (event, ui) {
            event.target.value = ui.item.value; // update textfield (else it gets updated after the event -> triggering "change" changes nothing)
            $(event.target).trigger("change");
            $.tabNext();
        }
    });

    parameter.find("button").button({
        text: false,
        icons: {
            primary: "ui-icon-arrowthick-1-s"
        }
    }).click(function () {
        var options;
        if ($(this).text() === "In") {
            options = {
                label: "InOut",
                icons: {
                    primary: "ui-icon-arrowthick-2-n-s"
                }
            };

            $(this).closest(".parameter").data("codebehindObject").setOnlyIn(false);
        } else {
            options = {
                label: "In",
                icons: {
                    primary: "ui-icon-arrowthick-1-s"
                }
            };

            $(this).closest(".parameter").data("codebehindObject").setOnlyIn(true);
        }

        $(this).button("option", options);
    });

    parameter.find("input").first().change(function () {
        var callByButton = parameter.find("button");
        var options;

        if (this.value.charAt(this.value.length - 1) == "]") {  // array-parameter -> only by reference
            options = {
                label: "InOut",
                disabled: true,
                icons: {
                    primary: "ui-icon-arrowthick-2-n-s"
                }
            };

            callByButton.button("option", options);

            parameter.data("codebehindObject").setOnlyIn(false);
        }
        else {
            callByButton.button("option", "disabled", false);
        }
    });
}


