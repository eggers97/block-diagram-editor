﻿{"main":{"type":"Statements","statements":[{"type":"DeclarationStatement","variableType":"Number","variableName":"size","initializationValue":"0","isArray":false},{"type":"DeclarationStatement","variableType":"Number","variableName":"initializeValue","initializationValue":"4","isArray":false},{"type":"InputStatement","prompt":"\"gimme size:\"","variableName":"size"},{"type":"InputStatement","prompt":"\"gimme initializeValue:\"","variableName":"initializeValue"},{"type":"DeclarationStatement","variableType":"Number[]","variableName":"values","arrayLength":"size","isArray":true},{"type":"FunctionCallStatement","functionName":"initializeArray","parameters":[{"value":"values"},{"value":"initializeValue"}]}]},"initializeArray":{"parameters":[{"type":"Number[]","name":"array","onlyIn":false},{"type":"Number","name":"initializeValue","onlyIn":true}],"statements":{"type":"Statements","statements":[{"type":"DeclarationStatement","variableType":"Number","variableName":"i","initializationValue":"0","isArray":false},{"type":"ForStatement","counterName":"i","fromValue":"0","toValue":"array.length - 1","counterShift":"+1","loopStatements":{"type":"Statements","statements":[{"type":"AssignmentStatement","variableName":"array[i]","assignmentValue":"initializeValue"}]}}]},"returnType":"void"}}