﻿{"main":{"type":"Statements","statements":[{"type":"DeclarationStatement","variableType":"integer","variableName":"n","initializationValue":"0","isArray":false},{"type":"DeclarationStatement","variableType":"integer","variableName":"sum","initializationValue":"0","isArray":false},{"type":"InputStatement","prompt":"\"gimme a number: \"","variableName":"n"},{"type":"ForStatement","counterName":"i","fromValue":"1","toValue":"n","counterShift":"+1","loopStatements":{"type":"Statements","statements":[{"type":"FunctionCallStatement","variableName":"sum","functionName":"summe","parameters":[{"value":"sum"},{"value":"1"}]}]}},{"type":"OutputStatement","outputString":"\"sum up to \" +n +\" is: \" +sum"}]},"summe":{"parameters":[{"type":"integer","name":"n","onlyIn":false},{"type":"integer","name":"add","onlyIn":true}],"statements":{"type":"Statements","statements":[{"type":"AssignmentStatement","variableName":"result","assignmentValue":"n + add"}]},"returnType":"integer","resultInitializationValue":"0"}}