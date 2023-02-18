/// <reference path="../frameworks/jquery-ui-1.11.4/external/jquery/jquery.js" />
/// <reference path="../frameworks/jquery-ui-1.11.4/jquery-ui.js" />

"use strict";

(function() {
    function Statement(statement, insertionMode, htmlSkeleton, rootElement) {
        var _domElement;
        var _rootElement = rootElement;

        this.getDomElement = function () {
            return _domElement;
        };

        this.getRootElement = function () {
            return _rootElement;
        };

        this.convertBlockDiagramTypeToCType = function (blockDiagramType) {
            var cType;

            switch (blockDiagramType) {
                case blockDiagramEditorGlobals.languagePack["integer"]:
                    cType = "int";
                    break;

                case blockDiagramEditorGlobals.languagePack["string"]:
                    cType = "char*";
                    break;

                case blockDiagramEditorGlobals.languagePack["integer"] + "[]":
                    cType = "int*";
                    break;

                case blockDiagramEditorGlobals.languagePack["string"] + "[]":
                    cType = "char**";
                    break;

                case "void":
                    cType = "void";
                    break;

                default:
                    cType = undefined;
            }

            return cType;
        };

        (function () {  // intialize function
            if (insertionMode === Statement.insertInto) {
                $(statement).append(htmlSkeleton);
                _domElement = $(statement).children().last()[0];
                $(_domElement).data(blockDiagramEditorGlobals.codebehindObjectName, this);
            }
            else if (insertionMode === Statement.insertAfter) {
                $(statement).after(htmlSkeleton);
                _domElement = $(statement).next()[0];
                $(_domElement).data(blockDiagramEditorGlobals.codebehindObjectName, this);
            }
            else if (insertionMode === Statement.insertBefore) {
                $(statement).before(htmlSkeleton);
                _domElement = $(statement).prev()[0];
                $(_domElement).data(blockDiagramEditorGlobals.codebehindObjectName, this);
            }
            else if (insertionMode === Statement.useGiven) {
                _domElement = $(statement)[0];
            }
            else if (insertionMode === Statement.prepend) {
                $(statement).prepend(htmlSkeleton);
                _domElement = $(statement).children().first()[0];
                $(_domElement).data(blockDiagramEditorGlobals.codebehindObjectName, this);
            }
        }).call(this);
    }

    Statement.insertInto = 0;   // constants for inserting new elements
    Statement.insertAfter = 1;
    Statement.insertBefore = 2;
    Statement.useGiven = 3;
    Statement.prepend = 4;

    blockDiagramEditorGlobals.applicationContainer = null;


    function Statements(statement, insertionMode, rootElement) {
        var _statements = [];

        Statement.call(this, statement, insertionMode, null, rootElement);

        this.prepend = function (StatementConstructor) {
            _statements.unshift(new StatementConstructor(this.getDomElement(), Statement.prepend, this.getRootElement()));
        };

        this.append = function (StatementConstructor) {
            if (typeof StatementConstructor === "string") { // this is used when loading diagrams
                StatementConstructor = eval(StatementConstructor);
            }

            _statements.push(new StatementConstructor(this.getDomElement(), Statement.insertInto, this.getRootElement()));
        };

        this.insertAfter = function (StatementConstructor, statement) {
            var positionToInsert = _statements.indexOf($(statement).data(blockDiagramEditorGlobals.codebehindObjectName)) + 1;

            _statements.splice(positionToInsert, 0, new StatementConstructor(statement, Statement.insertAfter, this.getRootElement()));
        };

        this.insertBefore = function (StatementConstructor, statement) {
            var positionToInsert = _statements.indexOf($(statement).data(blockDiagramEditorGlobals.codebehindObjectName));

            if (typeof StatementConstructor === "string") { // this is used when loading diagrams
                StatementConstructor = eval(StatementConstructor);
            }

            _statements.splice(positionToInsert, 0, new StatementConstructor(statement, Statement.insertBefore, this.getRootElement()));
        };

        this.remove = function (statement) {
            var positionToRemove = _statements.indexOf($(statement).data(blockDiagramEditorGlobals.codebehindObjectName));

            _statements.splice(positionToRemove, 1);

            $(statement).remove();
        };

        this.isEmpty = function () {
            return _statements.length === 0;
        };

        this.generateSimulationCode = function (statementsCaseId, nextStatementsCaseId, nextFreeId) {
            var simulationCode = "";
            var statementsCaseIds = [];
            var i;

            if (nextStatementsCaseId === -1) {   // container of whole function/procedure/main
                var functionPropertyHolder = $(this.getRootElement()).parent().data(blockDiagramEditorGlobals.codebehindObjectName);

                if (functionPropertyHolder) {   // it's a function/procedure but not main
                    if (functionPropertyHolder.getReturnType() !== "void") { // it's a function
                        nextStatementsCaseId = "[localVariables['result'].value]";  // reuse the nextStatementsCaseId as a way to get the return value out
                    }                                       // used this "hack" because the actual return of the function happens in the last statement so if we wanted to add a property to the return object we would have to check whether it's a function or not in every statement
                }                                           // embed in array so that the caller can distinguish whether this is a return value or a real nextStatementsCaseId value
            }

            if (_statements.some(function (element) {
                if (element.constructor !== CommentStatement) {
                    return true;
                }

                return false;
            })) {
                statementsCaseIds.push(statementsCaseId);
                for (i = 0; i < _statements.length; i++) {
                    if (_statements[i].constructor !== CommentStatement) {
                        statementsCaseIds.push(nextFreeId.value++);
                    }
                }
                statementsCaseIds.pop();
                statementsCaseIds.push(nextStatementsCaseId);

                i = 0;
                _statements.forEach(function (statement) {
                    if (statement.constructor !== CommentStatement) {
                        simulationCode += statement.generateSimulationCode(statementsCaseIds[i], statementsCaseIds[i + 1], nextFreeId);
                        i++;
                    }
                });
            }
            else {
                simulationCode += "case " + statementsCaseId + ":";
                simulationCode += "return {";
                simulationCode += "caseId: " + nextStatementsCaseId + ",";
                simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).getPath() + "'";
                simulationCode += "};"
            }

            return simulationCode;
        };

        this.generateCCode = function () {
            var generatedCode = "";

            if (this.getDomElement() === this.getRootElement()[0]) {    // function
                var functionPropertyHolder = $(this.getRootElement()).parent().data(blockDiagramEditorGlobals.codebehindObjectName);
                var parametersStringArray = [];

                if (functionPropertyHolder) {   // subprogram
                    generatedCode += this.convertBlockDiagramTypeToCType(functionPropertyHolder.getReturnType()) + " " + functionPropertyHolder.getName() + "(";

                    functionPropertyHolder.getParameters().forEach(function (parameter) {
                        var cParameterType = this.convertBlockDiagramTypeToCType(parameter.getType());

                        if (parameter.getOnlyIn() === false && parameter.getType() === blockDiagramEditorGlobals.languagePack["integer"]) {
                            cParameterType += "*";
                        }

                        parametersStringArray.push(cParameterType + " " + parameter.getName());

                        if (parameter.getType().charAt(parameter.getType().length - 1) === "]") {
                            parametersStringArray.push("int " + parameter.getName() + "Size");
                        }
                    }, this);

                    generatedCode += parametersStringArray.join(",");

                    generatedCode += ") {";

                    _statements.forEach(function (statement) {
                        generatedCode += statement.generateCCode();
                    });

                    if (functionPropertyHolder.getReturnType() === blockDiagramEditorGlobals.languagePack["integer"]) {
                        generatedCode += "return " + blockDiagramEditorGlobals.languagePack["result"] + ";";
                    }
                    else if (functionPropertyHolder.getReturnType() === blockDiagramEditorGlobals.languagePack["string"]) {
                        generatedCode += "/* returning a string is not supported */";
                    }

                    generatedCode += "}";
                }
                else {  // main
                    generatedCode += "int main() {";

                    _statements.forEach(function (statement) {
                        generatedCode += statement.generateCCode();
                    });

                    generatedCode += "return 0;";

                    generatedCode += "}";
                }
            }
            else {
                _statements.forEach(function (statement) {
                    generatedCode += statement.generateCCode();
                });
            }

            return this.replaceArrayLengthAccess(generatedCode);
        };

        this.replaceArrayLengthAccess = function (codeString) {
            return codeString.replace(/\.length/, function (match, offset) {
                var stringToReplace;
                var numberOfQuotes = 0;

                for (var i = 0; i < offset; i++) {
                    if (codeString.charAt(i) === '"' || codeString.charAt(i) === "'") {
                        numberOfQuotes++;
                    }
                }

                if (numberOfQuotes % 2 === 0) { // replace every match which is not between quotes
                    stringToReplace = "Size";
                }
                else {
                    stringToReplace = match;
                }

                return stringToReplace;
            });
        };

        this.toSerializableObject = function () {
            var statementsSerializable = new StatementsSerializable();

            _statements.forEach(function (statement) {
                var serializableStatement = statement.toSerializableObject();

                if (serializableStatement) {
                    statementsSerializable.statements.push(serializableStatement);
                }
            });

            return statementsSerializable;
        };
    }

    Statements.htmlSkeleton = '<div class="statements"></div>';


    function InputReceivableStatement(statement, insertionMode, htmlSkeleton, rootElement, minWidthValues) {
        Statement.call(this, statement, insertionMode, htmlSkeleton, rootElement);

        this.prepareAutogrowInput = function (minWidthValues) {
            var id;
            var i = 0;

            $(this.getDomElement()).uniqueId();
            id = $(this.getDomElement()).attr("id");
            $(this.getDomElement()).find("input").not("#" + id + " .statements *").each(function (index, element) {
                $(element).autoGrowInput({
                    minWidth: minWidthValues[i++],
                    comfortZone: 1
                });
            });
            $(this.getDomElement()).removeUniqueId();
        };

        this.prepareAutogrowInputField = function (field, minWidthValue) {
            $(field).autoGrowInput({
                minWidth: minWidthValue,
                comfortZone: 3
            });
        };

        this.getDeclaredVariables = function () {
            var variables = [];

            $(this.getRootElement()).find(".declarationStatement").each(function(index, element) {
                variables.push($(element).data(blockDiagramEditorGlobals.codebehindObjectName).getVariableName());
            });

            var functionPropertyHolder = $(this.getRootElement()).parent().data(blockDiagramEditorGlobals.codebehindObjectName);

            if (functionPropertyHolder) { // -> it's a function/procedure -> we have to add the parameters
                functionPropertyHolder.getParameters().forEach(function (parameter) {
                    variables.push(parameter.getName());
                });
            }

            return variables;
        };

        this.replaceIntegerOutParameterAccess = function (codeString) {
            var variableNames = [];
            var functionPropertyHolder = $(this.getRootElement()).parent().data(blockDiagramEditorGlobals.codebehindObjectName);

            if (functionPropertyHolder) { // -> it's a function/procedure -> we have to add the parameters
                functionPropertyHolder.getParameters().forEach(function (parameter) {
                    if (parameter.getOnlyIn() === false && parameter.getType() === blockDiagramEditorGlobals.languagePack["integer"]) {
                        variableNames.push(parameter.getName());
                    }
                });
            }

            var possibleShadowingVariable = "dummy";

            while (possibleShadowingVariable !== null && variableNames.length > 0) {
                possibleShadowingVariable = null;

                codeString = codeString.replace(new RegExp(variableNames.join("|"), "g"), function (match, offset) {
                    var stringToReplace;
                    var numberOfQuotes = 0;

                    for (var i = 0; i < offset; i++) {
                        if (codeString.charAt(i) === '"' || codeString.charAt(i) === "'") {
                            numberOfQuotes++;
                        }
                    }

                    if (numberOfQuotes % 2 === 0 && (offset - 1 < 1 || !codeString.charAt(offset - 1).match("[a-z0-9]")) && (offset + match.length >= codeString.length || !codeString.charAt(offset + match.length).match("[a-z0-9]"))) { // replace every match which is not between quotes
                        stringToReplace = "*" + match;
                    }
                    else {
                        stringToReplace = match;
                        possibleShadowingVariable = match;
                    }

                    return stringToReplace;
                });

                if (possibleShadowingVariable !== null) {
                    variableNames.splice(variableNames.indexOf(possibleShadowingVariable), 1);  // remove the potential shadowing variable
                }
            }

            return codeString;
        };

        this.replaceVariableAccess = function (codeString) {
            var variableNames = this.getDeclaredVariables();
            var possibleShadowingVariable = "dummy";

            while (possibleShadowingVariable !== null && variableNames.length > 0) {
                possibleShadowingVariable = null;

                codeString = codeString.replace(new RegExp(variableNames.join("|"), "g"), function (match, offset) {
                    var stringToReplace;
                    var numberOfQuotes = 0;

                    for (var i = 0; i < offset; i++) {
                        if (codeString.charAt(i) === '"' || codeString.charAt(i) === "'") {
                            numberOfQuotes++;
                        }
                    }

                    if (numberOfQuotes % 2 === 0 && (offset - 1 < 1 || !codeString.charAt(offset - 1).match("[a-z0-9]")) && (offset + match.length >= codeString.length || !codeString.charAt(offset + match.length).match("[a-z0-9]"))) { // replace every match which is not between quotes
                        stringToReplace = "localVariables[\"" + match + "\"].value";
                    }
                    else {
                        stringToReplace = match;
                        possibleShadowingVariable = match;
                    }

                    return stringToReplace;
                });

                if (possibleShadowingVariable !== null) {
                    variableNames.splice(variableNames.indexOf(possibleShadowingVariable), 1);  // remove the potential shadowing variable
                }
            }

            return codeString;
        };

        this.getVariableType = function (variableName) {
            var variableType;

            var declarationStatementCodebehindObject;
            $(this.getRootElement()).find(".declarationStatement").each(function(index, element) {
                declarationStatementCodebehindObject = $(element).data(blockDiagramEditorGlobals.codebehindObjectName);

                if (declarationStatementCodebehindObject.getVariableName() === variableName) {
                    variableType = declarationStatementCodebehindObject.getVariableType();
                }
            });

            if (!variableType) {
                var functionPropertyHolder = $(this.getRootElement()).parent().data(blockDiagramEditorGlobals.codebehindObjectName);

                if (functionPropertyHolder) { // -> it's a function/procedure -> we have to add the parameters
                    functionPropertyHolder.getParameters().forEach(function (parameter) {
                        if (parameter.getName() === variableName) {
                            variableType = parameter.getType();
                        }
                    });

                    var functionReturnType = functionPropertyHolder.getReturnType();    // if function -> result-variable is also available
                    if (functionReturnType !== "void" && variableName === "result") {
                        variableType = functionReturnType;
                    }
                }
            }

            return variableType;
        };

        this.getPrintfParametersForStringConcatenation = function (string) {
            var stringComponents = string.split("+");
            var printfFormatString = "";
            var printfAdditionalArgumentsList = [];

            stringComponents.forEach(function (stringComponents, index) {
                stringComponents = stringComponents.trim();

                if (stringComponents.charAt(0) === "\"") {
                    printfFormatString += "%s";
                }
                else if (stringComponents.charAt(0).match(/0-9/)) {
                    printfFormatString += "%d";
                }
                else {
                    var variableName = stringComponents.split("[")[0];
                    var variableType = this.getVariableType(variableName).split("[")[0];

                    if (variableType === blockDiagramEditorGlobals.languagePack["integer"]) {
                        printfFormatString += "%d";
                        this.replaceIntegerOutParameterAccess(stringComponents);
                    }
                    else if (variableType === blockDiagramEditorGlobals.languagePack["string"]) {
                        printfFormatString += "%s";
                    }
                    else {
                        outputComponents[index] = undefined;
                        stringComponents = undefined;
                    }
                }

                if (stringComponents !== undefined) {
                    printfAdditionalArgumentsList.push(stringComponents);
                }
            }, this);

            return {
                formatString: printfFormatString,
                additionalArgumentList: printfAdditionalArgumentsList
            };
        };

        this.convertToCConditionalExpression = function (conditionalExpression) {
            try {
                var cConditionalExpression;
                var isString;

                if (conditionalExpression.indexOf("==") !== -1 || conditionalExpression.indexOf("!=") !== -1) {
                    var leftAndRightExpressions = conditionalExpression.split(/==|!=/);

                    if (leftAndRightExpressions[0].charAt(0) === "\"") {
                        isString = true;
                    } else {
                        var variableName = leftAndRightExpressions[0].split("[")[0];
                        var variableType = this.getVariableType(variableName).split("[")[0];

                        if (variableType === blockDiagramEditorGlobals.languagePack["string"]) {
                            isString = true;
                        }
                    }

                    if (isString) {
                        if (conditionalExpression.indexOf("==")) {
                            cConditionalExpression = "strcmp (" + leftAndRightExpressions[0] + "," + leftAndRightExpressions[1] + ") === 0";
                        } else if (conditionalExpression.indexOf("!=")) {
                            cConditionalExpression = "strcmp (" + leftAndRightExpressions[0] + "," + leftAndRightExpressions[1] + ") !== 0";
                        } else {

                        }
                    } else {
                        cConditionalExpression = conditionalExpression;
                    }
                } else {
                    cConditionalExpression = conditionalExpression;
                }

                return cConditionalExpression;
            }
            catch (exception) {     // if parsing fails, just return original expression
                return conditionalExpression;
            }
        };

        (function () {  // initialize function
            this.prepareAutogrowInput(minWidthValues);

            $(this.getDomElement()).click(function(event) {
                $(this).toggleClass("statementSelected");
                event.stopPropagation();
            });

            $(this.getDomElement()).find("input").click(function (event) {
                event.stopPropagation();
            });
        }).call(this);
    }


    function CommentAttachableStatement(commentField) {
        var _comment;

        this.getComment = function() {
            return _comment;
        };

        this.setComment = function(comment) {
            _comment = comment;

            if (comment) {
                commentField.text(" // " + _comment);
            }
            else {
                commentField.text("");
            }
        };
    }


    function CommentStatement(statement, insertionMode, rootElement) {
        var _htmlSkeleton = '\
    <div class="commentStatement">\
        <span>//</span><input type="text" onchange="$(this).closest(\'.commentStatement\').data(\'codebehindObject\').commentChanged(this.value);" />\
    </div>';

        var _comment;

        InputReceivableStatement.call(this, statement, insertionMode, _htmlSkeleton, rootElement, [30]);

        this.commentChanged = function (comment) {
            _comment = comment;
        };

        this.generateSimulationCode = function () {
            return "";
        };

        this.generateCCode = function () {
            return "\n/*" + _comment + "*/\n";
        };

        this.toSerializableObject = function () {
            var commentStatementSerializable = new CommentStatementSerializable();

            commentStatementSerializable.comment = _comment;

            return commentStatementSerializable;
        };
    }


    function IfStatement(statement, insertionMode, rootElement) {
        var _elseSkeleton = '<tr><td><div><span>' + blockDiagramEditorGlobals.languagePack["else"] + '</span></div></td><td><div class="statements"></div></td></tr>';
        var _htmlSkeleton = '                                                                            \
    <div class="ifStatement">                                                               \                                            \
        <table>                                                                             \
            <tbody>                                                                         \
                <tr><td><span>' + blockDiagramEditorGlobals.languagePack["if"] + '</span></td><td><input type="text" onchange="$(this).closest(\'.ifStatement\').data(\'codebehindObject\').conditionChanged(this.value);"/><span class=\'comment\'></span></td></tr>            \
                <tr><td><span>' + blockDiagramEditorGlobals.languagePack["then"] + '</span></td><td><div class="statements"></div></td></tr>  \
            </tbody>                                                                        \
        </table>\                                             \
    </div>';
        var _condition;
        var _thenStatements;
        var _elseStatements;

        InputReceivableStatement.call(this, statement, insertionMode, _htmlSkeleton, rootElement, [30]);
        CommentAttachableStatement.call(this, $(this.getDomElement()).find(".comment"));

        this.conditionChanged = function (newValue) {
            _condition = newValue;
        };

        this.addElseBlock = function () {
            var elseStatements = $(_elseSkeleton).appendTo($(this.getDomElement()).children().children().filter("tbody"));

            _elseStatements = new Statements(elseStatements.find(".statements"), Statement.useGiven, this.getRootElement());
            elseStatements.find(".statements").data(blockDiagramEditorGlobals.codebehindObjectName, _elseStatements);

            return elseStatements;
        };

        this.removeElseBlock = function () {
            $(this.getDomElement()).children("table").children("tbody").children().last().remove();

            _elseStatements = null;
        };

        this.generateSimulationCode = function (statementsCaseId, nextStatementsCaseId, nextFreeId) {
            var simulationCode = "";
            var thenStatementsCaseId = nextFreeId.value++;
            var elseStatementsCaseId = nextFreeId.value++;

            simulationCode += "case " + statementsCaseId + ":";
            simulationCode += "if (" + this.replaceVariableAccess(_condition) + ") {";

            if (blockDiagramEditorGlobals.configurations.skipLoopChecks) {
                simulationCode += "return simulation(" + thenStatementsCaseId + ", outParameters, parameters);";
            }
            else {
                simulationCode += "return {";
                simulationCode += "caseId: " + thenStatementsCaseId + ",";
                simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).children("table").children("tbody").children().first().getPath() + "'";
                simulationCode += "};"
            }

            simulationCode += "}";

            if (_elseStatements) {
                simulationCode += "else {";

                if (blockDiagramEditorGlobals.configurations.skipLoopChecks) {
                    simulationCode += "return simulation(" + elseStatementsCaseId + ", outParameters, parameters);";
                }
                else {
                    simulationCode += "return {";
                    simulationCode += "caseId: " + elseStatementsCaseId + ",";
                    simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).children("table").children("tbody").children().first().getPath() + "'";
                    simulationCode += "};";
                }

                simulationCode += "}";
            }
            else {
                if (blockDiagramEditorGlobals.configurations.skipLoopChecks) {
                    simulationCode += "return simulation (" + nextStatementsCaseId + ", outParameters, parameters);";
                }
                else {
                    simulationCode += "return {";
                    simulationCode += "caseId: " + nextStatementsCaseId + ",";
                    simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).children("table").children("tbody").children().first().getPath() + "'";
                    simulationCode += "};";
                }
            }

            simulationCode += _thenStatements.generateSimulationCode(thenStatementsCaseId, nextStatementsCaseId, nextFreeId);

            if (_elseStatements) {
                simulationCode += _elseStatements.generateSimulationCode(elseStatementsCaseId, nextStatementsCaseId, nextFreeId);
            }

            return simulationCode;
        };

        this.generateCCode = function () {
            var generatedCode = "if(" + this.convertToCConditionalExpression(this.replaceIntegerOutParameterAccess(_condition)) + "){" + _thenStatements.generateCCode() + "}";

            if (_elseStatements) {
                generatedCode += "else {" + _elseStatements.generateCCode() + "}";
            }

            return generatedCode;
        };

        this.toSerializableObject = function () {
            var ifStatementSerializable = new IfStatementSerializable();

            ifStatementSerializable.thenStatements = _thenStatements.toSerializableObject();

            if (_elseStatements) {
                ifStatementSerializable.elseStatements = _elseStatements.toSerializableObject();
            }

            ifStatementSerializable.condition = _condition;
            ifStatementSerializable.comment = this.getComment();

            return ifStatementSerializable;
        };

        (function () {  // initialize function
            var statementsBlocks = $(this.getDomElement()).find(".statements");

            _thenStatements = new Statements(statementsBlocks[0], Statement.useGiven, this.getRootElement());
            $(statementsBlocks[0]).data(blockDiagramEditorGlobals.codebehindObjectName, _thenStatements);

            this.addElseBlock();
        }).call(this);
    }


    function WhileStatement(statement, insertionMode, rootElement) {
        var _htmlSkeleton = '                           \
    <div class="whileStatement">                        \
        <div>                                           \
            <span style="bigRightSpaced">' + blockDiagramEditorGlobals.languagePack["while"] + '</span><input type="text" onchange="$(this).closest(\'.whileStatement\').data(\'codebehindObject\').conditionChanged(this.value);" /><span class=\'comment\'></span>   \
        </div>                                          \
        <div class="statements"></div>                  \
    </div>';
        var _loopStatements;
        var _condition;

        InputReceivableStatement.call(this, statement, insertionMode, _htmlSkeleton, rootElement, [30]);
        CommentAttachableStatement.call(this, $(this.getDomElement()).find(".comment"));

        this.conditionChanged = function (newValue) {
            _condition = newValue;
        };

        this.generateSimulationCode = function (statementsCaseId, nextStatementsCaseId, nextFreeId) {
            var simulationCode = "";
            var loopStatementsCaseId = nextFreeId.value++;

            simulationCode += "case " + statementsCaseId + ":";
            simulationCode += "if (" + this.replaceVariableAccess(_condition) + ") {";

            if (blockDiagramEditorGlobals.configurations.skipLoopChecks) {
                simulationCode += "return simulation(" + loopStatementsCaseId + ", outParameters, parameters);";
            }
            else {
                simulationCode += "return {";
                simulationCode += "caseId: " + loopStatementsCaseId + ",";
                simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).children().first().getPath() + "'";
                simulationCode += "};";
            }

            simulationCode += "}";
            simulationCode += "else {";

            if (blockDiagramEditorGlobals.configurations.skipLoopChecks) {
                simulationCode += "return simulation(" + nextStatementsCaseId + ", outParameters, parameters);";
            }
            else {
                simulationCode += "return {";
                simulationCode += "caseId: " + nextStatementsCaseId + ",";
                simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).children().first().getPath() + "'";
                simulationCode += "};";
            }

            simulationCode += "}";

            simulationCode += _loopStatements.generateSimulationCode(loopStatementsCaseId, statementsCaseId, nextFreeId);

            return simulationCode;
        };

        this.generateCCode = function () {
            return "while (" + this.convertToCConditionalExpression(this.replaceIntegerOutParameterAccess(_condition)) + ") {" + _loopStatements.generateCCode() + "}";
        };

        this.toSerializableObject = function () {
            var whileStatementSerializable = new WhileStatementSerializable();

            whileStatementSerializable.loopStatements = _loopStatements.toSerializableObject();
            whileStatementSerializable.condition = _condition;
            whileStatementSerializable.comment = this.getComment();

            return whileStatementSerializable;
        };

        (function () {  // initialize function
            var statementsBlocks = $(this.getDomElement()).find(".statements");

            _loopStatements = new Statements(statementsBlocks[0], Statement.useGiven, this.getRootElement());
            $(statementsBlocks[0]).data(blockDiagramEditorGlobals.codebehindObjectName, _loopStatements);
        }).call(this);
    }


    function DoWhileStatement(statement, insertionMode, rootElement) {
        var _htmlSkeleton = '                           \
    <div class="doWhileStatement">                      \
        <span>' + blockDiagramEditorGlobals.languagePack["repeat"] + '</span>                               \
        <div class="statements"></div>                  \
        <div class="statementBorderHelper"><span>' + blockDiagramEditorGlobals.languagePack["until"] + '</span><input type="text" onchange="$(this).closest(\'.doWhileStatement\').data(\'codebehindObject\').conditionChanged(this.value);" /><span class=\'comment\'></span></div>           \
    </div>';
        var _loopStatements;
        var _condition;

        InputReceivableStatement.call(this, statement, insertionMode, _htmlSkeleton, rootElement, [30]);
        CommentAttachableStatement.call(this, $(this.getDomElement()).find(".comment"));

        this.conditionChanged = function (newValue) {
            _condition = newValue;
        };

        this.generateSimulationCode = function (statementsCaseId, nextStatementsCaseId, nextFreeId) {
            var simulationCode = "";
            var loopStatementsCaseId = statementsCaseId;
            var conditionCheckCaseId = nextFreeId.value++;

            simulationCode += "case " + conditionCheckCaseId + ":";
            simulationCode += "if (!(" + this.replaceVariableAccess(_condition) + ")) {";

            if (blockDiagramEditorGlobals.configurations.skipLoopChecks) {
                simulationCode += "return simulation(" + loopStatementsCaseId + ", outParameters, parameters);";
            }
            else {
                simulationCode += "return {";
                simulationCode += "caseId: " + loopStatementsCaseId + ",";
                simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).children().last().getPath() + "'";
                simulationCode += "};";
            }

            simulationCode += "}";
            simulationCode += "else {";

            if (blockDiagramEditorGlobals.configurations.skipLoopChecks) {
                simulationCode += "return simulation(" + nextStatementsCaseId + ", outParameters, parameters);";
            }
            else {
                simulationCode += "return {";
                simulationCode += "caseId: " + nextStatementsCaseId + ",";
                simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).children().last().getPath() + "'";
                simulationCode += "};"
            }

            simulationCode += "}";

            simulationCode += _loopStatements.generateSimulationCode(loopStatementsCaseId, conditionCheckCaseId, nextFreeId);

            return simulationCode;
        };

        this.generateCCode = function () {
            return "do {" + _loopStatements.generateCCode() + "} while (!(" + this.convertToCConditionalExpression(this.replaceIntegerOutParameterAccess(_condition)) + "));";
        };

        this.toSerializableObject = function () {
            var doWhileStatementSerializable = new DoWhileStatementSerializable();

            doWhileStatementSerializable.loopStatements = _loopStatements.toSerializableObject();
            doWhileStatementSerializable.condition = _condition;
            doWhileStatementSerializable.comment = this.getComment();

            return doWhileStatementSerializable;
        };

        (function () {  // initialize function
            var statementsBlocks = $(this.getDomElement()).find(".statements");

            _loopStatements = new Statements(statementsBlocks[0], Statement.useGiven, this.getRootElement());
            $(statementsBlocks[0]).data(blockDiagramEditorGlobals.codebehindObjectName, _loopStatements);
        }).call(this);
    }


    function DeclarationStatement(statement, insertionMode, rootElement) {
        var _htmlSkeleton = '                                    \
    <div class="declarationStatement">                       \
        <div class="statementBorderHelper"><input type="text" onchange="$(this).closest(\'.declarationStatement\').data(\'codebehindObject\').variableTypeChanged(this.value);" /><span>:</span><input type="text" onchange="$(this).closest(\'.declarationStatement\').data(\'codebehindObject\').variableNameChanged(this.value);" /><span class=\'hiddenWhenArray\'>=</span><input type="text" class=\'hiddenWhenArray\' onchange="$(this).closest(\'.declarationStatement\').data(\'codebehindObject\').initializationValueChanged(this.value);" /><span class=\'hiddenWhenNotArray\'>[</span><input type="text" onchange="$(this).closest(\'.declarationStatement\').data(\'codebehindObject\').arrayLengthChanged(this.value);" class=\'hiddenWhenNotArray\' /><span class=\'hiddenWhenNotArray\'>]</span><span class=\'comment\'></span></div>                      \
    </div>';
        var _initializationValue;
        var _variableName;
        var _variableType;
        var _arrayLength;
        var _isArray = false;

        InputReceivableStatement.call(this, statement, insertionMode, _htmlSkeleton, rootElement, [10, 10, 10, 10]);
        CommentAttachableStatement.call(this, $(this.getDomElement()).find(".comment"));

        this.getVariableName = function() {
            return _variableName;
        };

        this.getVariableType = function() {
            return _variableType;
        };

        this.refreshVariableFieldsOfDiagram = function () {
            if ($(this.getRootElement()).find(".forStatement, .assignmentStatement, .switchStatement, .inputStatement, .outputStatement, .functionCallStatement").length) {
                $(this.getRootElement()).find(".forStatement, .assignmentStatement, .switchStatement, .inputStatement, .outputStatement, .functionCallStatement").each(function (index, element) {
                    $(element).data(blockDiagramEditorGlobals.codebehindObjectName).prepareVariableFields();
                });
            }
        };

        this.arrayLengthChanged = function (arrayLength) {
            _arrayLength = arrayLength;
        };

        this.variableTypeChanged = function (variableType) {
            _variableType = variableType;

            if (_variableType.charAt(_variableType.length - 1) === "]") {    // array type
                _isArray = true;

                $(this.getDomElement()).find(".hiddenWhenArray").css("display", "none");
                $(this.getDomElement()).find(".hiddenWhenNotArray").css("display", "inline");
            }
            else {
                _isArray = false;

                $(this.getDomElement()).find(".hiddenWhenNotArray").css("display", "none");
                $(this.getDomElement()).find(".hiddenWhenArray").css("display", "inline");

                $(this.getDomElement()).find("input").last()[0].value = "0";  // mark it as non-array for generateLocalVariables() in simulation.js

                var initializationInputField = $(this.getDomElement()).find("input.hiddenWhenArray").first();
                switch (_variableType) {
                    case blockDiagramEditorGlobals.languagePack["integer"]:
                        initializationInputField[0].value = 0;
                        initializationInputField.trigger("change");
                        break;

                    case blockDiagramEditorGlobals.languagePack["string"]:
                        initializationInputField[0].value = "\"\"";
                        initializationInputField.trigger("change");
                        break;
                }
            }
        };

        this.variableNameChanged = function (variableName) {
            _variableName = variableName;
        };

        this.initializationValueChanged = function (initializationValue) {
            _initializationValue = initializationValue;
        };

        this.generateSimulationCode = function (statementsCaseId, nextStatementsCaseId, nextFreeId) {
            var simulationCode = "";

            simulationCode += "case " + statementsCaseId + ":";

            if (_variableType === blockDiagramEditorGlobals.languagePack["integer"]) {
                simulationCode += this.replaceVariableAccess(_variableName) + " = Number(" + this.replaceVariableAccess(_initializationValue) + ");";
                simulationCode += "if (isNaN(" + this.replaceVariableAccess(_variableName) + ")) { ";
                simulationCode += "throw new TypeError('" + _initializationValue + " is not a number');";
                simulationCode += "}";
                simulationCode += "localVariables['" + _variableName + "'].address = decimalToFixedWidthHex(nextFreeAddress++ * 8, 4);";
            }
            else if (_variableType === blockDiagramEditorGlobals.languagePack["string"]) {
                simulationCode += this.replaceVariableAccess(_variableName) + " = (" + this.replaceVariableAccess(_initializationValue) + ").toString();";
                simulationCode += "localVariables['" + _variableName + "'].address = decimalToFixedWidthHex(nextFreeAddress++ * 8, 4);";
            }
            else if (_isArray) {
                var primitiveType = _variableType.substr(0, _variableType.length - 2);
                var primitiveTypeInitializer;

                if (primitiveType === blockDiagramEditorGlobals.languagePack["integer"]) {
                    primitiveTypeInitializer = 0;
                }
                else if (primitiveType === blockDiagramEditorGlobals.languagePack["string"]) {
                    primitiveTypeInitializer = "\"\"";
                }

                simulationCode += this.replaceVariableAccess(_variableName) + " = new Array(" + this.replaceVariableAccess(_arrayLength) + ");";
                simulationCode += "localVariables['" + _variableName + "'].address = decimalToFixedWidthHex(((nextFreeAddress = nextFreeAddress + " + this.replaceVariableAccess(_arrayLength) + ") - " + this.replaceVariableAccess(_arrayLength) + ") * 8, 4);";
                simulationCode += "for (var i = 0; i < " + this.replaceVariableAccess(_arrayLength) + "; i++) {";
                simulationCode += this.replaceVariableAccess(_variableName) + "[i] = " + primitiveTypeInitializer + ";";
                simulationCode += "}";
            }
            else {  // invalid type
                simulationCode += "throw new Error('" + _variableType + " is not a valid type!');";
            }

            simulationCode += "return {";
            simulationCode += "caseId: " + nextStatementsCaseId + ",";
            simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).getPath() + "'";
            simulationCode += "};";

            return simulationCode;
        };

        this.generateCCode = function () {
            var generatedCode;

            if (_variableType === blockDiagramEditorGlobals.languagePack["integer"]) {
                generatedCode = "int " + _variableName + " = " + this.replaceIntegerOutParameterAccess(_initializationValue) + ";";
            }
            else if (_variableType === blockDiagramEditorGlobals.languagePack["string"]) {
                generatedCode = "char " + _variableName + "[MAX_STRING_SIZE] = " + _initializationValue + ";";
            }
            else if (_variableType === blockDiagramEditorGlobals.languagePack["integer"] + "[]") {
                generatedCode = "int " + _variableName + "[" + this.replaceIntegerOutParameterAccess(_arrayLength) + "];";
                generatedCode += "int " + _variableName + "Size = " + _arrayLength + ";";
            }
            else if (_variableType === blockDiagramEditorGlobals.languagePack["string"] + "[]") {
                generatedCode = "char " + _variableName + "[" + this.replaceIntegerOutParameterAccess(_arrayLength) + "][MAX_STRING_SIZE];";
                generatedCode += "int " + _variableName + "Size = " + _arrayLength + ";";
            }

            return generatedCode;
        };

        this.toSerializableObject = function () {
            var declarationStatementSerializable;

            if ($(this.getDomElement()).hasClass("functionResultDeclaration")) {    // must not be stored because it will be added automatically by the application
                declarationStatementSerializable = null;
            }
            else {
                declarationStatementSerializable = new DeclarationStatementSerializable();

                switch (_variableType) {
                    case blockDiagramEditorGlobals.languagePack["integer"]:
                        declarationStatementSerializable.variableType = "integer";
                        break;

                    case blockDiagramEditorGlobals.languagePack["string"]:
                        declarationStatementSerializable.variableType = "string";
                        break;

                    case blockDiagramEditorGlobals.languagePack["integer"] + "[]":
                        declarationStatementSerializable.variableType = "integer[]";
                        break;

                    case blockDiagramEditorGlobals.languagePack["string"] + "[]":
                        declarationStatementSerializable.variableType = "string[]";
                        break;
                }

                declarationStatementSerializable.variableName = _variableName;
                declarationStatementSerializable.initializationValue = _initializationValue;
                declarationStatementSerializable.arrayLength = _arrayLength;
                declarationStatementSerializable.isArray = _isArray;
                declarationStatementSerializable.comment = this.getComment();
            }

            return declarationStatementSerializable;
        };

        (function () {   // initialize function
            $(this.getDomElement()).change(function () {
                $(this).data(blockDiagramEditorGlobals.codebehindObjectName).refreshVariableFieldsOfDiagram();
            });

            $(this.getDomElement()).find("input:first-child").autocomplete({
                autoFocus: true,
                source: [blockDiagramEditorGlobals.languagePack["string"], blockDiagramEditorGlobals.languagePack["integer"], blockDiagramEditorGlobals.languagePack["string"] + "[]", blockDiagramEditorGlobals.languagePack["integer"] + "[]"],
                delay: 0,
                minLength: 0,
                select: function (event, ui) {
                    event.target.value = ui.item.value; // update textfield (else it gets updated after the event -> triggering "update" changes nothing)
                    $(event.target).trigger("change");
                    $.tabNext();
                }
            });

            this.refreshVariableFieldsOfDiagram();

            $(this.getDomElement()).find(".hiddenWhenNotArray").css("display", "none");

            $(this.getDomElement()).find("input").last()[0].value = "0";  // mark it as non-array for generateLocalVariables() in simulation.js
        }).call(this);
    }


    function VariableSelectableStatement(statement, insertionMode, htmlSkeleton, rootElement, minInputWidthValues) {
        InputReceivableStatement.call(this, statement, insertionMode, htmlSkeleton, rootElement, minInputWidthValues);

        this.prepareVariableFields = function () {
            var id;

            $(this.getDomElement()).uniqueId();
            id = $(this.getDomElement()).attr("id");
            $(this.getDomElement()).find("input.variableInput").not("#" + id + " .statements *").autocomplete({
                autoFocus: true,
                source: this.getDeclaredVariables(),
                delay: 0,
                minLength: 0,
                select: function (event, ui) {
                    event.target.value = ui.item.value; // update textfield (else it gets updated after the event -> triggering "update" changes nothing)
                    $(event.target).trigger("change");
                    $.tabNext();
                }
            });
            $(this.getDomElement()).removeUniqueId();
        };

        (function () {  // initialize function
            this.prepareVariableFields();
        }).call(this);
    }


    function FunctionCallStatement(statement, insertionMode, rootElement) {
        var _htmlSkeleton = '\
    <div class="functionCallStatement">\
        <div class="statementBorderHelper"><input type="text" onchange="$(this).closest(\'.functionCallStatement\').data(\'codebehindObject\').functionNameChanged(this.value);" /><span>(</span><span>)</span><span class=\'comment\'></span></div>\
    </div>';
        var _functionParameters = [];
        var _underlyingFunctionPropertyHolder;
        var _variableName;

        VariableSelectableStatement.call(this, statement, insertionMode, _htmlSkeleton, rootElement, [10]);
        CommentAttachableStatement.call(this, $(this.getDomElement()).find(".comment"));

        this.functionNameChanged = function (functionName) {
            blockDiagramEditorGlobals.FunctionPropertyHolder.functions.some(function (fn) {
                if (fn.getName() === functionName) {
                    _underlyingFunctionPropertyHolder = fn;

                    return true;
                }

                return false;
            });

            if (_underlyingFunctionPropertyHolder === undefined) {
                return;
            }

            var domElement = $(this.getDomElement());
            var parameterSkeleton = '<input type="text" class="variableInput" onchange="$(this).data(\'codebehindObject\').value = this.value;" />';


            if (domElement.find("input.variableInput:first-child").length > 0) {
                domElement.find("span").first().remove();
                domElement.find("input").first().remove();
            }

            domElement.find("span").first().nextUntil(domElement.find("span:contains(')')"), "input, span").remove();

            _functionParameters = [];
            for (var i = 0; i < _underlyingFunctionPropertyHolder.getParameters().length; i++) {
                if (i < _underlyingFunctionPropertyHolder.getParameters().length - 1) {
                    domElement.find("span:contains(')')").last().before(parameterSkeleton).before("<span>,</span>");
                    _functionParameters.push({});
                    domElement.find("span:contains(')')").last().prev().prev().data(blockDiagramEditorGlobals.codebehindObjectName, _functionParameters[i]);
                }
                else {
                    domElement.find("span:contains(')')").last().before(parameterSkeleton);
                    _functionParameters.push({});
                    domElement.find("span:contains(')')").last().prev().data(blockDiagramEditorGlobals.codebehindObjectName, _functionParameters[i]);
                }
            }

            var me = this;
            domElement.find("input:first-child").nextAll("input").each(function (index, inputField) {
                me.prepareAutogrowInputField(inputField, 10);
            });

            if (_underlyingFunctionPropertyHolder.getReturnType() !== "void") {
                domElement.find(".statementBorderHelper").prepend('<input type="text" class="variableInput" onchange="$(this).closest(\'.functionCallStatement\').data(\'codebehindObject\').variableNameChanged(this.value);" /><span>=</span>');

                this.prepareAutogrowInputField(domElement.find(".statementBorderHelper").children().first(), 10);
            }
            else {
                _variableName = undefined;
            }

            this.prepareVariableFields();
        };

        this.variableNameChanged = function (variableName) {
            _variableName = variableName;
        };

        this.prepareFunctionField = function () {
            $(this.getDomElement()).find("input:first-child").autocomplete({
                autoFocus: true,
                source: function(request, response) {
                    var searchExpression = new RegExp($.ui.autocomplete.escapeRegex(request.term));

                    response(blockDiagramEditorGlobals.FunctionPropertyHolder.functions.map(function(availableFunction) {
                        return availableFunction.getName();
                    }).filter(function(functionName) {
                        return functionName.match(searchExpression);
                    }));
                },
                delay: 0,
                minLength: 0,
                select: function (event, ui) {
                    event.target.value = ui.item.value; // update textfield (else it gets updated after the event -> triggering "change" changes nothing)
                    $(event.target).trigger("change");
                    $.tabNext();
                }
            });
        };

        this.generateSimulationCode = function (statementsCaseId, nextStatementsCaseId, nextFreeId) {
            var simulationCode = "";
            var returnValueAssignmentCaseId = nextFreeId.value++;
            var parameterNames = [];

            simulationCode += "case " + statementsCaseId + ":";
            simulationCode += "return {";
            simulationCode += "functionName: '" + _underlyingFunctionPropertyHolder.getName() + "',";

            _functionParameters.forEach(function (parameter, index) {
                if (_underlyingFunctionPropertyHolder.getParameters()[index].getOnlyIn() === true) {
                    parameterNames.push(this.replaceVariableAccess(parameter.value));
                }
                else {
                    parameterNames.push("localVariables[\"" + parameter.value + "\"]");
                }
            }, this);

            simulationCode += "parameters: [" + parameterNames.join() + "],";
            simulationCode += "caseId: " + returnValueAssignmentCaseId + ",";
            simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).getPath() + "'";
            simulationCode += "};";

            simulationCode += "case " + returnValueAssignmentCaseId + ":";

            if (_underlyingFunctionPropertyHolder.getReturnType() !== "void") {  // -> function call (not procedure call) -> return value must be assigned
                simulationCode += this.replaceVariableAccess(_variableName) + " = returnValue;";
            }

            simulationCode += "return {";
            simulationCode += "caseId: " + nextStatementsCaseId + ",";
            simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).getPath() + "'";
            simulationCode += "};";

            return simulationCode;
        };

        this.generateCCode = function () {
            var generatedCode;

            if (_underlyingFunctionPropertyHolder) {
                generatedCode = _underlyingFunctionPropertyHolder.getName() + "(";

                let parametersStrings = _functionParameters.map((parameter, index) => {
                    var parameterType = _underlyingFunctionPropertyHolder.getParameters()[index].getType();
                    var parameterOnlyIn = _underlyingFunctionPropertyHolder.getParameters()[index].getOnlyIn();
                    let parameterString = "";
                    if (parameterType === blockDiagramEditorGlobals.languagePack["string"]) {
                        parameterString += parameter.value;
                    }
                    else if (parameterType.charAt(parameterType.length - 1) === "]") {
                        parameterString += parameter.value + "," + parameter.value + "Size";
                    }
                    else if (parameterType === blockDiagramEditorGlobals.languagePack["integer"]) {
                        if (parameterOnlyIn === true) {
                            parameterString += this.replaceIntegerOutParameterAccess(parameter.value);
                        }
                        else {
                            parameterString += "&" + this.replaceIntegerOutParameterAccess(parameter.value);
                        }
                    }
                    return parameterString;
                }, this);

                generatedCode += parametersStrings.join(",") + ");";

                if (_variableName) {
                    generatedCode = _variableName + " = " + generatedCode;
                }

                return generatedCode;
            }
        };

        this.toSerializableObject = function () {
            var functionCallStatementSerializable = new FunctionCallStatementSerializable();

            functionCallStatementSerializable.variableName = _variableName;
            functionCallStatementSerializable.functionName = _underlyingFunctionPropertyHolder?.getName();
            functionCallStatementSerializable.parameters = _functionParameters;
            functionCallStatementSerializable.comment = this.getComment();

            return functionCallStatementSerializable;
        };

        (function () {
            this.prepareFunctionField();
        }).call(this);
    }


    function ForStatement(statement, insertionMode, rootElement) {
        var _htmlSkeleton = '                                                                                        \
    <div class="forStatement">                                                                          \
        <div class="statementBorderHelper"><span class="bigRightSpaced">' + blockDiagramEditorGlobals.languagePack["from"] + '</span><span class="rightSpaced"><input class="variableInput" type="text" onchange="$(this).closest(\'.forStatement\').data(\'codebehindObject\').counterNameChanged(this.value);" /><span class="rightSpaced">=</span><input type="text" onchange="$(this).closest(\'.forStatement\').data(\'codebehindObject\').fromValueChanged(this.value);" /></span><span class="rightSpaced">' + blockDiagramEditorGlobals.languagePack["to"] + '</span><input class="rightSpaced" type="text" onchange="$(this).closest(\'.forStatement\').data(\'codebehindObject\').toValueChanged(this.value);" /><span class="rightSpaced">' + blockDiagramEditorGlobals.languagePack["step"] + '</span><input type="text" value="+1" onchange="$(this).closest(\'.forStatement\').data(\'codebehindObject\').counterShiftChanged(this.value);" /><span class=\'comment\'></span></div>    \
        <div class="statements"></div>                                                                  \
    </div>';
        var _loopStatements;
        var _counterName;
        var _fromValue;
        var _toValue;
        var _counterShift;

        VariableSelectableStatement.call(this, statement, insertionMode, _htmlSkeleton, rootElement, [5, 5, 5, 5]);
        CommentAttachableStatement.call(this, $(this.getDomElement()).find(".comment"));

        this.counterNameChanged = function (counterName) {
            _counterName = counterName;
        };

        this.fromValueChanged = function (fromValue) {
            _fromValue = fromValue;
        };

        this.toValueChanged = function (toValue) {
            _toValue = toValue;
        };

        this.counterShiftChanged = function (counterShift) {
            _counterShift = counterShift;
        };

        this.generateSimulationCode = function (statementsCaseId, nextStatementsCaseId, nextFreeId) {
            var simulationCode = "";
            var conditionCheckCaseId = nextFreeId.value++;
            var loopStatementsCaseId = nextFreeId.value++;
            var counterShiftCaseId = nextFreeId.value++;

            simulationCode += "case " + statementsCaseId + ":";
            simulationCode += this.replaceVariableAccess(_counterName) + "=" + this.replaceVariableAccess(_fromValue) + ";";

            if (blockDiagramEditorGlobals.configurations.skipLoopChecks) {
                simulationCode += "return simulation(" + conditionCheckCaseId + ", outParameters, parameters);";
            }
            else {
                simulationCode += "return {";
                simulationCode += "caseId: " + conditionCheckCaseId + ",";
                simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).children().first().children().first().next().getPath() + "'";
                simulationCode += "};";
            }

            simulationCode += "case " + conditionCheckCaseId + ":";
            simulationCode += "if (" + this.replaceVariableAccess(_counterName) + "<=" + this.replaceVariableAccess(_toValue) + ") {";

            if (blockDiagramEditorGlobals.configurations.skipLoopChecks) {
                simulationCode += "return simulation(" + loopStatementsCaseId + ", outParameters, parameters);";
            }
            else {
                simulationCode += "return {";
                simulationCode += "caseId: " + loopStatementsCaseId + ",";
                simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).children().first().children().first().next().next().next().getPath() + "'";
                simulationCode += "};";
            }

            simulationCode += "}";
            simulationCode += "else {";

            if (blockDiagramEditorGlobals.configurations.skipLoopChecks) {
                simulationCode += "return simulation(" + nextStatementsCaseId + ", outParameters, parameters);";
            }
            else {
                simulationCode += "return {";
                simulationCode += "caseId: " + nextStatementsCaseId + ",";
                simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).children().first().children().first().next().next().next().getPath() + "'";
                simulationCode += "};";
            }

            simulationCode += "}";

            simulationCode += "case " + counterShiftCaseId + ":";
            simulationCode += this.replaceVariableAccess(_counterName) + "+=" + this.replaceVariableAccess(_counterShift) + ";";

            if (blockDiagramEditorGlobals.configurations.skipLoopChecks) {
                simulationCode += "return simulation(" + conditionCheckCaseId + ", outParameters, parameters);";
            }
            else {
                simulationCode += "return {";
                simulationCode += "caseId: " + conditionCheckCaseId + ",";
                simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).children().first().children().first().next().next().next().next().next().getPath() + "'";
                simulationCode += "};";
            }

            simulationCode += _loopStatements.generateSimulationCode(loopStatementsCaseId, counterShiftCaseId, nextFreeId);

            return simulationCode;
        };

        this.generateCCode = function () {
            return "for (" + this.replaceIntegerOutParameterAccess(_counterName) + "=" + this.replaceIntegerOutParameterAccess(_fromValue) + "; " + this.replaceIntegerOutParameterAccess(_counterName) + "<=" + this.replaceIntegerOutParameterAccess(_toValue) + ";" + this.replaceIntegerOutParameterAccess(_counterName) + "+=" + this.replaceIntegerOutParameterAccess(_counterShift) + ") {" + _loopStatements.generateCCode() + "}";
        };

        this.toSerializableObject = function () {
            var forStatementSerializable = new ForStatementSerializable();

            forStatementSerializable.counterName = _counterName;
            forStatementSerializable.fromValue = _fromValue;
            forStatementSerializable.toValue = _toValue;
            forStatementSerializable.counterShift = _counterShift;
            forStatementSerializable.loopStatements = _loopStatements.toSerializableObject();
            forStatementSerializable.comment = this.getComment();

            return forStatementSerializable;
        };

        (function () {  // initialize function
            var statementsBlocks = $(this.getDomElement()).find(".statements");

            _loopStatements = new Statements(statementsBlocks[0], Statement.useGiven, this.getRootElement());
            $(statementsBlocks[0]).data(blockDiagramEditorGlobals.codebehindObjectName, _loopStatements);

            $(this.getDomElement()).children().first().find("input").last().change(function () {
                if (this.value === "+1") {
                    this.style.color = "#999999";
                }
                else {
                    this.style.color = "#000000";
                }
            });
            $(this.getDomElement()).children().first().find("input").last().trigger("change");
        }).call(this);
    }


    function AssignmentStatement(statement, insertionMode, rootElement) {
        var _htmlSkeleton = '                                    \
    <div class="assignmentStatement">                        \
        <div class="statementBorderHelper"><input type="text" onchange="$(this).closest(\'.assignmentStatement\').data(\'codebehindObject\').variableNameChanged(this.value);" class="variableInput" /><span>=</span><input type="text" onchange="$(this).closest(\'.assignmentStatement\').data(\'codebehindObject\').assignmentValueChanged(this.value);" /><span class=\'comment\'></span></div>                       \
    </div>';
        var _variableName;
        var _assignmentValue;

        VariableSelectableStatement.call(this, statement, insertionMode, _htmlSkeleton, rootElement, [10, 30]);
        CommentAttachableStatement.call(this, $(this.getDomElement()).find(".comment"));

        this.variableNameChanged = function (variableName) {
            _variableName = variableName;
        };

        this.assignmentValueChanged = function (assignmentValue) {
            _assignmentValue = assignmentValue;
        };

        this.generateSimulationCode = function (statementsCaseId, nextStatementsCaseId, nextFreeId) {
            var simulationCode = "";

            simulationCode += "case " + statementsCaseId + ":";
            simulationCode += "if (typeof " + this.replaceVariableAccess(_variableName) + " === 'number') {";
            simulationCode += this.replaceVariableAccess(_variableName) + " = Number(" + this.replaceVariableAccess(_assignmentValue) + ");";
            simulationCode += "if (isNaN(" + this.replaceVariableAccess(_variableName) + ")) { ";
            simulationCode += "throw new TypeError('" + _assignmentValue + " is not a number');";
            simulationCode += "}";
            simulationCode += "}";
            simulationCode += "else {";
            simulationCode += this.replaceVariableAccess(_variableName) + " = (" + this.replaceVariableAccess(_assignmentValue) + ").toString();";
            simulationCode += "}";
            simulationCode += "return {";
            simulationCode += "caseId: " + nextStatementsCaseId + ",";
            simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).getPath() + "'";
            simulationCode += "};";

            return simulationCode;
        };

        this.generateCCode = function () {
            var variableType = this.getVariableType(_variableName.split("[")[0]).split("[")[0];
            var generatedCode = "";

            if (variableType === blockDiagramEditorGlobals.languagePack["integer"]) {
                generatedCode += this.replaceIntegerOutParameterAccess(_variableName) + " = " + this.replaceIntegerOutParameterAccess(_assignmentValue) + ";";
            }
            else if (variableType === blockDiagramEditorGlobals.languagePack["string"]) {
                var printfInformation = this.getPrintfParametersForStringConcatenation(_assignmentValue);

                generatedCode += "sprintf(" + _variableName + ",\"" + printfInformation.formatString + "\"," + printfInformation.additionalArgumentList + ");";
            }

            return generatedCode;
        };

        this.toSerializableObject = function () {
            var assignmentStatementSerializable = new AssignmentStatementSerializable();

            assignmentStatementSerializable.variableName = _variableName;
            assignmentStatementSerializable.assignmentValue = _assignmentValue;
            assignmentStatementSerializable.comment = this.getComment();

            return assignmentStatementSerializable;
        };
    }


    function SwitchStatement(statement, insertionMode, rootElement) {
        var _caseSkeleton = '<tr><td><input type="text" value="?" onchange=\"$(this).closest(\'.switchStatement\').data(\'codebehindObject\').caseValueChanged(this.value, $(this).parent().siblings().children().filter(\'.statements\').data(\'codebehindObject\'));" /></td><td><div class="statements"></div></td></tr>';
        var _elseSkeleton = '<tr><td><span>' + blockDiagramEditorGlobals.languagePack["else"] + '</span></td><td><div class="statements"></div></td></tr>';
        var _htmlSkeleton = '                                                                                \
    <div class="switchStatement">                                                               \
        <table>                                                                                 \
            <thead>                                                                             \
                <tr><th>' + blockDiagramEditorGlobals.languagePack["switch"] + '</th><th><input type="text" onchange="$(this).closest(\'.switchStatement\').data(\'codebehindObject\').variableNameChanged(this.value);" class="variableInput" /><span class=\'comment\'></span></th></tr>                           \
            </thead>                                                                            \
            <tbody>                                                                             \
            </tbody>\
            <tfoot>\
            </tfoot>\
        </table>  \
    </div>';
        var _casesStatements = [];
        var _elseStatements;
        var _variableName;

        VariableSelectableStatement.call(this, statement, insertionMode, _htmlSkeleton, rootElement, [10, 5]);
        CommentAttachableStatement.call(this, $(this.getDomElement()).find(".comment"));

        this.variableNameChanged = function (variableName) {
            _variableName = variableName;
        };

        this.caseValueChanged = function (caseValue, caseStatements) {
            var position = _casesStatements.findIndex(function (statements) {
                return statements.caseStatements === caseStatements;
            });

            _casesStatements[position].caseValue = caseValue;
        };

        this.addCaseBlock = function () {
            var newCaseBlock = $(_caseSkeleton).appendTo($(this.getDomElement()).children().children().filter("tbody"));
            var newCaseStatement = {
                caseValue: null,
                caseStatements: new Statements(newCaseBlock.find(".statements"), Statement.useGiven, this.getRootElement())
            };

            _casesStatements.push(newCaseStatement);

            newCaseBlock.find(".statements").data(blockDiagramEditorGlobals.codebehindObjectName, newCaseStatement.caseStatements);
            this.prepareAutogrowInputField(newCaseBlock.children().children().filter("input"), 5);

            newCaseBlock.find("input").trigger("change");

            return newCaseBlock;
        };

        this.removeCaseBlock = function (caseStatements) {
            var positionToRemove = _casesStatements.findIndex(function (statements) {
                return statements.caseStatements === caseStatements;
            });

            _casesStatements.splice(positionToRemove, 1);

            $(caseStatements.getDomElement()).closest("tr").remove();
        };

        this.addElseBlock = function () {
            var elseBlock = $(_elseSkeleton).appendTo($(this.getDomElement()).children().children().filter("tfoot"));

            _elseStatements = new Statements(elseBlock.find(".statements"), Statement.useGiven, this.getRootElement());
            elseBlock.find(".statements").data(blockDiagramEditorGlobals.codebehindObjectName, _elseStatements);
            this.prepareAutogrowInputField(elseBlock.children().children().filter("input"), 5);

            return elseBlock;
        };

        this.removeElseBlock = function () {
            $(_elseStatements.getDomElement()).closest("tr").remove();

            _elseStatements = null;
        };

        this.generateSimulationCode = function (statementsCaseId, nextStatementsCaseId, nextFreeId) {
            var simulationCode = "";
            var caseStatementsCaseIds = [];
            var defaultCaseId = nextFreeId.value++;
            var caseId;
            var i;

            simulationCode += "case " + statementsCaseId + ":";
            simulationCode += "switch (" + this.replaceVariableAccess(_variableName) + ") {";

            for (i = 0; i < _casesStatements.length; i++) {
                caseId = nextFreeId.value++;

                simulationCode += "case " + this.replaceVariableAccess(_casesStatements[i].caseValue) + ":";

                if (blockDiagramEditorGlobals.configurations.skipLoopChecks) {
                    simulationCode += "return simulation(" + caseId + ", outParameters, parameters);";
                }
                else {
                    simulationCode += "return {";
                    simulationCode += "caseId: " + caseId + ",";
                    simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).children("table").children("thead").children().first().getPath() + "'";
                    simulationCode += "};";
                }

                caseStatementsCaseIds.push(caseId);
            }

            if (_elseStatements) {
                simulationCode += "default:";

                if (blockDiagramEditorGlobals.configurations.skipLoopChecks) {
                    simulationCode += "return simulation(" + defaultCaseId + ", outParameters, parameters);";
                }
                else {
                    simulationCode += "return {";
                    simulationCode += "caseId: " + defaultCaseId + ",";
                    simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).children("table").children("thead").children().first().getPath() + "'";
                    simulationCode += "};";
                }
            }

            simulationCode += "}";

            simulationCode += "return {";
            simulationCode += "caseId: " + nextStatementsCaseId + ",";
            simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).children("table").children("thead").children().first().getPath() + "'";
            simulationCode += "};";

            for (i = 0; i < _casesStatements.length; i++) {
                simulationCode += _casesStatements[i].caseStatements.generateSimulationCode(caseStatementsCaseIds[i], nextStatementsCaseId, nextFreeId);
            }

            if (_elseStatements) {
                simulationCode += _elseStatements.generateSimulationCode(defaultCaseId, nextStatementsCaseId, nextFreeId);
            }

            return simulationCode;
        };

        this.generateCCode = function () {
            var generatedCode = "";

            if (this.getVariableType(_variableName.split("[")[0]).split("[")[0] === blockDiagramEditorGlobals.languagePack["string"]) {
                generatedCode += "/* switch with a string is not supported */";
            }

            generatedCode += "switch (" + this.replaceIntegerOutParameterAccess(_variableName) + ") {";

            _casesStatements.forEach(function (caseStatements) {
                generatedCode += "case " + caseStatements.caseValue + ":" + caseStatements.caseStatements.generateCCode() + "break;";
            });

            generatedCode += "}";

            return generatedCode;
        };

        this.toSerializableObject = function () {
            var switchStatementSerializable = new SwitchStatementSerializable();

            _casesStatements.forEach(function (caseStatements) {
                switchStatementSerializable.casesStatements.push({
                    caseValue: caseStatements.caseValue,
                    caseStatements: caseStatements.caseStatements.toSerializableObject()
                });
            });

            if (_elseStatements) {
                switchStatementSerializable.elseStatements = _elseStatements.toSerializableObject();
            }

            switchStatementSerializable.variableName = _variableName;
            switchStatementSerializable.comment = this.getComment();

            return switchStatementSerializable;
        };

        (function () {  // initialize function
            var statementsBlock = $(this.getDomElement()).find(".statements");
            var statementsCodebehind = new Statements(statementsBlock, Statement.useGiven, this.getRootElement());

            statementsBlock.data(blockDiagramEditorGlobals.codebehindObjectName, statementsCodebehind);

            this.addCaseBlock();
            this.addCaseBlock();
            this.addCaseBlock();

            this.addElseBlock();
        }).call(this);
    }


    function InputStatement(statement, insertionMode, rootElement) {
        var _htmlSkeleton = '                                    \
    <div class="inputStatement">                        \
        <div class="statementBorderHelper"><span>' + blockDiagramEditorGlobals.languagePack["input"] + '</span><span>:</span><input type="text" onchange="$(this).closest(\'.inputStatement\').data(\'codebehindObject\').promptChanged(this.value);" /><span>,</span><input type="text" onchange="$(this).closest(\'.inputStatement\').data(\'codebehindObject\').variableNameChanged(this.value);" class="variableInput" /><span class=\'comment\'></span></div>                       \
    </div>';
        var _variableName;
        var _prompt;

        VariableSelectableStatement.call(this, statement, insertionMode, _htmlSkeleton, rootElement, [10, 10]);
        CommentAttachableStatement.call(this, $(this.getDomElement()).find(".comment"));

        this.variableNameChanged = function (variableName) {
            _variableName = variableName;
        };

        this.promptChanged = function (prompt) {
            _prompt = prompt;
        };

        this.generateSimulationCode = function (statementsCaseId, nextStatementsCaseId, nextFreeId) {
            var simulationCode = "";

            simulationCode += "case " + statementsCaseId + ":";
            simulationCode += "return {";
            simulationCode += "caseId: " + nextStatementsCaseId + ",";
            simulationCode += "codeToExecute: function(){";
            simulationCode += "if (typeof " + this.replaceVariableAccess(_variableName) + " === 'number') {";
            simulationCode += "do {";
            simulationCode += this.replaceVariableAccess(_variableName) + " = Number(window.prompt(" + this.replaceVariableAccess(_prompt) + "));";
            simulationCode += "}while(isNaN(" + this.replaceVariableAccess(_variableName) + "));";
            simulationCode += "}";
            simulationCode += "else {";
            simulationCode += this.replaceVariableAccess(_variableName) + " = window.prompt(" + this.replaceVariableAccess(_prompt) + ").toString();";
            simulationCode += "}";
            simulationCode += "},";
            simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).getPath() + "'";
            simulationCode += "};";

            return simulationCode;
        };

        this.generateCCode = function () {
            var generatedCode = "";
            var printfInformation = this.getPrintfParametersForStringConcatenation(_prompt);
            var variableType = this.getVariableType(_variableName.split("[")[0]);

            generatedCode += "printf(\"" + printfInformation.formatString + "\"," + printfInformation.additionalArgumentList.join(",") + ");";

            if (variableType.split("[")[0] === blockDiagramEditorGlobals.languagePack["integer"]) {
                generatedCode += "scanf(\"%d\", &" + this.replaceIntegerOutParameterAccess(_variableName) + ");";
            }
            else if (variableType.split("[")[0] === blockDiagramEditorGlobals.languagePack["string"]) {
                generatedCode += "gets(" + _variableName + ");";
            }

            return generatedCode;
        };

        this.toSerializableObject = function () {
            var inputStatementSerializable = new InputStatementSerializable();

            inputStatementSerializable.prompt = _prompt;
            inputStatementSerializable.variableName = _variableName;
            inputStatementSerializable.comment = this.getComment();

            return inputStatementSerializable;
        };

        (function () {  // initialize function
            $(this.getDomElement()).find("input")[0].value = "\"gimme ?:\"";
            $(this.getDomElement()).find("input")[1].value = "?";

            $(this.getDomElement()).find("input").trigger("change");
        }).call(this);
    }


    function OutputStatement(statement, insertionMode, rootElement) {
        var _htmlSkeleton = '                                    \
    <div class="outputStatement">                        \
        <div class="statementBorderHelper"><span>' + blockDiagramEditorGlobals.languagePack["output"] + '</span><span>:</span><input type="text" onchange="$(this).closest(\'.outputStatement\').data(\'codebehindObject\').outputStringChanged(this.value);" class="variableInput" /><span class=\'comment\'></span></div>                      \
    </div>';
        var _outputString;

        this.outputStringChanged = function (outputString) {
            _outputString = outputString;
        };

        VariableSelectableStatement.call(this, statement, insertionMode, _htmlSkeleton, rootElement, [10]);
        CommentAttachableStatement.call(this, $(this.getDomElement()).find(".comment"));

        this.generateSimulationCode = function (statementsCaseId, nextStatementsCaseId, nextFreeId) {
            var simulationCode = "";

            simulationCode += "case " + statementsCaseId + ":";
            simulationCode += "return {";
            simulationCode += "caseId: " + nextStatementsCaseId + ",";
            simulationCode += "codeToExecute: function(){";
            simulationCode += "window.setTimeout(function() {";
            simulationCode += "alert (" + this.replaceVariableAccess(_outputString) + ");";
            simulationCode += "}, 0);";
            simulationCode += "},";
            simulationCode += "activeGuiComponentsSelector: '" + $(this.getDomElement()).getPath() + "'";
            simulationCode += "};";

            return simulationCode;
        };

        this.generateCCode = function () {
            var generatedCode = "";
            var printfInformation = this.getPrintfParametersForStringConcatenation(_outputString);

            generatedCode += "printf(\"" + printfInformation.formatString + "\\n\"," + printfInformation.additionalArgumentList.join(",") + ");";

            return generatedCode;
        };

        this.toSerializableObject = function () {
            var outputStatementSerializable = new OutputStatementSerializable();

            outputStatementSerializable.outputString = _outputString;
            outputStatementSerializable.comment = this.getComment();

            return outputStatementSerializable;
        };

        (function () {  // initialize function
            $(this.getDomElement()).find("input")[0].value = "\"\"";

            $(this.getDomElement()).find("input").trigger("change");
        }).call(this);
    }

    // ------------------    Serializable Constructors

    function StatementsSerializable() {
        this.type = "Statements";
        this.statements = [];
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
        this.comment = null;
    }

    function WhileStatementSerializable() {
        this.type = "WhileStatement";
        this.condition = null;
        this.loopStatements = null;
        this.comment = null;
    }

    function DoWhileStatementSerializable() {
        this.type = "DoWhileStatement";
        this.condition = null;
        this.loopStatements = null;
        this.comment = null;
    }

    function ForStatementSerializable() {
        this.type = "ForStatement";
        this.counterName = null;
        this.fromValue = null;
        this.toValue = null;
        this.counterShift = null;
        this.loopStatements = null;
        this.comment = null;
    }

    function SwitchStatementSerializable() {
        this.type = "SwitchStatement";
        this.variableName = null;
        this.casesStatements = [];
        this.elseStatements = null;
        this.comment = null;
    }

    function DeclarationStatementSerializable() {
        this.type = "DeclarationStatement";
        this.variableType = null;
        this.variableName = null;
        this.initializationValue = null;
        this.documentation = null;
        this.arrayLength = null;
        this.isArray = null;
        this.comment = null;
    }

    function AssignmentStatementSerializable() {
        this.type = "AssignmentStatement";
        this.variableName = null;
        this.assignmentValue = null;
        this.comment = null;
    }

    function InputStatementSerializable() {
        this.type = "InputStatement";
        this.prompt = null;
        this.variableName = null;
        this.comment = null;
    }

    function OutputStatementSerializable() {
        this.type = "OutputStatement";
        this.outputString = null;
        this.comment = null;
    }

    function FunctionCallStatementSerializable() {
        this.type = "FunctionCallStatement";
        this.variableName = null;
        this.functionName = null;
        this.parameters = null;
        this.comment = null;
    }

    function getWithStatementsSerializableWrapped(statements) {
        var wrapper = new StatementsSerializable();

        wrapper.statements = statements;

        return wrapper;
    }

    function initializeDiagram(diagramContainer) {
        var statements = $(Statements.htmlSkeleton).appendTo($(diagramContainer));

        statements.data(blockDiagramEditorGlobals.codebehindObjectName, new Statements(statements, Statement.useGiven, statements));
    }

    function getCodebehindClassOfName(name) {
        var codebehindClass = null;

        switch (name) {
            case blockDiagramEditorGlobals.languagePack["if"]:
                codebehindClass = IfStatement;
                break;

            case blockDiagramEditorGlobals.languagePack["while"]:
                codebehindClass = WhileStatement;
                break;

            case blockDiagramEditorGlobals.languagePack["do while"]:
                codebehindClass = DoWhileStatement;
                break;

            case blockDiagramEditorGlobals.languagePack["for"]:
                codebehindClass = ForStatement;
                break;

            case blockDiagramEditorGlobals.languagePack["switch"]:
                codebehindClass = SwitchStatement;
                break;

            case blockDiagramEditorGlobals.languagePack["declaration"]:
                codebehindClass = DeclarationStatement;
                break;

            case blockDiagramEditorGlobals.languagePack["assignment"]:
                codebehindClass = AssignmentStatement;
                break;

            case blockDiagramEditorGlobals.languagePack["call"]:
                codebehindClass = FunctionCallStatement;
                break;

            case blockDiagramEditorGlobals.languagePack["input"]:
                codebehindClass = InputStatement;
                break;

            case blockDiagramEditorGlobals.languagePack["output"]:
                codebehindClass = OutputStatement;
                break;

            case blockDiagramEditorGlobals.languagePack["comment"]:
                codebehindClass = CommentStatement;
                break;

            default:
                codebehindClass = null;
                break;
        }

        return codebehindClass;
    }

    function isIfStatementClass(statementClass) {
        return statementClass === IfStatement;
    }

    function isSwitchStatementClass(statementClass) {
        return statementClass === SwitchStatement;
    }

    function addAutoGeneratedResultDeclaration(functionSkeleton, returnType) {
        functionSkeleton.children(".statements").data(blockDiagramEditorGlobals.codebehindObjectName).prepend(DeclarationStatement);

        var declarationOfReturn = functionSkeleton.children(".statements").children().first();

        $(declarationOfReturn.find("input")[0]).prop("value", returnType);
        $(declarationOfReturn.find("input")[0]).trigger("change");
        $(declarationOfReturn.find("input")[0]).prop("disabled", true);
        $(declarationOfReturn.find("input")[1]).prop("value", blockDiagramEditorGlobals.languagePack.result);
        $(declarationOfReturn.find("input")[1]).trigger("change");
        $(declarationOfReturn.find("input")[1]).prop("disabled", true);
        $(declarationOfReturn.find("input")[2]).addClass("resultInitializationValue");
        $(declarationOfReturn).addClass("functionResultDeclaration");

        functionSkeleton.find(".visibleIfNotVoid").css("display", "block");
    }

    $.extend(window.blockDiagramEditorGlobals, {
        initializeDiagram: initializeDiagram,
        getCodebehindClassOfName: getCodebehindClassOfName,
        isIfStatementClass: isIfStatementClass,
        isSwitchStatementClass: isSwitchStatementClass,
        addAutoGeneratedResultDeclaration: addAutoGeneratedResultDeclaration,
        getWithStatementsSerializableWrapped: getWithStatementsSerializableWrapped
    });
})();