/// <reference path="../frameworks/jquery-ui-1.11.4/external/jquery/jquery.js" />
/// <reference path="../frameworks/jquery-ui-1.11.4/jquery-ui.js" />
/// <reference path="diagramControls.js" />
/// <reference path="diagramUtil.js" />

"use strict";

(function() {
    function parseSerializedDiagram(savedDiagramObject, mainStatementsContainer, addFunctionFunction, onResultStatementsChanged) {
        var functionSkeletons = {};

        for (var functionName in savedDiagramObject) {  // generate all function codebehind (otherwise generation of CALL-statements would fail)
            if (functionName != "main") {
                if (functionAlreadyExists(functionName)) {
                    alert("Function '" + functionName + "' could not be loaded because a function with the same name already exists!");
                }
                else {
                    var functionContainer = addFunctionFunction(functionName);
                    var functionSkeleton = blockDiagramEditorGlobals.FunctionPropertyHolder.getFunctionSkeleton(onResultStatementsChanged);
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

                        if (parameter.onlyIn === false) {
                            currentParameter.find("button").trigger("click");
                        }

                        if (parameter.documentation) {
                            currentParameter.children().last().text(" // " + parameter.documentation);
                        }
                    });

                    if (savedDiagramObject[functionName].returnType !== "void") {
                        $(functionSkeleton).find(".resultInitializationValue")[0].value = savedDiagramObject[functionName].resultInitializationValue;
                        $(functionSkeleton).find(".functionResultDeclaration").data(blockDiagramEditorGlobals.codebehindObjectName).initializationValueChanged(savedDiagramObject[functionName].resultInitializationValue);
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
        return blockDiagramEditorGlobals.FunctionPropertyHolder.getByName(functionName);
    }

    function parseDiagramStatements(serializableStatement, guiComponent, rootElement, shouldInsertBefore) {
        switch (serializableStatement.type) {
            case "Statements":
                if (shouldInsertBefore) {
                    var statements = $(guiComponent).parent().data(blockDiagramEditorGlobals.codebehindObjectName);
                    var insertBeforeStatement = $(guiComponent);

                    serializableStatement.statements.forEach(function(statement) {
                        statements.insertBefore(statement.type, insertBeforeStatement);
                        parseDiagramStatements(statement, insertBeforeStatement.prev(), rootElement);
                    });
                }
                else {
                    var statements = $(guiComponent).data(blockDiagramEditorGlobals.codebehindObjectName);

                    serializableStatement.statements.forEach(function (statement) {
                        statements.append(statement.type);
                        parseDiagramStatements(statement, $(statements.getDomElement()).children().last(), rootElement);
                    });
                }

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
                    $(guiComponent).data(blockDiagramEditorGlobals.codebehindObjectName).removeElseBlock();
                }

                $(guiComponent).data(blockDiagramEditorGlobals.codebehindObjectName).setComment(serializableStatement.comment);

                break;

            case "WhileStatement":
                if (serializableStatement.condition != null) {
                    var conditionInput = $($(guiComponent).find("input"));
                    conditionInput[0].value = getEmptyStringIfUndefined(serializableStatement.condition);
                    conditionInput.trigger("change");
                }

                parseDiagramStatements(serializableStatement.loopStatements, $(guiComponent).find(".statements"), rootElement);

                $(guiComponent).data(blockDiagramEditorGlobals.codebehindObjectName).setComment(serializableStatement.comment);

                break;

            case "DoWhileStatement":
                if (serializableStatement.condition != null) {
                    var conditionInput = $($(guiComponent).children().last().find("input"));

                    conditionInput[0].value = getEmptyStringIfUndefined(serializableStatement.condition);
                    conditionInput.trigger("change");
                }

                parseDiagramStatements(serializableStatement.loopStatements, $(guiComponent).find(".statements"), rootElement);

                $(guiComponent).data(blockDiagramEditorGlobals.codebehindObjectName).setComment(serializableStatement.comment);

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

                $(guiComponent).data(blockDiagramEditorGlobals.codebehindObjectName).setComment(serializableStatement.comment);

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
                    $(guiComponent).data(blockDiagramEditorGlobals.codebehindObjectName).removeCaseBlock($(statementsContainer).data(blockDiagramEditorGlobals.codebehindObjectName));
                });

                serializableStatement.casesStatements.forEach(function (caseStatements, index) {
                    $(guiComponent).data(blockDiagramEditorGlobals.codebehindObjectName).addCaseBlock();

                    addedRow = tbody.children().last();

                    addedRow.find("input")[0].value = getEmptyStringIfUndefined(caseStatements.caseValue);
                    addedRow.find("input").trigger("change");

                    parseDiagramStatements(caseStatements.caseStatements, addedRow.find(".statements"), rootElement);
                });

                $(guiComponent).data(blockDiagramEditorGlobals.codebehindObjectName).setComment(serializableStatement.comment);

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

                $(guiComponent).data(blockDiagramEditorGlobals.codebehindObjectName).setComment(serializableStatement.comment);

                break;

            case "AssignmentStatement":
                var inputElements = $(guiComponent).find("input");

                inputElements[0].value = getEmptyStringIfUndefined(serializableStatement.variableName);
                $(inputElements[0]).trigger("change");
                inputElements[1].value = getEmptyStringIfUndefined(serializableStatement.assignmentValue);
                $(inputElements[1]).trigger("change");

                $(guiComponent).data(blockDiagramEditorGlobals.codebehindObjectName).setComment(serializableStatement.comment);

                break;

            case "InputStatement":
                $(guiComponent).find("input")[0].value = getEmptyStringIfUndefined(serializableStatement.prompt);
                $(guiComponent).find("input").trigger("change");
                $(guiComponent).find("input")[1].value = getEmptyStringIfUndefined(serializableStatement.variableName);
                $(guiComponent).find("input").trigger("change");

                $(guiComponent).data(blockDiagramEditorGlobals.codebehindObjectName).setComment(serializableStatement.comment);

                break;

            case "OutputStatement":
                $(guiComponent).find("input")[0].value = getEmptyStringIfUndefined(serializableStatement.outputString);
                $(guiComponent).find("input").trigger("change");

                $(guiComponent).data(blockDiagramEditorGlobals.codebehindObjectName).setComment(serializableStatement.comment);

                break;

            case "FunctionCallStatement":
                var inputsBeforeParameters = 1;

                $(guiComponent).find("input")[0].value = getEmptyStringIfUndefined(serializableStatement.functionName);
                $($(guiComponent).find("input")[0]).trigger("change");

                var functionPropertyHolder = blockDiagramEditorGlobals.FunctionPropertyHolder.getByName(serializableStatement.functionName);

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

                $(guiComponent).data(blockDiagramEditorGlobals.codebehindObjectName).setComment(serializableStatement.comment);

                break;
        }
    }

    function getEmptyStringIfUndefined(value) {
        return value === undefined ? "" : value;
    }

    $.extend(window.blockDiagramEditorGlobals, {
        parseSerializedDiagram: parseSerializedDiagram,
        parseDiagramStatements: parseDiagramStatements
    });
})();