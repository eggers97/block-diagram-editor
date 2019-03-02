(function() {
    var configurations = {
        // simulation
        simulationDelay: 1000,
        skipLoopChecks: false,
        hideAddressColumn: true,
        currentLanguage: "en-GB"
    };

    $.extend(window.blockDiagramEditorGlobals, {
        configurations: configurations,
        localStorageFieldNameForConfigurations: "configurations"
    });
})();