﻿/// <reference path="../frameworks/jquery-ui-1.11.4/external/jquery/jquery.js" />
/// <reference path="../frameworks/jquery-ui-1.11.4/jquery-ui.js" />
/// <reference path="diagramControls.js" />
/// <reference path="diagramUtil.js" />

"use strict";

var info;
function parseSerializedDiagram(savedDiagramObject, mainStatementsContainer, addFunctionFunction, onResultStatementsChanged) {
    var functionSkeletons = {};

    for (var functionName in savedDiagramObject) {  // generate all function codebehind (otherwise generation of CALL-statements would fail)
        if (functionName != "main") {
            if (functionAlreadyExists(functionName)) {
                alert("Function '" + functionName + "' could not be loaded because a function with the same name already exists!");
            }
            else {
                var functionContainer = addFunctionFunction(functionName);
                var functionSkeleton = getFunctionSkeleton(onResultStatementsChanged);
                var addParameterButton = $(functionSkeleton).children("button")[1];
                var currentParameter;

                $(functionSkeleton).find("input")[0].value = getEmptyStringIfUndefined(savedDiagramObject[functionName].returnType);
                $(functionSkeleton).find("input")[1].value = getEmptyStringIfUndefined(functionName);

                $(functionContainer).append(functionSkeleton);

                $(functionSkeleton).find("input").first().trigger("change");    // autogrow only works if elements are in the DOM
                $($(functionSkeleton).find("input")[1]).trigger("change");

                savedDiagramObject[functionName].parameters.forEach(function (parameter) {
                    addParameterButton.click();
                    currentParameter = $(functionSkeleton).find(".parameter:last-child");

                    currentParameter.find("input")[0].value = getEmptyStringIfUndefined(parameter.type);
                    currentParameter.find("input").first().trigger("change");
                    currentParameter.find("input")[1].value = getEmptyStringIfUndefined(parameter.name);
                    currentParameter.find("input").first().nextAll("input").first().trigger("change");

                    if (parameter.onlyIn == false) {
                        currentParameter.find("button").trigger("click");
                    }

                    if (parameter.documentation) {
                        currentParameter.children().last().text(" // " + parameter.documentation);
                    }
                });

                if (savedDiagramObject[functionName].returnType !== "void") {
                    $(functionSkeleton).find(".resultInitializationValue")[0].value = savedDiagramObject[functionName].resultInitializationValue;
                    $(functionSkeleton).find(".functionResultDeclaration").data("codebehindObject").initializationValueChanged(savedDiagramObject[functionName].resultInitializationValue);
                }

                functionSkeletons[functionName] = functionSkeleton;
            }
        }
    }

    if (savedDiagramObject.main) {
        parseDiagramStatements(savedDiagramObject.main, $(mainStatementsContainer), $(mainStatementsContainer));
    }

    for (var functionName in savedDiagramObject) {
        if (functionName != "main") {
            parseDiagramStatements(savedDiagramObject[functionName].statements, $(functionSkeletons[functionName]).find(".statements"), $(functionSkeletons[functionName]).find(".statements"));
        }
    }
}

function functionAlreadyExists(functionName) {
    return FunctionPropertyHolder.getByName(functionName);
}

function parseDiagramStatements(serializableStatement, guiComponent, rootElement) {
    switch (serializableStatement.type) {
        case "Statements":
            var statements = $(guiComponent).data("codebehindObject");

            serializableStatement.statements.forEach(function (statement) {
                statements.append(window[statement.type]);
                parseDiagramStatements(statement, $(statements.getDomElement()).children().last(), rootElement);
            });

            break;

        case "CommentStatement":
            $(guiComponent).find("input")[0].value = getEmptyStringIfUndefined(serializableStatement.comment);
            $(guiComponent).find("input").first().trigger("change");

            break;

        case "IfStatement":
            if (serializableStatement.condition != null) {
                var conditionInput = $($(guiComponent).find("input"));

                conditionInput[0].value = getEmptyStringIfUndefined(serializableStatement.condition);
                conditionInput.trigger("change");
            }

            var statements = $(guiComponent).find(".statements");

            parseDiagramStatements(serializableStatement.thenStatements, $(statements[0]), rootElement);
            
            if (serializableStatement.elseStatements != null) {
                parseDiagramStatements(serializableStatement.elseStatements, $(statements[1]), rootElement);
            }
            else {
                $(guiComponent).data("codebehindObject").removeElseBlock();
            }

            break;

        case "WhileStatement":
            if (serializableStatement.condition != null) {
                var conditionInput = $($(guiComponent).find("input"));
                conditionInput[0].value = getEmptyStringIfUndefined(serializableStatement.condition);
                conditionInput.trigger("change");
            }

            parseDiagramStatements(serializableStatement.loopStatements, $(guiComponent).find(".statements"), rootElement);

            break;

        case "DoWhileStatement":
            if (serializableStatement.condition != null) {
                var conditionInput = $($(guiComponent).children().last().find("input"));

                conditionInput[0].value = getEmptyStringIfUndefined(serializableStatement.condition);
                conditionInput.trigger("change");
            }

            parseDiagramStatements(serializableStatement.loopStatements, $(guiComponent).find(".statements"), rootElement);

            break;

        case "ForStatement":
            var inputElements = $(guiComponent).find("input");

            inputElements[0].value = getEmptyStringIfUndefined(serializableStatement.counterName);
            $(inputElements[0]).trigger("change");
            inputElements[1].value = getEmptyStringIfUndefined(serializableStatement.fromValue);
            $(inputElements[1]).trigger("change");
            inputElements[2].value = getEmptyStringIfUndefined(serializableStatement.toValue);
            $(inputElements[2]).trigger("change");
            inputElements[3].value = getEmptyStringIfUndefined(serializableStatement.counterShift);
            $(inputElements[3]).trigger("change");

            parseDiagramStatements(serializableStatement.loopStatements, $(guiComponent).find(".statements"), rootElement);

            break;

        case "SwitchStatement":
            var tbody = $(guiComponent).find("tbody");
            var addedRow;

            $(guiComponent).find("thead input")[0].value = getEmptyStringIfUndefined(serializableStatement.variableName);
            $($(guiComponent).find("thead input")[0]).trigger("change");

            if (serializableStatement.elseStatements != null) {
                parseDiagramStatements(serializableStatement.elseStatements, $(guiComponent).find("tfoot .statements"), rootElement);
            }

            tbody.find(".statements").each(function (index, statementsContainer) {  // remove all pregenerated cases
                $(guiComponent).data("codebehindObject").removeCaseBlock($(statementsContainer).data("codebehindObject"));
            });

            serializableStatement.casesStatements.forEach(function (caseStatements, index) {
                $(guiComponent).data("codebehindObject").addCaseBlock();
                    
                addedRow = tbody.children().last();

                addedRow.find("input")[0].value = getEmptyStringIfUndefined(caseStatements.caseValue);
                addedRow.find("input").trigger("change");
                
                parseDiagramStatements(caseStatements.caseStatements, addedRow.find(".statements"), rootElement);
            });

            break;

        case "DeclarationStatement":
            var inputElements = $(guiComponent).find("input");

            inputElements[0].value = getEmptyStringIfUndefined(serializableStatement.variableType);
            $(inputElements[0]).trigger("change");
            inputElements[1].value = getEmptyStringIfUndefined(serializableStatement.variableName);
            $(inputElements[1]).trigger("change");

            if (serializableStatement.isArray) {
                inputElements[3].value = getEmptyStringIfUndefined(serializableStatement.arrayLength);
                $(inputElements[3]).trigger("change");
            }
            else {
                inputElements[2].value = getEmptyStringIfUndefined(serializableStatement.initializationValue);
                $(inputElements[2]).trigger("change");
            }

            $(guiComponent).data("codebehindObject").addDocumentation(serializableStatement.documentation);

            break;

        case "AssignmentStatement":
            var inputElements = $(guiComponent).find("input");

            inputElements[0].value = getEmptyStringIfUndefined(serializableStatement.variableName);
            $(inputElements[0]).trigger("change");
            inputElements[1].value = getEmptyStringIfUndefined(serializableStatement.assignmentValue);
            $(inputElements[1]).trigger("change");

            break;

        case "InputStatement":
            $(guiComponent).find("input")[0].value = getEmptyStringIfUndefined(serializableStatement.prompt);
            $(guiComponent).find("input").trigger("change");
            $(guiComponent).find("input")[1].value = getEmptyStringIfUndefined(serializableStatement.variableName);
            $(guiComponent).find("input").trigger("change");

            break;

        case "OutputStatement":
            $(guiComponent).find("input")[0].value = getEmptyStringIfUndefined(serializableStatement.outputString);
            $(guiComponent).find("input").trigger("change");

            break;

        case "FunctionCallStatement":
            var inputsBeforeParameters = 1;

            $(guiComponent).find("input")[0].value = getEmptyStringIfUndefined(serializableStatement.functionName);
            $($(guiComponent).find("input")[0]).trigger("change");

            var functionPropertyHolder = FunctionPropertyHolder.getByName(serializableStatement.functionName);

            if (functionPropertyHolder != null && functionPropertyHolder.getReturnType() != "void") {
                if (serializableStatement.variableName != null) {
                    $(guiComponent).find("input")[0].value = getEmptyStringIfUndefined(serializableStatement.variableName);
                    $(guiComponent).find("input").first().trigger("change");
                }

                inputsBeforeParameters++;
            }

            var inputElements = $(guiComponent).find("input");
            serializableStatement.parameters.forEach(function (parameter, index) {
                inputElements[index + inputsBeforeParameters].value = getEmptyStringIfUndefined(parameter.value);
                $(inputElements[index + inputsBeforeParameters]).trigger("change");
            });

            break;
    }
}

function getEmptyStringIfUndefined(value) {
    return value == undefined ? "" : value;
}


// ------------------    Serializable Constructors

function StatementsSerializable() {
    this.type = "Statements";
    this.statements = new Array();
}

function CommentStatementSerializable() {
    this.type = "CommentStatement";
    this.comment = null;
}

function IfStatementSerializable() {
    this.type = "IfStatement";
    this.thenStatements = null;
    this.elseStatements = null;
    this.condition = null;
}

function WhileStatementSerializable() {
    this.type = "WhileStatement";
    this.condition = null;
    this.loopStatements = null;
}

function DoWhileStatementSerializable() {
    this.type = "DoWhileStatement";
    this.condition = null;
    this.loopStatements = null;
}

function ForStatementSerializable() {
    this.type = "ForStatement";
    this.counterName = null;
    this.fromValue = null;
    this.toValue = null;
    this.counterShift = null;
    this.loopStatements = null;
}

function SwitchStatementSerializable() {
    this.type = "SwitchStatement";
    this.variableName = null;
    this.casesStatements = new Array();
    this.elseStatements = null;
}

function DeclarationStatementSerializable() {
    this.type = "DeclarationStatement";
    this.variableType = null;
    this.variableName = null;
    this.initializationValue = null;
    this.documentation = null;
    this.arrayLength = null;
    this.isArray = null;
}

function AssignmentStatementSerializable() {
    this.type = "AssignmentStatement";
    this.variableName = null;
    this.assignmentValue = null;
}

function InputStatementSerializable() {
    this.type = "InputStatement";
    this.prompt = null;
    this.variableName = null;
}

function OutputStatementSerializable() {
    this.type = "OutputStatement";
    this.outputString = null;
}

function FunctionCallStatementSerializable() {
    this.type = "FunctionCallStatement";
    this.variableName = null;
    this.functionName = null;
    this.parameters = null;
}