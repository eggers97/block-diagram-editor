/// <reference path="../frameworks/jquery-ui-1.11.4/external/jquery/jquery.js" />
/// <reference path="../frameworks/jquery-ui-1.11.4/jquery-ui.js" />
/// <reference path="./diagramControls.js" />

"use strict";


var finishDiagram;
var unfinishDiagram;
var onResultStatementsChanged;

(function() {
    $(document).ready(function () {
        initialize();
    });

function initialize() {
    var statementInsertionPoint = '<div class="statementInsertionPoint"></div>';

    var droppableForIfComponentsParameters = {
        accept: "." + languagePack["else"] + "Component",
        greedy: true,
        tolerance: "pointer",
        hoverClass: "componentsDroppableHovered",
        drop: function (event, ui) {
            droppedOnIfStatement(ui, this, droppableForStatementsParameters);
        }
    };

    var droppableForSwitchComponentsParameters = {
        accept: "." + languagePack["case"] + "Component",
        greedy: true,
        tolerance: "pointer",
        hoverClass: "componentsDroppableHovered",
        drop: function (event, ui) {
            droppedOnSwitchStatement(ui, this, droppableForStatementsParameters);
        }
    };

    var droppableForStatementsParameters = {
        accept: ".statement",
        greedy: true,
        tolerance: "pointer",
        hoverClass: "statementsDroppableHovered",
        drop: function (event, ui) {
            if ($(this).hasClass("statements")) {
                droppedOnStatements(ui, this, droppableForIfComponentsParameters, droppableForSwitchComponentsParameters, droppableForStatementsParameters, statementInsertionPoint);
            }
            else if ($(this).hasClass("statementInsertionPoint")) {
                droppedOnStatementInsertionPoint(ui, this, droppableForIfComponentsParameters, droppableForSwitchComponentsParameters, droppableForStatementsParameters, statementInsertionPoint);
            }
        }
    };

    generateTools();
    generateDraggables();

    $("#tabs").tabs({
        beforeActivate: function (event, ui) {
            if (ui.newTab.text() == "+") {
                addTab(droppableForStatementsParameters);

                return false;
            }

            return true;
        }
    });
    $("#tabs").children().last().remove();

    $("#tabs").delegate("span.ui-icon-close", "click", deleteTab);

    initializeDiagram($("#main"));
    initializeApplication($("#tabs"), $("#main .statements"));
    initializeConfigurations();
    initializeDialogs();
    initializeVisualStackContainer();

    $("#main > .statements").droppable(droppableForStatementsParameters);

    createContextmenus(droppableForStatementsParameters, droppableForIfComponentsParameters, droppableForSwitchComponentsParameters);

    finishDiagram = function () {
        $("#tabs .ui-droppable").droppable("destroy");
        $("#tabs .statementInsertionPoint").remove();
    };

    unfinishDiagram = function () {
        $("#tabs").children("div").each(function (index, diagramFunction) {
            if ($(diagramFunction).find(".statementInsertionPoint").length == 0) {
                $(diagramFunction).find(".statements:empty").droppable(droppableForStatementsParameters);
                $(diagramFunction).find(".switchStatement").droppable(droppableForSwitchComponentsParameters);
                $(diagramFunction).find(".ifStatement").droppable(droppableForIfComponentsParameters);
                $(diagramFunction).find(".statements > *").after(statementInsertionPoint);
                $(diagramFunction).find(".statements:not(:empty)").prepend(statementInsertionPoint);
                $(diagramFunction).find(".functionResultDeclaration").prev().remove();   // remove insertion point before declaration of result
                $(diagramFunction).find(".statementInsertionPoint").droppable(droppableForStatementsParameters);
            }
        });
    };

    onResultStatementsChanged = function (statementsContainer, added, removed) {
        if (added) {
            if (statementsContainer.children().length == 1) {   // result declaration is the only statement
                if (statementsContainer.data("uiDroppable")) {
                    statementsContainer.droppable("destroy");
                }
                   
                statementsContainer.append(statementInsertionPoint);

                statementsContainer.children().last().droppable(droppableForStatementsParameters);
            }
        }
        else if (removed) {
            if (statementsContainer.data("codebehindObject").isEmpty()) {   // result declaration was the only statement
                statementsContainer.empty();    // remove insertionPoints

                statementsContainer.droppable(droppableForStatementsParameters);
            }
        }
    };

    $("#fileChooser").on("change", function () {
        $("#loadDialog").dialog("open");
    });

    $("#visualStackContainer table").styleTable();
}

function initializeVisualStackContainer() {
    var tableHeads = $("#visualStackContainer th");

    $(tableHeads[0]).text(languagePack.variable);
    $(tableHeads[1]).text(languagePack.value);
    $(tableHeads[2]).text(languagePack.function);
}

function deleteTab() {
    var panelId = $(this).closest("li").remove().attr("aria-controls");
    var index;
    var codebehindObject = $("#" + panelId).data("codebehindObject");

    FunctionPropertyHolder.functions.splice(FunctionPropertyHolder.functions.indexOf(codebehindObject), 1);

    Statement.functionContainers.some(function (statements, idx) {
        if (statements.parent().attr("id") == panelId) {
            index = idx;

            return true;
        }

        return false;
    });

    Statement.functionContainers.splice(index, 1);

    $("#" + panelId).remove();
    $("#tabs").tabs("refresh");
    $("#tabs").children("[id^=ui-id-]").remove();
}

function initializeDialogs() {
    var configurationLabels = $("#configurationsDialog label");

    $(configurationLabels[0]).text(languagePack.simulationDelay);
    $(configurationLabels[1]).text(languagePack.skipLoopChecks);
    $(configurationLabels[2]).text(languagePack.hideAddressColumn);

    var buttonsObject = {}; // because the attributes must set through []-Syntax (name of attribute is text of button)

    buttonsObject[languagePack.ok] = function () {
        var configurationRows = $(this).find("tr");

        configurations.simulationDelay = $(configurationRows[0]).find("input")[0].value;    // update simulation delay

        configurations.skipLoopChecks = $(configurationRows[1]).find("input")[0].checked;   // update skip loop checks

        configurations.hideAddressColumn = $(configurationRows[2]).find("input")[0].checked;    // update hide address column
        hideAddressColumnChanged();

        $(this).dialog("close");
    };

    buttonsObject[languagePack.cancel] = function () {
        $(this).dialog("close");
    };

    $("#configurationsDialog").dialog({
        autoOpen: false,
        modal: true,
        buttons: buttonsObject
    });


    var loadDialogTexts = $("#loadDialog p");

    $(loadDialogTexts[0]).text(languagePack.loadDialogQuestion);
    $(loadDialogTexts[1]).text(languagePack.loadDialogWarning);

    buttonsObject = {}; // because the attributes must set through []-Syntax (name of attribute is text of button)

    buttonsObject[languagePack.wholeDiagram] = function () {
        $(this).dialog("close");
        loadSelectedDiagram(true);
    };

    buttonsObject[languagePack.onlySubprograms] = function () {
        $(this).dialog("close");
        loadSelectedDiagram(false);
    };

    $("#loadDialog").dialog({
        autoOpen: false,
        modal: true,
        buttons: buttonsObject
    });
}

function initializeConfigurations() {
    var configurationsContainer;
    var configsOfGroup;

    configurationsContainer = $("#configurationsDialog tbody");

    configsOfGroup = $(configurationsContainer[0]).find("input");
    $(configsOfGroup)[0].value = configurations.simulationDelay;
    $(configsOfGroup)[1].checked = configurations.skipLoopChecks;
}

function openConfigurationsDialog() {
    $("#configurationsDialog").dialog("open");
}

function generateTools() {
    var saveButtonSkeleton = '<button>' + languagePack.save + '</button>';
    var loadButtonSkeleton = '<button>' + languagePack.load + '</button>';
    var generateCCodeButtonSkeleton = '<button>' + languagePack.generateCCode + '</button>';
    var playButtonSkeleton = '<button id="playButton">' + languagePack.play + '</button>';
    var stopButtonSkeleton = '<button>' + languagePack.stop + '</button>';
    var finishDiagramButtonSkeleton = '<button>' + languagePack.finish + '</button>';
    var unfinishDiagramButtonSkeleton = '<button>' + languagePack.unfinish + '</button>';
    var configurationsButtonSkeleton = '<button>' + languagePack.configurations + '</button>';
    var helpButtonSkeleton = '<button>' + languagePack.help + '</button>';
    
    $(loadButtonSkeleton).click(function() {
        $('#fileChooser').trigger('click');
    }).appendTo("#toolsToolbar").button({
        icons: {
            primary: "ui-icon-folder-open"
        },
        text: false
    });

    $(saveButtonSkeleton).click(function() {
        saveDiagram();
    }).appendTo("#toolsToolbar").button({
        icons: {
            primary: "ui-icon-document"
        },
        text: false
    });

    $(generateCCodeButtonSkeleton).click(function() {
        generateCCode();
    }).appendTo("#toolsToolbar").button({
        icons: {
            primary: "ui-icon-script"
        },
        text: false
    });

    $(playButtonSkeleton).click(function() {
        startSimulation();
    }).appendTo("#toolsToolbar").button({
        icons: {
            primary: "ui-icon-play"
        },
        text: false
    });

    $(stopButtonSkeleton).click(function() {
        stopSimulation();
    }).appendTo("#toolsToolbar").button({
        icons: {
            primary: "ui-icon-stop"
        },
        text: false
    });

    $(finishDiagramButtonSkeleton).click(function() {
        finishDiagram();
    }).appendTo("#toolsToolbar").button({
        icons: {
            primary: "ui-icon-locked"
        },
        text: false
    });

    $(unfinishDiagramButtonSkeleton).click(function() {
        unfinishDiagram();
    }).appendTo("#toolsToolbar").button({
        icons: {
            primary: "ui-icon-unlocked"
        },
        text: false
    });

    $(configurationsButtonSkeleton).click(function() {
        openConfigurationsDialog();
    }).appendTo("#toolsToolbar").button({
        icons: {
            primary: "ui-icon-gear"
        },
        text: false
    });

    $(helpButtonSkeleton).click(function() {
        window.open('./help.html');
    }).appendTo("#toolsToolbar").button({
        icons: {
            primary: "ui-icon-help"
        },
        text: false
    });
}

function generateCCode() {
    var generatedCode = "";
    var functionPrototypesCode = "";
    var filename;

    Statement.functionContainers.forEach(function (statement) {
        var functionCode = $(statement).data("codebehindObject").generateCCode();

        if ($(statement).parent().prop("id") != "main") {
            functionPrototypesCode += functionCode.split("{")[0] + ";";
        }
        
        generatedCode += functionCode;
    });
    generatedCode = "#include<stdio.h>\n#define MAX_STRING_SIZE 255\n" + functionPrototypesCode + generatedCode;

    filename = window.prompt("Enter filename:");

    if (filename != undefined) {
        filename += ".c";

        var blob = new Blob([generatedCode], {
            type: "text/x-c;charset=utf-8;"
        });

        saveAs(blob, filename);
    }
}

function saveDiagram() {
    var diagram = new Object();
    var filename;

    diagram.main = $("#main .statements").data("codebehindObject").toSerializableObject();

    Statement.functionContainers.forEach(function (statements, index) {
        if (index > 0) {
            var parameters = new Array();
            var statementsSerialized = $(statements).data("codebehindObject").toSerializableObject();

            $(statements).parent().data("codebehindObject").getParameters().forEach(function (parameter) {
                parameters.push({
                    type: parameter.getType(),
                    name: parameter.getName(),
                    onlyIn: parameter.getOnlyIn(),
                    documentation: parameter.getDocumentation()
                });
            });


            var resultInitializationValue = $(statements).find(".functionResultDeclaration").length > 0 ? $(statements).find(".resultInitializationValue")[0].value : undefined;

            diagram[$(statements).parent().data("codebehindObject").getName()] = {
                "parameters": parameters,
                "statements": statementsSerialized,
                "returnType": $(statements).parent().data("codebehindObject").getReturnType(),
                "resultInitializationValue": resultInitializationValue
            };
        }
    });

    filename = window.prompt("Enter filename:");

    if (filename != undefined) {
        filename += ".bb";

        var blob = new Blob([JSON.stringify(diagram)], {
            type: "text/json;charset=utf-8;"
        });

        saveAs(blob, filename);
    }
}

function loadSelectedDiagram(withMain) {
    var selectedFile = $("#fileChooser")[0].files[0];
    var fileReader = new FileReader();

    fileReader.onload = function () {
        var savedDiagram = JSON.parse(this.result);

        if (!withMain) {
            savedDiagram.main = undefined;
        }
        else {
            FunctionPropertyHolder.functions = new Array();
            
            $("span.ui-icon-close").trigger("click");

            $("#main .statements").remove();

            initializeDiagram($("#main"));
            initializeApplication($("#tabs"), $("#main .statements"));
        }

        parseSerializedDiagram(savedDiagram, $("#main .statements"), function (functionName) {
            $("#tabs").children().first().children().last().before('<li><a href="#' + functionName + '">' + functionName + '</a><span style="float:right" class="ui-icon ui-icon-close" role="presentation">Remove Tab</span></li>');

            return $("#tabs");
        }, function () { });

        $("#tabs").children("div").each(function (index, tab) {
            if ($(tab).prop("id") != "main" && $(tab).data("codebehindObject") != undefined) {
                $(tab).prop("id", $(tab).data("codebehindObject").getName());
                $(tab).data("codebehindObject").onUpdateName = function () {
                    tabTextContainer.text(this.getName());
                    $("#" + idBefore).attr("id", this.getName());
                    $("[href='#" + idBefore + "']").attr("href", "#" + this.getName());
                    idBefore = this.getName();
                    $("#tabs").tabs("refresh");
                    $("#tabs").children("[id^=ui-id-]").remove();
                };
            }
        });

        $("#tabs").tabs("refresh");
        $("#tabs").children("[id^=ui-id-]").remove();

        $("#tabs .ui-droppable").droppable("destroy");
        
        unfinishDiagram();
    };

    fileReader.readAsText(selectedFile);
}

function startSimulation() {
    var delay = configurations.simulationDelay;

    simulateDiagram(delay, $("#visualStackContainer"), function (functionName) {
        $("#tabs").tabs("refresh");
        $("#tabs").children("[id^=ui-id-]").remove();
        $("#tabs").tabs("option", "active", $("#" + functionName).parent().find($("#" + functionName)).index() - 1);
    }, function () {
        $("#playButton").off();
        $("#playButton").click(function() {
            resumeSimulation();
        });
        $("#playButton").button("option", {
            icons: {
                primary: "ui-icon-play"
            },
            text: false
        });
    }, function () {
        $("#playButton").off();
        $("#playButton").click(function() {
            pauseSimulation();
        });
        $("#playButton").button("option", {
            icons: {
                primary: "ui-icon-pause"
            },
            text: false
        });
    }, function () {
        $("#playButton").off();
        $("#playButton").click(function() {
            startSimulation();
        });
        $("#playButton").button("option", {
            icons: {
                primary: "ui-icon-play"
            },
            text: false
        });
    }, function () {
        $("#playButton").off();
        $("#playButton").click(function() {
            startSimulation();
        });
        $("#playButton").button("option", {
            icons: {
                primary: "ui-icon-play"
            },
            text: false
        });
    });

    $("#playButton").off();
    $("#playButton").click(function() {
        pauseSimulation();
    });
    $("#playButton").button("option", {
        icons: {
            primary: "ui-icon-pause"
        },
        text: false
    });
}

function addTab(droppableForStatementsParameters) {
    var functionSkeleton = $(getFunctionSkeleton(onResultStatementsChanged));
    var functionPropertyHolder = functionSkeleton.data("codebehindObject");
    
    functionSkeleton.appendTo("#tabs"); 
    functionSkeleton.find("input").trigger("change");
    functionSkeleton.attr("id", functionPropertyHolder.getName());

    $("#tabs").children().first().children().last().before('<li><a href="#' + functionPropertyHolder.getName() + '">' + functionPropertyHolder.getName() + '</a><span style="float:right" class="ui-icon ui-icon-close" role="presentation">Remove Tab</span></li>');
    $("#tabs").tabs("refresh");
    $("#tabs").children("[id^=ui-id-]").remove();

    var idBefore = functionPropertyHolder.getName();
    var tabTextContainer = $("#tabs").children().first().children().last().prev().children();
    functionSkeleton.data("codebehindObject").onUpdateName = function () {
        tabTextContainer.text(this.getName());
        $("#" + idBefore).attr("id", this.getName());
        $("[href='#" + idBefore + "']").attr("href", "#" + this.getName());
        idBefore = this.getName();
        $("#tabs").tabs("refresh");
        $("#tabs").children("[id^=ui-id-]").remove();
    };

    functionSkeleton.find(".statements").droppable(droppableForStatementsParameters);

    functionSkeleton.next().remove();
}

function generateDraggables() {
    var draggables = [{
        name: languagePack["declaration"],
        statement: true
    }, {
        name: languagePack["input"],
        statement: true
    }, {
        name: languagePack["output"],
        statement: true
    }, {
        name: languagePack["assignment"],
        statement: true
    }, {
        name: languagePack["if"],
        statement: true
    }, {
        name: languagePack["else"],
        statement: false
    }, {
        name: languagePack["while"],
        statement: true
    }, {
        name: languagePack["for"],
        statement: true
    }, {
        name: languagePack["until"],
        statement: true
    }, {
        name: languagePack["switch"],
        statement: true
    }, {
        name: languagePack["case"],
        statement: false
    }, {
        name: languagePack["call"],
        statement: true
    }, {
        name: languagePack["comment"],
        statement: true
    }];

    draggables.forEach(function (draggable) {
        var htmlSkeleton = draggable.statement ? '<button class="statement"></button>' : '<button class="' + draggable.name + 'Component"></button>';
        
        $(htmlSkeleton).appendTo("#statementsToolbar").button({
            label: draggable.name
        }).draggable({
            cancel: false,
            revert: "invalid",
            helper: "clone",
            zIndex: 5
        });
    });
}

function createContextmenus(droppableForStatementsParameters, droppableForIfComponentsParameters, droppableForSwitchComponentsParameters) {
    var ifComponentSelector = ".ifStatement > table > tbody > tr:nth-child(3)";
    var switchComponentsSelector = ".switchStatement > table > tbody > tr";
    var declarationStatementSelector = ".declarationStatement";
    var otherStatementsSelector = ".ifStatement, .whileStatement, .doWhileStatement, .forStatement, .switchStatement, .assignmentStatement, .inputStatement, .outputStatement, .functionCallStatement, .commentStatement";
    var parametersSelector = ".parameter";

    $("#tabs").contextmenu({
        delegate: otherStatementsSelector + ", " + declarationStatementSelector + ", " + switchComponentsSelector + ", " + ifComponentSelector + ", " + parametersSelector,

        menu: [{
            title: languagePack["delete"],
            action: function (event, ui) {
                var closestElement = $(ui.target).closest(otherStatementsSelector + ", " + declarationStatementSelector + ", " + switchComponentsSelector + ", " + ifComponentSelector + ", " + parametersSelector);

                if (closestElement.is(otherStatementsSelector + ", " + declarationStatementSelector)) {
                    var statements = closestElement.closest(".statements");
                    
                    statements.data("codebehindObject").remove(closestElement);

                    if (statements.data("codebehindObject").isEmpty()) {
                        statements.empty();

                        statements.droppable(droppableForStatementsParameters);
                    }
                    else {
                        $(".statementInsertionPoint + .statementInsertionPoint").remove();
                    }
                }
                else if (closestElement.is(switchComponentsSelector)) {
                    var parent = $(ui.target).closest("tr").parent().prop("tagName");
                    
                    if (parent == "TFOOT") {
                        $(ui.target).closest("tr").remove();
                    }
                    else if (parent == "TBODY") {
                        $(ui.target).closest("tr").remove();
                    }
                    else {
                        console.warn("tagname not possible in this case");
                    }
                }
                else if (closestElement.is(ifComponentSelector)) {
                    var ifStatement = $(ui.target).closest(".ifStatement");
                    
                    ifStatement.data("codebehindObject").removeElseBlock();
                    ifStatement.droppable(droppableForIfComponentsParameters);
                }
                else if (closestElement.is(parametersSelector)) {
                    var parameter = closestElement.data("codebehindObject");
                    
                    parameter.getFunctionPropertyHolder().removeParameter(parameter);
                    closestElement.remove();
                }

                event.stopPropagation();
            }
        }, {
            title: languagePack["documentation"],
            cmd: "documentation",
            action: function (event, ui) {
                var documentation = window.prompt(languagePack["documentationPrompt"], "");
                var closestElement = $(ui.target).closest(declarationStatementSelector + ", " + parametersSelector);

                if (closestElement.is(declarationStatementSelector)) {
                    $(ui.target).closest(declarationStatementSelector).data("codebehindObject").addDocumentation(documentation);
                }
                else {
                    $(ui.target).closest(parametersSelector).data("codebehindObject").setDocumentation(documentation);

                    if (documentation) {
                        $(ui.target).closest(parametersSelector).children().last().text(" // " + documentation);
                    }
                    else {
                        $(ui.target).closest(parametersSelector).children().last().empty();
                    }
                }
            }
        }],

        beforeOpen: function (event, ui) {
            var closestElement = $(ui.target).closest(otherStatementsSelector + ", " + declarationStatementSelector + ", " + switchComponentsSelector + ", " + ifComponentSelector + ", " + parametersSelector);
           
            if (closestElement.is(declarationStatementSelector) || closestElement.is(parametersSelector)) {
                $("#tabs").contextmenu("showEntry", "documentation", true);
            }
            else {
                $("#tabs").contextmenu("showEntry", "documentation", false);
            }
        }
    });
}

function droppedOnStatements(ui, statements, droppableForIfComponentsParameters, droppableForSwitchComponentsParameters, droppableForStatementsParameters, insertionPointHtmlCode) {
    var codebehindClass = getCodebehindClassOfName(ui.draggable.button("option", "label"));

    if (codebehindClass != null) {
        $(statements).data("codebehindObject").append(codebehindClass);

        $(statements).append(insertionPointHtmlCode).prepend(insertionPointHtmlCode);
        $(statements).find(".statements, .statementInsertionPoint").droppable(droppableForStatementsParameters);    // assign all droppables
        $(statements).find(".ifStatement").droppable(droppableForIfComponentsParameters);
        $(statements).find(".switchStatement").droppable(droppableForSwitchComponentsParameters);
        $(statements).droppable("destroy"); // remove droppable from statements

        $(statements).find("input").first().focus();
    }
    else {
        console.warn("no ui element for given name found");
    }
}

function droppedOnIfStatement(ui, ifStatement, droppableForStatementsParameters) {
    var codebehindObject = $(ifStatement).data("codebehindObject");

    switch (ui.draggable.button("option", "label")) {
        case languagePack["else"]:
            $(codebehindObject.addElseBlock()).find(".statements").droppable(droppableForStatementsParameters);
            break;

        default:
            console.warn("no component element for name given found");
            break;
    }

    $(ifStatement).droppable("destroy");
}

function droppedOnSwitchStatement(ui, switchStatement, droppableForStatementsParameters) {
    var codebehindObject = $(switchStatement).data("codebehindObject");

    switch (ui.draggable.button("option", "label")) {
        case languagePack["case"]:
            $(codebehindObject.addCaseBlock()).find(".statements").droppable(droppableForStatementsParameters);
            break;

        case languagePack["else"]:
            $(codebehindObject.addElseBlock()).find(".statements").droppable(droppableForStatementsParameters);
            $(switchStatement).droppable("option", "accept", "." + languagePack["case"] + "Component");
            break;

        default:
            console.log("no component element for name given found");
            break;
    }
}

 function droppedOnStatementInsertionPoint(ui, insertionPoint, droppableForIfComponentsParameters, droppableForSwitchComponentsParameters, droppableForStatementsParameters, insertionPointHtmlCode) {
    var codebehindClass = getCodebehindClassOfName(ui.draggable.button("option", "label"));
    var elementForInsertion;

    if (codebehindClass != null) {
        elementForInsertion = $(insertionPoint).prev();

        if (elementForInsertion.length > 0) {  // a previous element exists -> insertAfter the previous element
            var statementsContainer = $(insertionPoint).parent();

            $(insertionPoint).remove(); 
            statementsContainer.data("codebehindObject").insertAfter(codebehindClass, elementForInsertion); // insert the new element
            $(elementForInsertion).next().before(insertionPointHtmlCode).after(insertionPointHtmlCode);   // insert the new insertion points
            
            $(elementForInsertion).next().droppable(droppableForStatementsParameters);               // assign all droppables
            $(elementForInsertion).next().next().find(".statements").droppable(droppableForStatementsParameters);
            
            if (codebehindClass == IfStatement) {
                $(elementForInsertion).next().next().droppable(droppableForIfComponentsParameters);
            }
            else if (codebehindClass == SwitchStatement) {
                $(elementForInsertion).next().next().droppable(droppableForSwitchComponentsParameters);
            }

            $(elementForInsertion).next().next().find("input").first().focus();
            
            $(elementForInsertion).next().next().next().droppable(droppableForStatementsParameters);
        }
        else {  // no previous elements exists -> insertBefore the next element
            var statementsContainer = $(insertionPoint).parent();

            elementForInsertion = $(insertionPoint).next();
            $(insertionPoint).remove();
            statementsContainer.data("codebehindObject").insertBefore(codebehindClass, elementForInsertion);    // insert the new element
            $(elementForInsertion).prev().before(insertionPointHtmlCode).after(insertionPointHtmlCode);   // insert the new insertion points

            $(elementForInsertion).prev().droppable(droppableForStatementsParameters);           // assign all droppables
            $(elementForInsertion).prev().prev().find(".statements").droppable(droppableForStatementsParameters);

            if (codebehindClass == IfStatement) {
                $(elementForInsertion).prev().prev().droppable(droppableForIfComponentsParameters);
            }
            else if (codebehindClass == SwitchStatement) {
                $(elementForInsertion).prev().prev().droppable(droppableForSwitchComponentsParameters);
            }

            $(elementForInsertion).prev().prev().find("input").first().focus();
            
            $(elementForInsertion).prev().prev().prev().droppable(droppableForStatementsParameters);
        }
    }
    else {
        console.log("no ui element for given name found");
    }
}

function getCodebehindClassOfName(name) {
    var codebehindClass = null;

    switch (name) {
        case languagePack["if"]:
            codebehindClass = IfStatement;
            break;

        case languagePack["while"]:
            codebehindClass = WhileStatement;
            break;

        case languagePack["do while"]:
            codebehindClass = DoWhileStatement;
            break;

        case languagePack["for"]:
            codebehindClass = ForStatement;
            break;

        case languagePack["switch"]:
            codebehindClass = SwitchStatement;
            break;

        case languagePack["declaration"]:
            codebehindClass = DeclarationStatement;
            break;

        case languagePack["assignment"]:
            codebehindClass = AssignmentStatement;
            break;

        case languagePack["call"]:
            codebehindClass = FunctionCallStatement;
            break;

        case languagePack["input"]:
            codebehindClass = InputStatement;
            break;

        case languagePack["output"]:
            codebehindClass = OutputStatement;
            break;

        case languagePack["comment"]:
            codebehindClass = CommentStatement;
            break;

        default:
            codebehindClass = null;
            break;
    }

    return codebehindClass;
}

function hideAddressColumnChanged() {
    if (configurations.hideAddressColumn && $("#visualStackContainer table thead tr th").length > 3) {
        $("#visualStackContainer table thead tr").children().last().remove();
    }
    else if (!configurations.hideAddressColumn && $("#visualStackContainer table thead tr th").length < 4) {
        $("#visualStackContainer table thead tr").append("<th>" + languagePack.address + "</th>");
        $("#visualStackContainer table").styleTable();
    }
}})();