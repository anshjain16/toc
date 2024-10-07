
var regex = null;
var automaton = null;
var inputString = null;
var nextSymbolIndex = 0;
var currentStates = null;
var inactiveStates = null;
var previousStates = null;
var nextStates = null;
var inputIsRegex = false;
var manualStates = [];
var manualTransitions = [];

function colorStates(states, cssClass) {
    if (states === undefined || states === null) {
        return;
    }
    states = getElementsOfStates(states);
    for (var i = 0; i < states.length; i++) {
        states[i].children("ellipse").each(function () {
            $(this).attr("class", cssClass);
        });
    }
}

function colorDiv(divId, intervals, cssClass) {
    var txt = $("#" + divId).html();
    var start = 0;
    var out = "";
    for (var i = 0; i < intervals.length; i++) {
        out += txt.slice(start, intervals[i][0]);
        out +=
            '<font class="' +
            cssClass +
            '">' +
            txt.slice(intervals[i][0], intervals[i][1]) +
            "</font>";
        start = intervals[i][1];
    }
    out += txt.slice(start);
    $("#" + divId).html(out);
}

function getElementsOfStates(states) {
    var retVal = [];
    for (var i = 0; i < states.length; i++) {
        $("title:contains('" + states[i].toString() + "')").each(function (
            index,
            element
        ) {
            if ($(this).text() === states[i].toString()) {
                retVal.push($(this).parent());
            }
        });
    }
    return retVal;
}

function reorderCirclesInAcceptingStates(states) {
    var stateElements = getElementsOfStates(states);
    for (var i = 0; i < stateElements.length; i++) {
        var e1 = $(stateElements[i].children("ellipse")[0]);
        var e2 = $(stateElements[i].children("ellipse")[1]);
        e1.insertAfter(e2);
    }
}

function drawGraph() {
    var dotString = toc.fsm.printDotFormat(automaton);
    var gvizXml = Viz(dotString, {
        format: "svg",
        totalMemory: 100 * 1024 * 1024,
    });
    $("#automatonGraph").html(gvizXml);
    reorderCirclesInAcceptingStates(automaton.acceptingStates);
    $("#automatonGraph svg").width($("#automatonGraph").width());
}

function colorize() {
    colorStates(automaton.states, "inactiveStates");
    colorStates(previousStates, "previousState");
    colorStates(nextStates, "nextState");
    colorStates(currentStates, "currentState");
}

function updateAutomataSummary() {
    var summary = "<h4>Automata Summary</h4>";

    var stateNames = manualStates.map(function (s) {
        return s.name;
    });
    summary +=
        "<p><strong>States:</strong> " +
        (stateNames.length > 0 ? stateNames.join(", ") : "None") +
        "</p>";

    var initialState = manualStates.find(function (s) {
        return s.isInitial;
    });
    summary +=
        "<p><strong>Initial State:</strong> " +
        (initialState ? initialState.name : "None") +
        "</p>";

    var acceptingStates = manualStates
        .filter(function (s) {
            return s.isAccepting;
        })
        .map(function (s) {
            return s.name;
        });
    summary +=
        "<p><strong>Accepting States:</strong> " +
        (acceptingStates.length > 0 ? acceptingStates.join(", ") : "None") +
        "</p>";

    var alphabet = [];
    manualTransitions.forEach(function (t) {
        if (t.symbol !== "" && alphabet.indexOf(t.symbol) === -1) {
            alphabet.push(t.symbol);
        }
    });
    summary +=
        "<p><strong>Alphabet:</strong> " +
        (alphabet.length > 0 ? alphabet.join(", ") : "None") +
        "</p>";
    summary += "<p><strong>Transitions:</strong></p>";
    if (manualTransitions.length > 0) {
        summary += "<ul>";
        manualTransitions.forEach(function (t) {
            summary +=
                "<li>" +
                t.from +
                " --" +
                (t.symbol === "" ? "ε" : t.symbol) +
                "--> " +
                t.to +
                "</li>";
        });
        summary += "</ul>";
    } else {
        summary += "<p>No transitions added yet.</p>";
    }

    $("#automataSummary").html(summary);
}

$("#generateRandomString").click(function () {
    if ($("#startStop").text() === "Stop") {
        $("#startStop").click();
    }
    $("#inputString").val(
        Math.random() >= 0.5
            ? toc.fsm.randomStringInLanguage(automaton).join("")
            : toc.fsm.randomStringNotInLanguage(automaton).join("")
    );
    onInputStringChange();
});

$("#generateRandomAcceptableString").click(function () {
    if ($("#startStop").text() === "Stop") {
        $("#startStop").click();
    }
    var s = toc.fsm.randomStringInLanguage(automaton).join("");
    $("#inputString").val(s);
    onInputStringChange();
});

$("#generateRandomUnacceptableString").click(function () {
    if ($("#startStop").text() === "Stop") {
        $("#startStop").click();
    }
    var s = toc.fsm.randomStringNotInLanguage(automaton).join("");
    $("#inputString").val(s);
    onInputStringChange();
});

$("#startStop").click(function () {
    if ($("#startStop").text() === "Start") {
        var r = $("#inputString").val();
        $("#inputString")
            .parent()
            .html(
                '<div id="inputString" class="input-div input-block-level monospaceRegex" placeholder="See if this fits"><br></div>'
            );
        $("#inputString").html(r === "" ? "<br>" : r);
        resetAutomaton();
        $("#inputString").removeAttr("contenteditable");
        $("#inputPrevious").attr("disabled", false);
        $("#inputNext").attr("disabled", false);
        $("#startStop").text("Stop");
    } else {
        var r = $("#inputString").text();
        $("#inputString")
            .parent()
            .html(
                '<input id="inputString" type="text" class="input-block-level monospaceRegex" placeholder="See if this fits">'
            );
        $("#inputString").keyup(onInputStringChange);
        $("#inputString").change(onInputStringChange);
        $("#inputString").val(r);
        $("#inputString").attr("contenteditable", "");
        $("#startStop").text("Start");
        $("#inputString").html($("#inputString").text());
        $("#inputString").focus();
    }
});

function onInputStringChange() {
    var chars = $("#inputString").val().split("");
    var isValidInputString = -1;
    for (var i = 0; i < chars.length; i++) {
        if (!toc.util.contains(automaton.alphabet, chars[i])) {
            isValidInputString = i;
            break;
        }
    }
    if (isValidInputString === -1) {
        $("#startStop").attr("disabled", false);
        $("#inputString").parent().addClass("success").removeClass("error");
        $("#inputError").hide();
    } else {
        $("#startStop").attr("disabled", true);
        $("#inputString").parent().removeClass("success").addClass("error");
        $("#inputError")
            .show()
            .text(
                "Error: input character at position " +
                    isValidInputString +
                    " is not in FSM alphabet."
            );
    }
}

function colorNextSymbol() {
    $("#inputString").html(inputString);
    if ($("#inputString").html() === "") {
        $("#inputString").html("<br>");
    }
    if (nextSymbolIndex < inputString.length) {
        colorDiv(
            "inputString",
            [[nextSymbolIndex, nextSymbolIndex + 1]],
            "nextSymbol"
        );
    }
}

function resetAutomaton() {
    currentStates = toc.fsm.computeEpsilonClosure(automaton, [
        automaton.initialState,
    ]);
    inputString = $("#inputString").text();
    nextSymbolIndex = 0;
    colorize();
    colorNextSymbol();
}

$("#inputPrevious").click(function () {
    if (nextSymbolIndex > 0) {
        currentStates = toc.fsm.readString(
            automaton,
            inputString.substring(0, nextSymbolIndex - 1).split("")
        );
        nextSymbolIndex = nextSymbolIndex - 1;
        colorize();
        colorNextSymbol();
    }
});

$("#inputNext").click(function () {
    if (nextSymbolIndex < inputString.length) {
        currentStates = toc.fsm.makeTransition(
            automaton,
            currentStates,
            inputString[nextSymbolIndex]
        );
        nextSymbolIndex++;
        colorize();
        colorNextSymbol();
    }
});

function initialize() {
    inputString = "";
    currentStates = null;
    inactiveStates = null;
    previousStates = null;
    nextStates = null;
}

function generateAutomaton(fsmType) {
    automaton = toc.fsm.createRandomFsm(fsmType, 4, 3, 3);
    $("#fsm").val(toc.fsm.serializeFsmToString(automaton));
    $("#fsm").scrollTop(0);
    $("#fsm").focus();
    onAutomatonChange();
}

$("#generateDFA").click(function () {
    generateAutomaton(toc.fsm.dfaType);
});

$("#generateENFA").click(function () {
    generateAutomaton(toc.fsm.enfaType);
});
$("#fsm").on("keyup change", function () {
    if ($(this).val().trim() === "") {
        $("#createAutomaton").attr("disabled", true);
    } else {
        $("#createAutomaton").attr("disabled", false);
    }
});
$("#createAutomaton").click(function () {
    try {
        automaton = toc.fsm.parseFsmFromString($("#fsm").val());
        initialize();
        drawGraph();
        resetAutomaton();
        $(
            "#generateRandomString, #generateRandomAcceptableString, #generateRandomUnacceptableString, #inputString"
        ).attr("disabled", false);
    } catch (e) {
        alert("Error creating automaton: " + e.message);
    }
});
function onAutomatonChange() {
    $("#automatonGraph").html("");
    $("#inputString").val("");
    $(
        "#generateRandomString, #generateRandomAcceptableString, #generateRandomUnacceptableString"
    ).attr("disabled", true);
    $("#createAutomaton").attr("disabled", false);
    $("#startStop, #inputPrevious, #inputNext").attr("disabled", true);
    $("#inputString").parent().removeClass("success error");
    $("#inputError").hide();
}
function updateStateDropdowns() {
    var fromState = $("#fromState");
    var toState = $("#toState");
    fromState.empty();
    toState.empty();
    manualStates.forEach(function (state) {
        fromState.append(
            $("<option></option>").text(state.name).attr("value", state.name)
        );
        toState.append(
            $("<option></option>").text(state.name).attr("value", state.name)
        );
    });
}

$("#addState").click(function () {
    var name = $("#stateName").val().trim();
    if (!name) {
        alert("State name cannot be empty");
        return;
    }
    if (
        manualStates.some(function (s) {
            return s.name === name;
        })
    ) {
        alert("State name must be unique");
        return;
    }
    var isInitial = $("#isInitial").is(":checked");
    if (isInitial) {
        manualStates.forEach(function (s) {
            s.isInitial = false;
        });
    }
    var isAccepting = $("#isAccepting").is(":checked");
    manualStates.push({
        name: name,
        isInitial: isInitial,
        isAccepting: isAccepting,
    });
    $("#stateName").val("");
    $("#isInitial, #isAccepting").prop("checked", false);
    updateStateDropdowns();
    var stateList = $("#stateList");
    stateList.empty();
    manualStates.forEach(function (state) {
        var text =
            state.name +
            (state.isInitial ? " (Initial)" : "") +
            (state.isAccepting ? " (Accepting)" : "");
        stateList.append($("<li></li>").text(text));
    });
    updateAutomataSummary();
});

$("#addTransition").click(function () {
    var fromState = $("#fromState").val();
    var toState = $("#toState").val();
    var symbol = $("#transitionSymbol").val().trim();
    if (symbol === "ε") symbol = "";
    if (!fromState || !toState || symbol === "") {
        alert("Please fill in all fields for the transition");
        return;
    }
    manualTransitions.push({from: fromState, symbol: symbol, to: toState});
    $("#transitionSymbol").val("");

    var transitionList = $("#transitionList");
    transitionList.empty();
    manualTransitions.forEach(function (trans) {
        var displaySymbol = trans.symbol === "" ? "ε" : trans.symbol;
        transitionList.append(
            $("<li></li>").text(
                trans.from + " --" + displaySymbol + "--> " + trans.to
            )
        );
    });

    // Update the automata summary.
    updateAutomataSummary();
});

$("#generateManualAutomaton").click(function () {
    var initialStates = manualStates.filter(function (s) {
        return s.isInitial;
    });
    if (initialStates.length !== 1) {
        alert("There must be exactly one initial state");
        return;
    }

    var states = manualStates.map(function (s) {
        return s.name;
    });
    var acceptingStates = manualStates
        .filter(function (s) {
            return s.isAccepting;
        })
        .map(function (s) {
            return s.name;
        });
    var initialState = initialStates[0].name;

    // Build alphabet from transitions (ignore epsilon transitions)
    var alphabet = [];
    manualTransitions.forEach(function (t) {
        if (t.symbol !== "" && alphabet.indexOf(t.symbol) === -1) {
            alphabet.push(t.symbol);
        }
    });

    // Build transitions in the required format.
    var transitionMap = {};
    manualTransitions.forEach(function (trans) {
        var key = trans.from + "," + trans.symbol;
        if (!transitionMap[key]) {
            transitionMap[key] = [];
        }
        transitionMap[key].push(trans.to);
    });

    var transitions = [];
    for (var key in transitionMap) {
        if (transitionMap.hasOwnProperty(key)) {
            var parts = key.split(",");
            transitions.push({
                fromState: parts[0],
                symbol: parts[1],
                toStates: transitionMap[key],
            });
        }
    }

    var manualAutomaton = {
        states: states,
        alphabet: alphabet,
        transitions: transitions,
        initialState: initialState,
        acceptingStates: acceptingStates,
    };

    var manualType = $("#manualType").val(); // "NFA" or "DFA"
    if (manualType === "DFA") {
        // Convert to DFA (first remove epsilon-transitions if any)
        manualAutomaton = toc.fsm.convertEnfaToNfa(manualAutomaton);
        manualAutomaton = toc.fsm.convertNfaToDfa(manualAutomaton);
        manualAutomaton = toc.fsm.minimize(manualAutomaton);
        // manualAutomaton = toc.fsm.convertStatesToNumbers(manualAutomaton);
    }

    // Serialize the created automaton and put it into the fsm textarea.
    var serialized = toc.fsm.serializeFsmToString(manualAutomaton);
    $("#fsm").val(serialized);

    //   $('#inputTabs a[href="#scriptedTab"]').tab('show');
    $("#createAutomaton").click();
    manualStates = [];
    manualTransitions = [];
    $("#stateList, #transitionList").empty();
    updateStateDropdowns();
});
