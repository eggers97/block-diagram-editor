﻿{"main":{"type":"Statements","statements":[{"type":"DeclarationStatement","variableType":"Number","variableName":"a","initializationValue":"0","isArray":false},{"type":"DeclarationStatement","variableType":"Number","variableName":"b","initializationValue":"0","isArray":false},{"type":"InputStatement","prompt":"\"gimme a:\"","variableName":"a"},{"type":"InputStatement","prompt":"\"gimme b:\"","variableName":"b"},{"type":"CommentStatement","comment":" process positive numbers only"},{"type":"FunctionCallStatement","variableName":"a","functionName":"positive","parameters":[{"value":"a"}]},{"type":"FunctionCallStatement","variableName":"b","functionName":"positive","parameters":[{"value":"b"}]},{"type":"WhileStatement","condition":"(a != b)","loopStatements":{"type":"Statements","statements":[{"type":"IfStatement","thenStatements":{"type":"Statements","statements":[{"type":"AssignmentStatement","variableName":"a","assignmentValue":"a - b"}]},"elseStatements":{"type":"Statements","statements":[{"type":"AssignmentStatement","variableName":"b","assignmentValue":"b - a"}]},"condition":"(a > b)"}]}},{"type":"OutputStatement","outputString":"\"the greatest common divisor is \" +a"}]},"positive":{"parameters":[{"type":"Number","name":"n","onlyIn":true,"documentation":"value to be checked"}],"statements":{"type":"Statements","statements":[{"type":"IfStatement","thenStatements":{"type":"Statements","statements":[{"type":"AssignmentStatement","variableName":"result","assignmentValue":"n * (-1)"}]},"elseStatements":null,"condition":"(n < 0)"}]},"returnType":"Number","resultInitializationValue":"0"}}