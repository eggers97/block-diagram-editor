(function() {
    var configurations = {
        // simulation
        simulationDelay: 1000,
        skipLoopChecks: false,
        hideAddressColumn: true
    };

    $.extend(window.blockDiagramEditorGlobals, {
        configurations: configurations
    });
})();