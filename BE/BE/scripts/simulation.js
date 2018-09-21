var resumeSimulation;
var pauseSimulation;
var stopSimulation;

function simulateDiagram(delay, visualStackContainer, onFunctionChanged, onPauseSimulation, onResumeSimulation, onSimulationEnded, onStopSimulation) {
    $(".defective").removeClass("defective");

    var firstId = 0;
    var generatedCodes = generateCodes(firstId);
    var timer = beginSimulation(generatedCodes, firstId, delay, visualStackContainer, onFunctionChanged, onSimulationEnded);

    resumeSimulation = function () {
        timer.play();
        onResumeSimulation();
    };

    pauseSimulation = function () {
        timer.pause();
        onPauseSimulation();
    };

    stopSimulation = function () {
        $(visualStackContainer).find("tbody").remove();

        timer.stop();

        resumeSimulation = undefined;
        pauseSimulation = undefined;
        stopSimulation = undefined;

        $(".currentlyExecuted").removeClass("currentlyExecuted");

        onStopSimulation();
    };
}

function beginSimulation(generatedCodes, firstId, delay, visualStackContainer, onFunctionChanged, onSimulationEnded) {
    var functionTrace = new Array();
    var variableTrace = new Array();
    var nextValueTrace = new Array();
    var functionPropertyHolderTrace = new Array();
    var parameters;
    var generatedFunction;
    var generatedVariables;
    var caseId = firstId;
    var simulationInformation;
    var intervalId;
    var activeGuiComponent = $();
    var stackTable = generateStackTable(visualStackContainer);
    var tabNameStack = new Array();
    var tabMustChange = null;
    var stackMustPop = false;
    var timer;
    var nextFreeAddress = 1;
    var returnValue;

    /*var asdf;
    for (asdf in generatedCodes) {
        console.log(asdf);
        console.log(generatedCodes[asdf]);
    }*/

    try {
        eval(generatedCodes["main"]);
    }
    catch (error) {
        onSimulationError(generatedCodes["main"], error.columnNumber, error.message);

        throw error;
    }

    functionTrace.push(generatedFunction);
    variableTrace.push(generatedVariables);
    tabNameStack.push("main");

    var simulationCode = function () {
        try{
            simulationInformation = functionTrace[functionTrace.length - 1](caseId, parameters, returnValue);
        }
        catch (error) {
            activeGuiComponent.removeClass("currentlyExecuted");

            onSimulationError(generatedCodes[tabNameStack[tabNameStack.length - 1]], error.columnNumber, error.message);

            onFunctionChanged(tabNameStack[tabNameStack.length - 1]);   

            stackTable.find("tbody").remove();

            resumeSimulation = undefined;
            pauseSimulation = undefined;
            stopSimulation = undefined;

            onSimulationEnded();

            timer.stop();

            throw error;
        }

        activeGuiComponent.removeClass("currentlyExecuted");
        activeGuiComponent = $(simulationInformation.activeGuiComponentsSelector);
        activeGuiComponent.addClass("currentlyExecuted");

        updateStackTable(stackTable, variableTrace, functionPropertyHolderTrace);

        if (tabMustChange != null) {
            onFunctionChanged(tabMustChange);
            tabMustChange = null;
        }

        if (simulationInformation instanceof Object) {
            if (simulationInformation.parameters != undefined) {   // function/procedure call
                nextValueTrace.push(simulationInformation.caseId);
                parameters = simulationInformation.parameters;

                try {
                    eval(generatedCodes[simulationInformation.functionName]);
                }
                catch (error) {
                    onSimulationError(generatedCodes[simulationInformation.functionName], error.columnNumber, error.message);

                    onFunctionChanged(simulationInformation.functionName);
                    
                    activeGuiComponent.removeClass("currentlyExecuted");

                    stackTable.find("tbody").remove();

                    resumeSimulation = undefined;
                    pauseSimulation = undefined;
                    stopSimulation = undefined;

                    onSimulationEnded();

                    timer.stop();

                    throw error;
                }

                functionTrace.push(generatedFunction);
                variableTrace.push(generatedVariables);
                functionPropertyHolderTrace.push(FunctionPropertyHolder.getByName(simulationInformation.functionName));

                caseId = firstId;

                tabNameStack.push(simulationInformation.functionName);
                tabMustChange = simulationInformation.functionName;
            }
            else if (simulationInformation.caseId instanceof Array) {   // function return
                functionTrace.pop();
                variableTrace.pop();
                functionPropertyHolderTrace.pop();

                if (simulationInformation.codeToExecute != undefined) {  // input or output must be done here in order to have a correct gui (if done before the currently executed IO-Statement would not be marked but the statement before)
                    simulationInformation.codeToExecute();
                }

                returnValue = simulationInformation.caseId[0];

                caseId = nextValueTrace.pop();

                tabNameStack.pop();
                tabMustChange = tabNameStack[tabNameStack.length - 1];
            }
            else if (simulationInformation.caseId == -1) {   // procedure return
                functionTrace.pop();
                variableTrace.pop();
                functionPropertyHolderTrace.pop();

                if (simulationInformation.codeToExecute != undefined) {  // input or output must be done here in order to have a correct gui (if done before the currently executed IO-Statement would not be marked but the statement before)
                    simulationInformation.codeToExecute();
                }

                if (functionTrace.length < 1) { // main finished
                    variableTrace.pop();

                    functionTrace.push(function () {
                        return -1;  // mark end of simulation
                    });
                }
                else {
                    caseId = nextValueTrace.pop();

                    tabNameStack.pop();
                    tabMustChange = tabNameStack[tabNameStack.length - 1];
                }
            }
            else {  // ordinary execution
                caseId = simulationInformation.caseId;

                if (simulationInformation.codeToExecute != undefined) {  // input or output must be done here in order to have a correct gui
                    simulationInformation.codeToExecute();
                }
            }
        }
        else {    // main returned
            activeGuiComponent.removeClass("currentlyExecuted");

            stackTable.find("tbody").remove();

            resumeSimulation = undefined;
            pauseSimulation = undefined;
            stopSimulation = undefined;

            onSimulationEnded();

            timer.stop();

            alert("finished");
        }
    };

    return timer = $.timer(simulationCode, delay, true);
}

function updateStackTable(stackTable, stackFunctions, functionPropertyHolderTrace) {
    var addFunctionName = true;

    $(stackTable).find("tbody").remove();

    stackFunctions.forEach(function (stackFunction, index) {
        var variables = stackFunction();
        var stackFunctionContainer = $("<tbody></tbody>").appendTo(stackTable);

        for (var variable in variables) {
            var currentParameter = null;

            if (index > 0) {
                functionPropertyHolderTrace[index - 1].getParameters().some(function (parameter) {
                    if (parameter.getName() == variable) {
                        currentParameter = parameter;

                        return true;
                    }

                    return false;
                });
            }

            if (variables[variable].value instanceof Array) {
                var address = parseInt(variables[variable].address);
                var i = 0;

                variables[variable].value.forEach(function (value) {
                    stackFunctionContainer.append("<tr " + (currentParameter != null && currentParameter.getOnlyIn() == false ? "class='outParameter'" : "") + "><td>" + variable + "[" + i + "]</td><td>" + value + "</td><td>" + (addFunctionName ? (index > 0 ? functionPropertyHolderTrace[index - 1].getName() : "main") : "") + (configurations.hideAddressColumn ? "" : "<td>" + decimalToFixedWidthHex(address, 4) + "</td>") + "</tr>");

                    address += 8;
                    i++;
                    addFunctionName = false;
                });
            }
            else {
                stackFunctionContainer.append("<tr " + (currentParameter != null && currentParameter.getOnlyIn() == false ? "class='outParameter'" : "") + "><td>" + variable + "</td><td>" + variables[variable].value + "</td><td>" + (addFunctionName ? (index > 0 ? functionPropertyHolderTrace[index - 1].getName() : "main") : "") + (configurations.hideAddressColumn ? "" : "<td>" + variables[variable].address + "</td>") + "</tr>");
            }
            
            addFunctionName = false;
        }

        addFunctionName = true;
    });

    $(stackTable).styleTable();
}

function generateStackTable(visualStackContainer) {
    $(visualStackContainer).append("<table></table>");

    return $(visualStackContainer).children().first();
}

function generateCodes(firstId) {
    var generatedCodes = new Object();
    var scopeCreationCode;
    var functionName;
    var localVariableInputFields;
    var localVariableArrayLengthFields;
    var functionPropertyHolder;
    var endId = -1;
    var nextFreeId = {
        value: firstId + 1
    };

    Statement.functionContainers.forEach(function (functionContainer) {
        scopeCreationCode = "";
        functionPropertyHolder = functionContainer.parent().data("codebehindObject");

        if (functionPropertyHolder == null) {
            functionName = "main";
        }
        else {
            functionName = functionPropertyHolder.getName();
        }

        scopeCreationCode += "(function() {";

        localVariableInputFields = $(functionContainer).find(".declarationStatement").children("input:nth-child(3)");
        localVariableArrayLengthFields = $(functionContainer).find(".declarationStatement").children("input.hiddenWhenNotArray");

        scopeCreationCode += "var initialized = false;";
        scopeCreationCode += generateLocalVariables(localVariableInputFields, localVariableArrayLengthFields, functionPropertyHolder);
        scopeCreationCode += generateGeneratedVariablesFunction(localVariableInputFields, functionPropertyHolder);

        scopeCreationCode += "generatedFunction = function simulation(caseId, parameters, returnValue) {";

        if (functionPropertyHolder != null && functionPropertyHolder.getParameters().length > 0) {
            scopeCreationCode += "if (!initialized) {";
            scopeCreationCode += generateParameterInitializationCode(functionPropertyHolder);
            scopeCreationCode += "initialized = true;";
            scopeCreationCode += "return {";
            scopeCreationCode += "caseId: " + firstId + ",";
            scopeCreationCode += "activeGuiComponentsSelector: ''";
            scopeCreationCode += "};";
            scopeCreationCode += "}";
        }

        scopeCreationCode += "switch(caseId) {";
        scopeCreationCode += functionContainer.data("codebehindObject").generateSimulationCode(firstId, endId, nextFreeId);
        scopeCreationCode += "}";
        scopeCreationCode += "};";
        scopeCreationCode += "})();";

        generatedCodes[functionName] = scopeCreationCode;
    });

    return generatedCodes;
}

function generateParameterInitializationCode(functionPropertyHolder) {
    var i = 0;
    var parameterInitializationCode = "";

    functionPropertyHolder.getParameters().forEach(function (parameter) {
        if (parameter.getOnlyIn() == true) {
            if (parameter.getType() == languagePack["integer"]) {
                parameterInitializationCode += "localVariables['" + parameter.getName() + "'].value = Number(parameters[" + i++ + "]);";
            }
            else if (parameter.getType() == languagePack["string"]) {
                parameterInitializationCode += "localVariables['" + parameter.getName() + "'].value = parameters[" + i++ + "].toString();";
            }
        }
        else {
            parameterInitializationCode += "localVariables['" + parameter.getName() + "'] = parameters[" + i++ + "];";

            if (parameter.getType() == languagePack["integer"]) {
                parameterInitializationCode += "localVariables['" + parameter.getName() + "'].value = Number(localVariables['" + parameter.getName() + "'].value);";
            }
            else if (parameter.getType() == languagePack["string"]) {
                parameterInitializationCode += "localVariables['" + parameter.getName() + "'].value = localVariables['" + parameter.getName() + "'].value.toString();";
            }
        }
    });

    return parameterInitializationCode;
}

function generateLocalVariables(localVariableInputFields, localVariableArrayLengthFields, functionPropertyHolder) {
    var variableCreationCodes = new Array();
    var generatedCode = "";
    var i = 0;

    localVariableInputFields.each(function (index, element) {
        if (localVariableArrayLengthFields[i].value == "0") {
            variableCreationCodes.push(element.value + ":{value:undefined,address:undefined}");
        }
        else {
            variableCreationCodes.push(element.value + ":{value:undefined,address:undefined}");
        }

        i++;
    });

    if (functionPropertyHolder != undefined) {
        functionPropertyHolder.getParameters().forEach(function (parameter) {
            if (parameter.getOnlyIn() == true) {
                variableCreationCodes.push(parameter.getName() + ":{value:undefined,address:decimalToFixedWidthHex(nextFreeAddress++ * 8, 4)}");
            }
        });
    }

    generatedCode += "var localVariables = {";
    generatedCode += variableCreationCodes.join();
    generatedCode += "};";

    return generatedCode;
}

function generateGeneratedVariablesFunction() {
    var generatedVariablesFunction = "generatedVariables = function() {";

    generatedVariablesFunction += "return localVariables;";
    generatedVariablesFunction += "};";

    return generatedVariablesFunction;
}

function decimalToFixedWidthHex(decimal, width) {
    var hexString = decimal.toString(16);
    var zeros = "";
    var prefix = "0x";

    for (var i = 0; i < width - hexString.length; i++) {
        zeros += "0";
    }
    
    return prefix + zeros + hexString;
}

function onSimulationError(code, columnNumber, errorMessage) {
    var positionOfActiveGuiComponentsSelector = code.indexOf("activeGuiComponentsSelector", columnNumber);
    var startPositionOfSelector = code.indexOf("'", positionOfActiveGuiComponentsSelector) + 1;
    var endPositionOfSelector = code.indexOf("'", startPositionOfSelector);
    var selector = code.substring(startPositionOfSelector, endPositionOfSelector);

    $(selector).addClass("defective");

    alert("Error: " + errorMessage);
}
