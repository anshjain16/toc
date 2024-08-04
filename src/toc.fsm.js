toc.fsm = {};

toc.fsm.epsilonSymbol = "$";
toc.fsm.dfaType = "DFA";
toc.fsm.nfaType = "NFA";
toc.fsm.enfaType = "eNFA";

toc.fsm.makeNew = function () {
	return {
		states: [],
		alphabet: [],
		acceptingStates: [],
		initialState: undefined,
		transitions: [],
	};
};

// Common internal implementation
//  for addState and addSymbol.
toc.fsm._addStateOrSymbol = function (
	arr,
	obj,
	undefErrorMsg,
	existsErrorMsg
) {
	// need to check this because undefined
	//  would otherwise be added as a state
	// or symbol which is probably not what you want
	if (obj === undefined) {
		throw new Error(undefErrorMsg);
	}
	if (toc.util.contains(arr, obj)) {
		throw new Error(existsErrorMsg);
	}

	arr.push(obj);
	return obj;
};

// Adds stateObj as a state to the fsm.
// Throws an Error if no stateObj is passed or if the same state already exists.
// Returns the added state object.
toc.fsm.addState = function (fsm, stateObj) {
	return toc.fsm._addStateOrSymbol(
		fsm.states,
		stateObj,
		"No state object specified",
		"State already exists"
	);
};

// Adds symObj as an alphabet symbol to the fsm.
// Throws an Error if no symObj is passed or if the same symbol already exists.
// Returns the added symbol object.
toc.fsm.addSymbol = function (fsm, symObj) {
	if (toc.util.areEquivalent(symObj, toc.fsm.epsilonSymbol)) {
		throw new Error("Can't add the epsilon symbol to the alphabet");
	}
	return toc.fsm._addStateOrSymbol(
		fsm.alphabet,
		symObj,
		"No symbol object specified",
		"Symbol already exists"
	);
};

// Makes stateObj an accepting state of the fsm.
// Throws an Error if stateObj is not a state of the fsm or if it is already
// accepting.
toc.fsm.addAcceptingState = function (fsm, stateObj) {
	if (!toc.util.contains(fsm.states, stateObj)) {
		throw new Error("The specified object is not a state of the FSM");
	}
	toc.fsm._addStateOrSymbol(
		fsm.acceptingStates,
		stateObj,
		"",
		"The specified state is already accepting"
	);
};

// Sets stateObj as the start
//  state of the fsm.
// Throws an Error if stateObj is not a state of the fsm.
toc.fsm.setInitialState = function (fsm, stateObj) {
	if (!toc.util.contains(fsm.states, stateObj)) {
		throw new Error("The specified object is not a state of the FSM");
	}
	fsm.initialState = stateObj;
};

// Common implementation for addTransition and addEpsilonTransition.
toc.fsm._addTransition = function (
	fsm,
	fromState,
	toStates,
	transitionSymbol
) {
	if (!Array.isArray(toStates)) {
		throw new Error("The toStates argument must be an array");
	}
	if (
		!toc.util.contains(fsm.states, fromState) ||
		!toc.util.containsAll(fsm.states, toStates)
	) {
		throw new Error("One of the specified objects is not a state of the FSM");
	}

	var i;
	var added = false;
	for (i = 0; i < fsm.transitions.length; i++) {
		if (
			toc.util.areEquivalent(fromState, fsm.transitions[i].fromState) &&
			toc.util.areEquivalent(transitionSymbol, fsm.transitions[i].symbol)
		) {
			fsm.transitions[i].toStates = toc.util.setUnion(
				fsm.transitions[i].toStates,
				toStates
			);
			added = true;
			break;
		}
	}
	if (!added) {
		fsm.transitions.push({
			fromState: fromState,
			toStates: toStates,
			symbol: transitionSymbol,
		});
	}
};

// Adds a transition from fromState
//  to the set of states represented by the array
// toStates, using transitionSymbol.
// If a transition for this pair of
//  (fromState, transitionSymbol) already exists,
// toStates is added to the
// existing set of destination states.
// Throws an Error if any of the states
//  is not actually in the fsm or if the
// transition symbol is not in the fsm's alphabeth.
// Note that this means that an Error will be thrown if you try to use this to
// specify an epsilon transition. For that, use addEpsilonTransition instead.
toc.fsm.addTransition = function (fsm, fromState, toStates, transitionSymbol) {
	if (!toc.util.contains(fsm.alphabet, transitionSymbol)) {
		throw new Error(
			"The specified object is not an alphabet symbol of the FSM"
		);
	}
	toc.fsm._addTransition(fsm, fromState, toStates, transitionSymbol);
};

// Equivalent to addTransition except that there is no transition symbol, i.e. the
// transition can be executed without consuming an input symbol.
toc.fsm.addEpsilonTransition = function (fsm, fromState, toStates) {
	toc.fsm._addTransition(fsm, fromState, toStates, toc.fsm.epsilonSymbol);
};

// end of FSM creation API

// validates a FSM definition
toc.fsm.validate = function (fsm) {
	var i, j, k;

	if (
		!(
			typeof fsm !== "undefined" &&
			Array.isArray(fsm.states) &&
			Array.isArray(fsm.alphabet) &&
			Array.isArray(fsm.acceptingStates) &&
			typeof fsm.initialState !== "undefined" &&
			fsm.initialState !== null &&
			Array.isArray(fsm.transitions)
		)
	) {
		throw new Error(
			"FSM must be defined and have states, alphabet, acceptingStates, initialState and transitions array properties!"
		);
	}

	if (fsm.states.length < 1) {
		throw new Error("Set of states must not be empty.");
	}

	for (i = 0; i < fsm.states.length; i++) {
		if (toc.util.contains(fsm.states, fsm.states[i], i + 1)) {
			throw new Error("Equivalent states");
		}
	}

	if (fsm.alphabet.length < 1) {
		throw new Error("Alphabet must not be empty.");
	}

	for (i = 0; i < fsm.alphabet.length; i++) {
		if (toc.util.contains(fsm.alphabet, fsm.alphabet[i], i + 1)) {
			throw new Error("Equivalent alphabet symbols");
		}
	}

	if (toc.util.contains(fsm.alphabet, toc.fsm.epsilonSymbol)) {
		throw new Error("FSM alphabet must not contain the epsilon symbol");
	}

	for (i = 0; i < fsm.alphabet.length; i++) {
		if (toc.util.contains(fsm.states, fsm.alphabet[i])) {
			throw new Error("States and alphabet symbols must not overlap");
		}
	}

	for (i = 0; i < fsm.acceptingStates.length; i++) {
		if (
			toc.util.contains(fsm.acceptingStates, fsm.acceptingStates[i], i + 1)
		) {
			throw new Error("Equivalent acceptingStates");
		}

		if (!toc.util.contains(fsm.states, fsm.acceptingStates[i])) {
			throw new Error("Each accepting state must be in states");
		}
	}

	if (!toc.util.contains(fsm.states, fsm.initialState)) {
		throw new Error("Initial state must be in states");
	}

	for (i = 0; i < fsm.transitions.length; i++) {
		var transition = fsm.transitions[i];

		if (
			typeof transition.fromState === "undefined" ||
			typeof transition.toStates === "undefined" ||
			typeof transition.symbol === "undefined"
		) {
			throw new Error("Transitions must have fromState, toState and symbol");
		}

		if (!toc.util.contains(fsm.states, transition.fromState)) {
			throw new Error("Transition fromState must be in states.");
		}

		if (
			!toc.util.contains(fsm.alphabet, transition.symbol) &&
			transition.symbol !== toc.fsm.epsilonSymbol
		) {
			throw new Error("Transition symbol must be in alphabet.");
		}

		for (k = 0; k < transition.toStates.length; k++) {
			if (!toc.util.contains(fsm.states, transition.toStates[k])) {
				throw new Error("Transition toStates must be in states.");
			}

			if (
				toc.util.contains(transition.toStates, transition.toStates[k], k + 1)
			) {
				throw new Error("Transition toStates must not contain duplicates.");
			}
		}
	}

	for (i = 0; i < fsm.transitions.length; i++) {
		for (j = i + 1; j < fsm.transitions.length; j++) {
			if (
				fsm.transitions[i].fromState === fsm.transitions[j].fromState &&
				fsm.transitions[i].symbol === fsm.transitions[j].symbol
			) {
				throw new Error(
					"Transitions for the same fromState and symbol must be defined in a single trainsition."
				);
			}
		}
	}

	return true;
};

// determine if stateObj is an accepting state in fsm
toc.fsm.isAcceptingState = function (fsm, stateObj) {
	return toc.util.contains(fsm.acceptingStates, stateObj);
};

// determine fsm type based on transition function
toc.fsm.determineType = function (fsm) {
	var fsmType = toc.fsm.dfaType;

	for (var i = 0; i < fsm.transitions.length; i++) {
		var transition = fsm.transitions[i];

		if (transition.symbol === toc.fsm.epsilonSymbol) {
			fsmType = toc.fsm.enfaType;
			break;
		} else if (
			transition.toStates.length === 0 ||
			transition.toStates.length > 1
		) {
			fsmType = toc.fsm.nfaType;
		}
	}

	if (fsmType === toc.fsm.dfaType) {
		if (fsm.transitions.length < fsm.states.length * fsm.alphabet.length) {
			fsmType = toc.fsm.nfaType;
		}
	}

	return fsmType;
};

// computes epsilon closure
// of fsm from states array states
toc.fsm.computeEpsilonClosure = function (fsm, states) {
	if (!toc.util.containsAll(fsm.states, states)) {
		throw new Error(
			"FSM must contain all states for which epsilon closure is being computed"
		);
	}

	var unprocessedStates = states;
	var targetStates = [];

	while (unprocessedStates.length !== 0) {
		var currentState = unprocessedStates.pop();
		targetStates.push(currentState);

		for (var i = 0; i < fsm.transitions.length; i++) {
			var transition = fsm.transitions[i];

			if (
				transition.symbol === toc.fsm.epsilonSymbol &&
				toc.util.areEquivalent(transition.fromState, currentState)
			) {
				for (var j = 0; j < transition.toStates.length; j++) {
					if (
						toc.util.contains(targetStates, transition.toStates[j]) ||
						toc.util.contains(unprocessedStates, transition.toStates[j])
					) {
						continue;
					}

					unprocessedStates.push(transition.toStates[j]);
				}
			}
		}
	}

	return targetStates;
};

// determines the target states from
// reading symbol at states array states
toc.fsm.makeSimpleTransition = function (fsm, states, symbol) {
	if (!toc.util.containsAll(fsm.states, states)) {
		throw new Error(
			"FSM must contain all states for which the transition is being computed"
		);
	}

	if (!toc.util.contains(fsm.alphabet, symbol)) {
		throw new Error(
			"FSM must contain input symbol for which the transition is being computed"
		);
	}

	var targetStates = [];

	for (var i = 0; i < fsm.transitions.length; i++) {
		var transition = fsm.transitions[i];

		if (
			toc.util.areEquivalent(fsm.transitions[i].symbol, symbol) &&
			toc.util.contains(states, transition.fromState)
		) {
			for (var j = 0; j < transition.toStates.length; j++) {
				if (!toc.util.contains(targetStates, transition.toStates[j])) {
					targetStates.push(transition.toStates[j]);
				}
			}
		}
	}

	return targetStates;
};

// makes transition from states array states and for input symbol symbol by:
//   a) computing the epsilon closure of states
//   b) making a simple transition from resulting states of a)
//   c) computing the epsilon closure of resulting states of b)
toc.fsm.makeTransition = function (fsm, states, symbol) {
	if (!toc.util.containsAll(fsm.states, states)) {
		throw new Error(
			"FSM must contain all states for which the transition is being computed"
		);
	}

	if (!toc.util.contains(fsm.alphabet, symbol)) {
		throw new Error(
			"FSM must contain input symbol for which the transition is being computed"
		);
	}

	var targetStates = toc.util.clone(states);

	targetStates = toc.fsm.computeEpsilonClosure(fsm, targetStates);
	targetStates = toc.fsm.makeSimpleTransition(fsm, targetStates, symbol);
	targetStates = toc.fsm.computeEpsilonClosure(fsm, targetStates);

	return targetStates;
};

// read a stream of input symbols
// and determine target states
toc.fsm.readString = function (fsm, inputSymbolStream) {
	if (!toc.util.containsAll(fsm.alphabet, inputSymbolStream)) {
		throw new Error(
			"FSM must contain all symbols for which the transition is being computed"
		);
	}

	var states = toc.fsm.computeEpsilonClosure(fsm, [fsm.initialState]);

	for (var i = 0; i < inputSymbolStream.length; i++) {
		states = toc.fsm.makeTransition(fsm, states, inputSymbolStream[i]);
	}

	return states;
};

// read a stream of input symbols
// starting from state and make a list of
// states that were on the transition path
toc.fsm.transitionTrail = function (fsm, state, inputSymbolStream) {
	if (!toc.util.containsAll(fsm.alphabet, inputSymbolStream)) {
		throw new Error(
			"FSM must contain all symbols for which the transition is being computed"
		);
	}

	var states = [state];
	var trail = [toc.util.clone(states)];

	for (var i = 0; i < inputSymbolStream.length; i++) {
		states = toc.fsm.makeTransition(fsm, states, inputSymbolStream[i]);
		trail.push(toc.util.clone(states));
	}

	return trail;
};

// test if a stream of input symbols
//  leads a fsm to an accepting state
toc.fsm.isStringInLanguage = function (fsm, inputSymbolStream) {
	var states = toc.fsm.readString(fsm, inputSymbolStream);

	return toc.util.containsAny(fsm.acceptingStates, states);
};

// pretty print the fsm transition
// function and accepting states as a table
toc.fsm.printTable = function (fsm) {
	var Table = require("cli-table");
	var colHeads = [""].concat(fsm.alphabet);

	if (toc.fsm.determineType(fsm) === toc.fsm.enfaType) {
		colHeads.push(toc.fsm.epsilonSymbol);
	}

	colHeads.push("");

	var table = new Table({
		head: colHeads,
		chars: {
			top: "-",
			"top-mid": "+",
			"top-left": "+",
			"top-right": "+",
			bottom: "-",
			"bottom-mid": "+",
			"bottom-left": "+",
			"bottom-right": "+",
			left: "|",
			"left-mid": "+",
			mid: "-",
			"mid-mid": "+",
			right: "|",
			"right-mid": "+",
		},
		truncate: "~",
	});

	var tableRows = [],
		i,
		j;
	for (i = 0; i < fsm.states.length; i++) {
		tableRows.push(new Array(colHeads.length));
		for (j = 0; j < colHeads.length; j++) {
			tableRows[i][j] = "";
		}
		tableRows[i][0] = fsm.states[i].toString();
		tableRows[i][colHeads.length - 1] = toc.util.contains(
			fsm.acceptingStates,
			fsm.states[i]
		)
			? "1"
			: "0";
		table.push(tableRows[i]);
	}

	for (i = 0; i < fsm.transitions.length; i++) {
		var transition = fsm.transitions[i];

		var colNum = null;
		var rowNum = null;

		for (j = 0; j < fsm.states.length; j++) {
			if (toc.util.areEquivalent(fsm.states[j], transition.fromState)) {
				rowNum = j;
				break;
			}
		}

		if (transition.symbol === toc.fsm.epsilonSymbol) {
			colNum = colHeads.length - 2;
		} else {
			for (j = 0; j < fsm.alphabet.length; j++) {
				if (toc.util.areEquivalent(fsm.alphabet[j], transition.symbol)) {
					colNum = j + 1;
					break;
				}
			}
		}

		if (typeof tableRows[rowNum][colNum].text === "undefined") {
			tableRows[rowNum][colNum] = {text: []};
		}

		tableRows[rowNum][colNum].text.push(transition.toStates);
	}

	return table.toString();
};

toc.fsm.serializeFsmToString = function (fsm) {
	var lines = [];

	lines.push("#states");

	for (var i = 0; i < fsm.states.length; i++) {
		lines.push(fsm.states[i].toString());
	}

	lines.push("#initial");

	lines.push(fsm.initialState.toString());

	lines.push("#accepting");

	for (var i = 0; i < fsm.acceptingStates.length; i++) {
		lines.push(fsm.acceptingStates[i].toString());
	}

	lines.push("#alphabet");

	for (var i = 0; i < fsm.alphabet.length; i++) {
		lines.push(fsm.alphabet[i].toString());
	}

	lines.push("#transitions");

	for (var i = 0; i < fsm.transitions.length; i++) {
		lines.push(
			fsm.transitions[i].fromState.toString() +
				":" +
				fsm.transitions[i].symbol.toString() +
				">" +
				fsm.transitions[i].toStates.join(",")
		);
	}

	return lines.join("\n");
};

toc.fsm.parseFsmFromString = function (fsm_string) {
	var lines = fsm_string.split(/\r?\n/);

	var states = [];
	var initial;
	var accepting = [];
	var alphabet = [];
	var transitions = [];

	var parseState = null;

	var parseCounts = {
		states: 0,
		initial: 0,
		accepting: 0,
		alphabet: 0,
		transitions: 0,
	};

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].replace(/\s/g, "");

		if (line.length === 0) {
			continue;
		} else if (line[0] === "#") {
			parseState = line.substr(1);

			if (typeof parseCounts[parseState] === "undefined") {
				throw new Error(
					"Line " +
						(i + 1).toString() +
						": invalid section name " +
						parseState +
						". Must be one of: states, initial, \
                           accepting, alphabet, transitions."
				);
			} else {
				parseCounts[parseState] += 1;

				if (parseCounts[parseState] > 1) {
					throw new Error(
						"Line " +
							(i + 1).toString() +
							": duplicate section name " +
							parseState +
							"."
					);
				}
			}
		} else {
			if (parseState == null) {
				throw new Error(
					"Line " +
						(i + 1).toString() +
						": no #section declared. \
                          Add one section: states, initial, accepting, \
                          alphabet, transitions."
				);
			} else if (parseState === "states") {
				var st = line.split(";");
				states = states.concat(st);
			} else if (parseState == "initial") {
				initial = line;
			} else if (parseState == "accepting") {
				var ac = line.split(";");
				accepting = accepting.concat(ac);
			} else if (parseState == "alphabet") {
				var al = line.split(";");
				alphabet = alphabet.concat(al);
			} else if (parseState == "transitions") {
				var state_rest = line.split(":");

				var state = state_rest[0].split(",");
				var parts = state_rest[1].split(";");

				for (var j = 0; j < parts.length; j++) {
					var left_right = parts[j].split(">");
					var al_t = left_right[0].split(",");
					var st_t = left_right[1].split(",");
				}

				transitions.push([state, al_t, st_t]);
			}
		}
	}

	for (var k in parseCounts) {
		if (parseCounts[k] !== 1) {
			throw new Error("Specification missing #" + parseCounts[k] + " section.");
		}
	}

	var fsm = toc.fsm.makeNew();

	for (var i = states.length - 1; i >= 0; i--) {
		toc.fsm.addState(fsm, states[i]);
	}

	for (var i = alphabet.length - 1; i >= 0; i--) {
		toc.fsm.addSymbol(fsm, alphabet[i]);
	}

	for (var i = 0; i < accepting.length; i++) {
		toc.fsm.addAcceptingState(fsm, accepting[i]);
	}

	toc.fsm.setInitialState(fsm, initial);

	for (var i = 0; i < transitions.length; i++) {
		var transition = transitions[i];

		for (var j = 0; j < transition[0].length; j++) {
			for (var k = 0; k < transition[1].length; k++) {
				if (transition[1][k] === toc.fsm.epsilonSymbol) {
					toc.fsm.addEpsilonTransition(fsm, transition[0][j], transition[2]);
				} else {
					toc.fsm.addTransition(
						fsm,
						transition[0][j],
						transition[2],
						transition[1][k]
					);
				}
			}
		}
	}

	toc.fsm.validate(fsm);

	return fsm;
};

// print the fsm transition function
// and accepting states as an HTML table
toc.fsm.printHtmlTable = function (fsm) {
	var headers = [""].concat(fsm.alphabet);
	if (toc.fsm.determineType(fsm) === toc.fsm.enfaType) {
		headers.push(toc.fsm.epsilonSymbol);
	}
	headers.push("");

	var tableRows = [],
		i,
		j;

	for (i = 0; i < fsm.states.length; i++) {
		tableRows.push(new Array(headers.length));
		for (j = 0; j < headers.length; j++) {
			tableRows[i][j] = {text: []};
		}
		tableRows[i][0] = {text: fsm.states[i].toString()};
		tableRows[i][headers.length - 1] = toc.util.contains(
			fsm.acceptingStates,
			fsm.states[i]
		)
			? {text: ["1"]}
			: {text: ["0"]};
	}

	for (i = 0; i < fsm.transitions.length; i++) {
		var transition = fsm.transitions[i];

		var colNum = null;
		var rowNum = null;

		for (j = 0; j < fsm.states.length; j++) {
			if (toc.util.areEquivalent(fsm.states[j], transition.fromState)) {
				rowNum = j;
				break;
			}
		}

		if (transition.symbol === toc.fsm.epsilonSymbol) {
			colNum = headers.length - 2;
		} else {
			for (j = 0; j < fsm.alphabet.length; j++) {
				if (toc.util.areEquivalent(fsm.alphabet[j], transition.symbol)) {
					colNum = j + 1;
					break;
				}
			}
		}

		if (typeof tableRows[rowNum][colNum].text === "undefined") {
			tableRows[rowNum][colNum] = {text: []};
		}

		tableRows[rowNum][colNum].text.push(transition.toStates);
	}

	var htmlString = [];

	htmlString.push("<table border='1'>");
	htmlString.push("  <tr>");

	for (i = 0; i < headers.length; i++) {
		htmlString.push("    <th>" + headers[i].toString() + "</th>");
	}

	htmlString.push("  </tr>");

	for (i = 0; i < tableRows.length; i++) {
		htmlString.push("  <tr>");
		for (j = 0; j < tableRows[i].length; j++) {
			htmlString.push("    <td>" + tableRows[i][j].text + "</td>");
		}

		htmlString.push("  </tr>");
	}

	htmlString.push("</table>");
	return htmlString.join("\n");
};

// print the fsm in
// the graphviz dot format
toc.fsm.printDotFormat = function (fsm) {
	var result = ["digraph finite_state_machine {", "  rankdir=LR;"];
	var accStates = ["  node [shape = doublecircle];"];

	var i, j, k, trans;

	for (i = 0; i < fsm.acceptingStates.length; i++) {
		accStates.push(fsm.acceptingStates[i].toString());
	}

	accStates.push(";");
	if (accStates.length > 2) {
		result.push(accStates.join(" "));
	}
	result.push("  node [shape = circle];");
	result.push("  secret_node [style=invis, shape=point];");

	// how in the holy hell is this shit going on
	//var initState = ['  {rank = source; "'];
	//initState.push(fsm.initialState.toString());
	//initState.push('" "secret_node"}');
	//result.push(initState.join(""));

	var initStateArrow = ["  secret_node ->"];
	initStateArrow.push(fsm.initialState.toString());
	initStateArrow.push("[style=bold];");
	result.push(initStateArrow.join(" "));

	var newTransitions = [];

	for (i = 0; i < fsm.transitions.length; i++) {
		for (j = 0; j < fsm.transitions[i].toStates.length; j++) {
			var found = null;

			for (k = 0; k < newTransitions.length; k++) {
				if (
					toc.util.areEquivalent(
						newTransitions[k].fromState,
						fsm.transitions[i].fromState
					) &&
					toc.util.areEquivalent(newTransitions[k].toStates, [
						fsm.transitions[i].toStates[j],
					])
				) {
					found = newTransitions[k];
				}
			}

			if (found === null) {
				var newTransition = toc.util.clone(fsm.transitions[i]);
				newTransition.toStates = [newTransition.toStates[j]];
				newTransition.symbol = [newTransition.symbol];
				newTransitions.push(newTransition);
			} else {
				found.symbol.push(fsm.transitions[i].symbol);
			}
		}
	}

	for (i = 0; i < newTransitions.length; i++) {
		if (
			toc.util.areEquivalent(newTransitions[i].toStates[0], fsm.initialState)
		) {
			trans = [" "];
			trans.push(newTransitions[i].toStates[0].toString());
			trans.push("->");
			trans.push(newTransitions[i].fromState.toString());
			trans.push("[");
			trans.push("label =");
			trans.push('"' + newTransitions[i].symbol.toString() + '"');
			trans.push(" dir = back];");
			result.push(trans.join(" "));
		} else {
			trans = [" "];
			trans.push(newTransitions[i].fromState.toString());
			trans.push("->");
			trans.push(newTransitions[i].toStates[0].toString());
			trans.push("[");
			trans.push("label =");
			trans.push('"' + newTransitions[i].symbol.toString() + '"');
			trans.push(" ];");
			result.push(trans.join(" "));
		}
	}

	result.push("}");

	console.log(result);

	return result.join("\n").replace(/\$/g, "$");
};

// determine reachable
//  states
toc.fsm.getReachableStates = function (fsm, state, shouldIncludeInitialState) {
	var unprocessedStates = [state],
		i,
		j;
	var reachableStates = shouldIncludeInitialState ? [state] : [];

	while (unprocessedStates.length !== 0) {
		var currentState = unprocessedStates.pop();

		for (i = 0; i < fsm.transitions.length; i++) {
			var transition = fsm.transitions[i];

			if (toc.util.areEquivalent(currentState, transition.fromState)) {
				for (j = 0; j < transition.toStates.length; j++) {
					if (!toc.util.contains(reachableStates, transition.toStates[j])) {
						reachableStates.push(transition.toStates[j]);

						if (
							!toc.util.contains(unprocessedStates, transition.toStates[j])
						) {
							unprocessedStates.push(transition.toStates[j]);
						}
					}
				}
			}
		}
	}

	return reachableStates;
};

// determine and remove
//  unreachable states
toc.fsm.removeUnreachableStates = function (fsm) {
	var reachableStates = toc.fsm.getReachableStates(
		fsm,
		fsm.initialState,
		true
	);
	var newFsm = toc.util.clone(fsm),
		i;
	newFsm.states = [];
	newFsm.acceptingStates = [];
	newFsm.transitions = [];

	for (i = 0; i < fsm.states.length; i++) {
		if (toc.util.contains(reachableStates, fsm.states[i])) {
			newFsm.states.push(toc.util.clone(fsm.states[i]));
		}
	}

	for (i = 0; i < fsm.acceptingStates.length; i++) {
		if (toc.util.contains(reachableStates, fsm.acceptingStates[i])) {
			newFsm.acceptingStates.push(toc.util.clone(fsm.acceptingStates[i]));
		}
	}

	for (i = 0; i < fsm.transitions.length; i++) {
		if (toc.util.contains(reachableStates, fsm.transitions[i].fromState)) {
			newFsm.transitions.push(toc.util.clone(fsm.transitions[i]));
		}
	}

	return newFsm;
};

// determines if two states from
// potentially different fsms are equivalent
toc.fsm.areEquivalentStates = function (fsmA, stateA, fsmB, stateB) {
	if (
		toc.fsm.determineType(fsmA) !== toc.fsm.dfaType ||
		toc.fsm.determineType(fsmB) !== toc.fsm.dfaType
	) {
		throw new Error("FSMs must be DFAs");
	}

	if (
		fsmA.alphabet.length !== fsmB.alphabet.length ||
		!toc.util.containsAll(fsmA.alphabet, fsmB.alphabet)
	) {
		throw new Error("FSM alphabets must be the same");
	}

	if (
		!toc.util.contains(fsmA.states, stateA) ||
		!toc.util.contains(fsmB.states, stateB)
	) {
		throw new Error("FSMs must contain states");
	}

	function doBothStatesHaveSameAcceptance(fsmX, stateX, fsmY, stateY) {
		var stateXAccepting = toc.util.contains(fsmX.acceptingStates, stateX);
		var stateYAccepting = toc.util.contains(fsmY.acceptingStates, stateY);

		return (
			(stateXAccepting && stateYAccepting) ||
			(!stateXAccepting && !stateYAccepting)
		);
	}

	var unprocessedPairs = [[stateA, stateB]];
	var processedPairs = [],
		i,
		j;

	while (unprocessedPairs.length !== 0) {
		var currentPair = unprocessedPairs.pop();

		if (
			!doBothStatesHaveSameAcceptance(
				fsmA,
				currentPair[0],
				fsmB,
				currentPair[1]
			)
		) {
			return false;
		}

		processedPairs.push(currentPair);

		for (j = 0; j < fsmA.alphabet.length; j++) {
			var pair = [
				toc.fsm.makeTransition(fsmA, [currentPair[0]], fsmA.alphabet[j])[0],
				toc.fsm.makeTransition(fsmB, [currentPair[1]], fsmA.alphabet[j])[0],
			];

			if (
				!toc.util.contains(processedPairs, pair) &&
				!toc.util.contains(unprocessedPairs, pair)
			) {
				unprocessedPairs.push(pair);
			}
		}
	}

	return true;
};

// determines if two fsms are equivalent
//  by testing equivalence of starting states
toc.fsm.areEquivalentFSMs = function (fsmA, fsmB) {
	return toc.fsm.areEquivalentStates(
		fsmA,
		fsmA.initialState,
		fsmB,
		fsmB.initialState
	);
};

// finds and removes
// equivalent states
toc.fsm.removeEquivalentStates = function (fsm) {
	if (toc.fsm.determineType(fsm) !== toc.fsm.dfaType) {
		throw new Error("FSM must be DFA");
	}

	var equivalentPairs = [],
		i,
		j,
		k;

	for (i = 0; i < fsm.states.length; i++) {
		for (j = i + 1; j < fsm.states.length; j++) {
			if (
				toc.fsm.areEquivalentStates(fsm, fsm.states[i], fsm, fsm.states[j])
			) {
				var pair = [fsm.states[i], fsm.states[j]];

				for (k = 0; k < equivalentPairs.length; k++) {
					if (toc.util.areEquivalent(equivalentPairs[k][1], pair[0])) {
						pair[0] = equivalentPairs[k][1];
						break;
					}
				}

				if (!toc.util.contains(equivalentPairs, pair)) {
					equivalentPairs.push(pair);
				}
			}
		}
	}

	var newFsm = {
		states: [],
		alphabet: toc.util.clone(fsm.alphabet),
		initialState: [],
		acceptingStates: [],
		transitions: [],
	};

	function isOneOfEquivalentStates(s) {
		for (var i = 0; i < equivalentPairs.length; i++) {
			if (toc.util.areEquivalent(equivalentPairs[i][1], s)) {
				return true;
			}
		}

		return false;
	}

	function getEquivalentState(s) {
		for (var i = 0; i < equivalentPairs.length; i++) {
			if (toc.util.areEquivalent(equivalentPairs[i][1], s)) {
				return equivalentPairs[i][0];
			}
		}

		return s;
	}

	for (i = 0; i < fsm.states.length; i++) {
		if (!isOneOfEquivalentStates(fsm.states[i])) {
			newFsm.states.push(toc.util.clone(fsm.states[i]));
		}
	}

	for (i = 0; i < fsm.acceptingStates.length; i++) {
		if (!isOneOfEquivalentStates(fsm.acceptingStates[i])) {
			newFsm.acceptingStates.push(toc.util.clone(fsm.acceptingStates[i]));
		}
	}

	newFsm.initialState = toc.util.clone(getEquivalentState(fsm.initialState));

	for (i = 0; i < fsm.transitions.length; i++) {
		var transition = toc.util.clone(fsm.transitions[i]);

		if (isOneOfEquivalentStates(transition.fromState)) {
			continue;
		}

		for (j = 0; j < transition.toStates.length; j++) {
			transition.toStates[j] = getEquivalentState(transition.toStates[j]);
		}

		newFsm.transitions.push(transition);
	}

	return newFsm;
};

// minimizes the fsm by removing
// unreachable and equivalent states
toc.fsm.minimize = function (fsm) {
	var fsmType = toc.fsm.determineType(fsm);
	var newFsm = fsm;

	if (fsmType === toc.fsm.nfaType) {
		newFsm = toc.fsm.convertNfaToDfa(fsm);
	} else if (fsmType === toc.fsm.enfaType) {
		newFsm = toc.fsm.convertEnfaToNfa(fsm);
		newFsm = toc.fsm.convertNfaToDfa(newFsm);
	}

	var fsmWithoutUnreachableStates = toc.fsm.removeUnreachableStates(newFsm);
	var minimalFsm = toc.fsm.removeEquivalentStates(fsmWithoutUnreachableStates);
	return minimalFsm;
};

toc.fsm.convertStatesToNumbers = function (fsm) {
	var newFsm = toc.fsm.makeNew();
	var mapping = {};

	for (i = 0; i < fsm.states.length; i++) {
		mapping[fsm.states[i].toString()] = i;
	}

	newFsm.alphabet = toc.util.clone(fsm.alphabet);

	for (i = 0; i < fsm.states.length; i++) {
		toc.fsm.addState(newFsm, mapping[fsm.states[i].toString()]);
	}

	toc.fsm.setInitialState(newFsm, mapping[fsm.initialState.toString()]);

	for (i = 0; i < fsm.acceptingStates.length; i++) {
		toc.fsm.addAcceptingState(
			newFsm,
			mapping[fsm.acceptingStates[i].toString()]
		);
	}

	for (i = 0; i < fsm.transitions.length; i++) {
		var newToStates = [];

		for (j = 0; j < fsm.transitions[i].toStates.length; j++) {
			newToStates.push(mapping[fsm.transitions[i].toStates[j].toString()]);
		}

		toc.fsm.addTransition(
			newFsm,
			mapping[fsm.transitions[i].fromState.toString()],
			newToStates,
			fsm.transitions[i].symbol
		);
	}

	return newFsm;
};

// generate random fsm
toc.fsm.createRandomFsm = function (
	fsmType,
	numStates,
	numAlphabet,
	maxNumToStates
) {
	var newFsm = {},
		i,
		j,
		k;

	function prefix(ch, num, str) {
		var retStr = str;

		for (var i = 0; i < str.length - num; i++) {
			retStr = ch + str;
		}

		return retStr;
	}

	newFsm.states = [];
	for (i = 0, len = numStates.toString().length; i < numStates; i++) {
		newFsm.states.push("s" + prefix("0", len, i.toString()));
	}

	newFsm.alphabet = [];

	if (numAlphabet > 26) {
		for (i = 0, len = numAlphabet.toString().length; i < numAlphabet; i++) {
			newFsm.alphabet.push("a" + prefix("0", len, i.toString()));
		}
	} else {
		newFsm.alphabet = "abcdefghijklmnopqrstuvwxyz"
			.substr(0, numAlphabet)
			.split("");
	}

	newFsm.initialState = newFsm.states[0];

	newFsm.acceptingStates = [];
	for (i = 0; i < numStates; i++) {
		if (Math.round(Math.random())) {
			newFsm.acceptingStates.push(newFsm.states[i]);
		}
	}

	if (fsmType === toc.fsm.enfaType) {
		newFsm.alphabet.push(toc.fsm.epsilonSymbol);
	}

	newFsm.transitions = [];
	for (i = 0; i < numStates; i++) {
		for (j = 0; j < newFsm.alphabet.length; j++) {
			var numToStates = 1;

			if (fsmType !== toc.fsm.dfaType) {
				numToStates = Math.floor(Math.random() * maxNumToStates);
			}

			if (numToStates > 0) {
				var toStates = [];
				for (
					k = 0;
					k < newFsm.states.length && toStates.length < numToStates;
					k++
				) {
					var diff =
						newFsm.states.length - k - (numToStates - toStates.length) + 1;

					if (diff <= 0) {
						diff = 1;
					} else {
						diff = 1 / diff;
					}

					if (Math.random() <= diff) {
						toStates.push(newFsm.states[k]);
					}
				}

				newFsm.transitions.push({
					fromState: newFsm.states[i],
					symbol: newFsm.alphabet[j],
					toStates: toStates,
				});
			}
		}
	}

	if (fsmType === toc.fsm.enfaType) {
		newFsm.alphabet.pop();
	}

	return newFsm;
};

toc.fsm.convertNfaToDfa = function (fsm) {
	var fsmType = toc.fsm.determineType(fsm);
	if (fsmType === toc.fsm.enfaType) {
		throw new Error("FSM must be an NFA");
	}

	if (fsmType === toc.fsm.dfaType) {
		return fsm; // no need to convert it
	}

	var newFsm = {},
		i,
		j,
		k,
		transition;

	newFsm.alphabet = toc.util.clone(fsm.alphabet);
	newFsm.states = [];
	newFsm.acceptingStates = [];
	newFsm.initialState = [toc.util.clone(fsm.initialState)];
	newFsm.transitions = [];

	for (i = 0; i < fsm.states.length; i++) {
		newFsm.states.push([toc.util.clone(fsm.states[i])]);
	}

	for (i = 0; i < fsm.acceptingStates.length; i++) {
		newFsm.acceptingStates.push([toc.util.clone(fsm.acceptingStates[i])]);
	}

	var newStates = [];
	var multiStates = [];

	for (i = 0; i < fsm.transitions.length; i++) {
		transition = toc.util.clone(fsm.transitions[i]);
		transition.fromState = [transition.fromState];

		transition.toStates = [transition.toStates];

		if (transition.toStates[0].length > 1) {
			if (!toc.util.containsSet(newStates, transition.toStates[0])) {
				newStates.push(transition.toStates[0]);
			}
		}

		newFsm.transitions.push(transition);
	}

	while (newStates.length !== 0) {
		var state = newStates.pop();

		newFsm.states.push(state);

		if (toc.util.containsAny(fsm.acceptingStates, state)) {
			newFsm.acceptingStates.push(state);
		}

		for (i = 0; i < newFsm.alphabet.length; i++) {
			var ts = toc.fsm.makeTransition(fsm, state, newFsm.alphabet[i]).sort();

			for (j = 0; j < newFsm.states.length; j++) {
				if (toc.util.areEqualSets(ts, newFsm.states[j])) {
					ts = newFsm.states[j];
					break;
				}
			}

			for (j = 0; j < newStates.length; j++) {
				if (toc.util.areEqualSets(ts, newStates[j])) {
					ts = newStates[j];
					break;
				}
			}

			if (ts.length > 0) {
				newFsm.transitions.push({
					fromState: state,
					symbol: newFsm.alphabet[i],
					toStates: [ts],
				});
			}

			if (
				!toc.util.containsSet(newFsm.states, ts) &&
				!toc.util.containsSet(newStates, ts) &&
				ts.length > 1
			) {
				newStates.push(ts);
			}
		}
	}

	var errorAdded = false;
	var errorState = "DEAD";

	for (i = 0; i < newFsm.states.length; i++) {
		for (j = 0; j < newFsm.alphabet.length; j++) {
			var found = false;
			for (k = 0; k < newFsm.transitions.length; k++) {
				transition = newFsm.transitions[k];

				if (
					toc.util.areEquivalent(transition.symbol, newFsm.alphabet[j]) &&
					toc.util.areEquivalent(transition.fromState, newFsm.states[i])
				) {
					found = true;
					break;
				}
			}

			if (found === false) {
				if (errorAdded === false) {
					newFsm.states.push([errorState]);
					errorAdded = true;
				}

				newFsm.transitions.push({
					fromState: newFsm.states[i],
					symbol: newFsm.alphabet[j],
					toStates: [[errorState]],
				});
			}
		}
	}

	return newFsm;
};

toc.fsm.convertEnfaToNfa = function (fsm) {
	if (toc.fsm.determineType(fsm) !== toc.fsm.enfaType) {
		return fsm; // this is already an NFA (or a DFA which is also an NFA)
	}

	var newFsm = toc.util.clone(fsm),
		i,
		j;

	var initialEpsilon = toc.fsm.computeEpsilonClosure(fsm, [fsm.initialState]);

	if (
		toc.util.containsAny(newFsm.acceptingStates, initialEpsilon) &&
		!toc.util.contains(newFsm.acceptingStates, newFsm.initialState)
	) {
		newFsm.acceptingStates.push(newFsm.initialState);
	}

	var newTransitions = [];

	for (i = 0; i < newFsm.states.length; i++) {
		for (j = 0; j < newFsm.alphabet.length; j++) {
			var toStates = toc.fsm
				.makeTransition(newFsm, [newFsm.states[i]], newFsm.alphabet[j])
				.sort();

			if (toStates.length > 0) {
				newTransitions.push({
					fromState: newFsm.states[i],
					toStates: toStates,
					symbol: newFsm.alphabet[j],
				});
			}
		}
	}

	newFsm.transitions = newTransitions;

	var multiStateTransitions = [];

	for (i = 0; i < newFsm.transitions.length; i++) {
		var transition = newFsm.transitions[i];

		if (transition.toStates.length > 1) {
			var existing = false;

			for (j = 0; j < multiStateTransitions.length; j++) {
				if (
					toc.util.areEqualSets(transition.toStates, multiStateTransitions[j])
				) {
					transition.toStates = multiStateTransitions[j];
					existing = true;
					break;
				}
			}

			if (existing === false) {
				multiStateTransitions.push(transition.toStates);
			}
		}
	}

	return newFsm;
};

// test whether if the language accepted
// by the fsm contains at least one string
toc.fsm.isLanguageNonEmpty = function (fsm) {
	var fsmType = toc.fsm.determineType(fsm);
	var newFsm = fsm;

	if (fsmType === toc.fsm.nfaType) {
		newFsm = toc.fsm.convertNfaToDfa(fsm);
	} else if (fsmType === toc.fsm.enfaType) {
		newFsm = toc.fsm.convertEnfaToNfa(fsm);
		newFsm = toc.fsm.convertNfaToDfa(newFsm);
	}

	newFsm = toc.fsm.minimize(newFsm);

	return newFsm.acceptingStates.length > 0;
};

toc.fsm.isLanguageInfinite = function (fsm) {
	var fsmType = toc.fsm.determineType(fsm);
	var newFsm = fsm;

	if (fsmType === toc.fsm.nfaType) {
		newFsm = toc.fsm.convertNfaToDfa(fsm);
	} else if (fsmType === toc.fsm.enfaType) {
		newFsm = toc.fsm.convertEnfaToNfa(fsm);
		newFsm = toc.fsm.convertNfaToDfa(newFsm);
	}

	newFsm = toc.fsm.minimize(newFsm);

	var deadState = null,
		i,
		reachable;

	for (i = 0; i < newFsm.states.length; i++) {
		if (toc.util.contains(newFsm.acceptingStates, newFsm.states[i])) {
			continue;
		}

		reachable = toc.fsm.getReachableStates(newFsm, newFsm.states[i], true);

		if (toc.util.containsAny(newFsm.acceptingStates, reachable)) {
			continue;
		}

		deadState = newFsm.states[i];
		break;
	}

	if (deadState === null) {
		return true;
	}

	for (i = 0; i < newFsm.states.length; i++) {
		if (toc.util.areEquivalent(deadState, newFsm.states[i])) {
			continue;
		}

		reachable = toc.fsm.getReachableStates(newFsm, newFsm.states[i], false);

		if (toc.util.contains(reachable, newFsm.states[i])) {
			return true;
		}
	}

	return false;
};

// generate a random string
//  which the fsm accepts
toc.fsm.randomStringInLanguage = function (fsm) {
	var fsmType = toc.fsm.determineType(fsm);
	var newFsm = fsm;

	if (fsmType === toc.fsm.nfaType) {
		newFsm = toc.fsm.convertNfaToDfa(fsm);
	} else if (fsmType === toc.fsm.enfaType) {
		newFsm = toc.fsm.convertEnfaToNfa(fsm);
		newFsm = toc.fsm.convertNfaToDfa(newFsm);
	}

	newFsm = toc.fsm.minimize(newFsm);

	if (newFsm.acceptingStates.length === 0) {
		return null;
	}

	var currentState =
		newFsm.acceptingStates[
			Math.floor(Math.random() * newFsm.acceptingStates.length)
		];
	var trail = [];

	while (true) {
		if (toc.util.areEquivalent(currentState, newFsm.initialState) === true) {
			if (Math.round(Math.random())) {
				break;
			}
		}

		var transitions = [],
			i;

		for (i = 0; i < newFsm.transitions.length; i++) {
			if (
				toc.util.areEquivalent(newFsm.transitions[i].toStates[0], currentState)
			) {
				transitions.push(newFsm.transitions[i]);
			}
		}

		if (transitions.length === 0) {
			break;
		}

		var transition =
			transitions[Math.floor(Math.random() * transitions.length)];

		trail.push(transition.symbol);
		currentState = transition.fromState;
	}

	trail.reverse();

	return trail;
};

// generate a random string
//  which the fsm doest accept
toc.fsm.randomStringNotInLanguage = function (fsm) {
	var fsmType = toc.fsm.determineType(fsm);
	var newFsm = fsm;

	if (fsmType === toc.fsm.nfaType) {
		newFsm = toc.fsm.convertNfaToDfa(fsm);
	} else if (fsmType === toc.fsm.enfaType) {
		newFsm = toc.fsm.convertEnfaToNfa(fsm);
		newFsm = toc.fsm.convertNfaToDfa(newFsm);
	}

	newFsm = toc.fsm.minimize(newFsm);

	var nonAcceptingStates = [],
		i;

	for (i = 0; i < newFsm.states.length; i++) {
		if (!toc.util.contains(newFsm.acceptingStates, newFsm.states[i])) {
			nonAcceptingStates.push(newFsm.states[i]);
		}
	}

	if (nonAcceptingStates.length === 0) {
		return null;
	}

	var currentState =
		nonAcceptingStates[Math.floor(Math.random() * nonAcceptingStates.length)];
	var trail = [];

	while (true) {
		if (toc.util.areEquivalent(currentState, newFsm.initialState) === true) {
			if (Math.round(Math.random())) {
				break;
			}
		}

		var transitions = [];

		for (i = 0; i < newFsm.transitions.length; i++) {
			if (
				toc.util.areEquivalent(newFsm.transitions[i].toStates[0], currentState)
			) {
				transitions.push(newFsm.transitions[i]);
			}
		}

		if (transitions.length === 0) {
			break;
		}

		var transition =
			transitions[Math.floor(Math.random() * transitions.length)];

		trail.push(transition.symbol);
		currentState = transition.fromState;
	}

	trail.reverse();

	return trail;
};

// get a new fsm which accepts the
//  language L=L1+L2 (set union) where
// L1 is the language accepted by fsma and
// L2 is the language accepted by fsmB
toc.fsm.union = function (fsmA, fsmB) {
	if (!toc.util.areEquivalent(fsmA.alphabet, fsmB.alphabet)) {
		throw new Error("Alphabets must be the same");
	}

	var newFsm = {
		alphabet: toc.util.clone(fsmA.alphabet),
		states: [],
		initialState: [
			toc.util.clone(fsmA.initialState),
			toc.util.clone(fsmB.initialState),
		],
		acceptingStates: [],
		transitions: [],
	};

	var i, j, k;

	for (i = 0; i < fsmA.states.length; i++) {
		for (j = 0; j < fsmB.states.length; j++) {
			var newState = [
				toc.util.clone(fsmA.states[i]),
				toc.util.clone(fsmB.states[j]),
			];
			newFsm.states.push(newState);

			if (
				toc.util.contains(fsmA.acceptingStates, fsmA.states[i]) ||
				toc.util.contains(fsmB.acceptingStates, fsmB.states[j])
			) {
				newFsm.acceptingStates.push(newState);
			}

			for (k = 0; k < newFsm.alphabet.length; k++) {
				newFsm.transitions.push({
					fromState: newState,
					symbol: newFsm.alphabet[k],
					toStates: [
						[
							toc.fsm.makeTransition(
								fsmA,
								[fsmA.states[i]],
								newFsm.alphabet[k]
							)[0],
							toc.fsm.makeTransition(
								fsmB,
								[fsmB.states[j]],
								newFsm.alphabet[k]
							)[0],
						],
					],
				});
			}
		}
	}

	return newFsm;
};

// get a new fsm which accepts the language
//  L=L1/L2 (set intersection) where
// L1 is the language accepted by fsma and
// L2 is the language accepted by fsmB
toc.fsm.intersection = function (fsmA, fsmB) {
	var new_alphabet = toc.util.clone(
		toc.util.setIntersection(fsmA.alphabet, fsmB.alphabet)
	);

	var newFsm = {
		alphabet: new_alphabet,
		states: [],
		initialState: [
			toc.util.clone(fsmA.initialState),
			toc.util.clone(fsmB.initialState),
		],
		acceptingStates: [],
		transitions: [],
	};

	var i, j, k;

	for (i = 0; i < fsmA.states.length; i++) {
		for (j = 0; j < fsmB.states.length; j++) {
			var newState = [
				toc.util.clone(fsmA.states[i]),
				toc.util.clone(fsmB.states[j]),
			];
			newFsm.states.push(newState);

			if (
				toc.util.contains(fsmA.acceptingStates, fsmA.states[i]) &&
				toc.util.contains(fsmB.acceptingStates, fsmB.states[j])
			) {
				newFsm.acceptingStates.push(newState);
			}

			for (k = 0; k < newFsm.alphabet.length; k++) {
				newFsm.transitions.push({
					fromState: newState,
					symbol: newFsm.alphabet[k],
					toStates: [
						[
							toc.fsm.makeTransition(
								fsmA,
								[fsmA.states[i]],
								newFsm.alphabet[k]
							)[0],
							toc.fsm.makeTransition(
								fsmB,
								[fsmB.states[j]],
								newFsm.alphabet[k]
							)[0],
						],
					],
				});
			}
		}
	}

	return newFsm;
};

// get a new fsm which accepts the language
// L=L1-L2 (set difference) where
// L1 is the language accepted by fsma and
// L2 is the language accepted by fsmB
toc.fsm.difference = function (fsmA, fsmB) {
	if (!toc.util.areEquivalent(fsmA.alphabet, fsmB.alphabet)) {
		throw new Error("Alphabets must be the same");
	}

	var newFsm = {
		alphabet: toc.util.clone(fsmA.alphabet),
		states: [],
		initialState: [
			toc.util.clone(fsmA.initialState),
			toc.util.clone(fsmB.initialState),
		],
		acceptingStates: [],
		transitions: [],
	};

	var i, j, k;

	for (i = 0; i < fsmA.states.length; i++) {
		for (j = 0; j < fsmB.states.length; j++) {
			var newState = [
				toc.util.clone(fsmA.states[i]),
				toc.util.clone(fsmB.states[j]),
			];
			newFsm.states.push(newState);

			if (
				toc.util.contains(fsmA.acceptingStates, fsmA.states[i]) &&
				!toc.util.contains(fsmB.acceptingStates, fsmB.states[j])
			) {
				newFsm.acceptingStates.push(newState);
			}

			for (k = 0; k < newFsm.alphabet.length; k++) {
				newFsm.transitions.push({
					fromState: newState,
					symbol: newFsm.alphabet[k],
					toStates: [
						[
							toc.fsm.makeTransition(
								fsmA,
								[fsmA.states[i]],
								newFsm.alphabet[k]
							)[0],
							toc.fsm.makeTransition(
								fsmB,
								[fsmB.states[j]],
								newFsm.alphabet[k]
							)[0],
						],
					],
				});
			}
		}
	}

	return newFsm;
};

// get a new fsm which accepts
// the complement language of the
// langauge accepted by the input fsm
toc.fsm.complement = function (fsm) {
	var newFsm = toc.util.clone(fsm);

	var newAccepting = [],
		i;

	for (i = 0; i < newFsm.states.length; i++) {
		if (!toc.util.contains(newFsm.acceptingStates, newFsm.states[i])) {
			newAccepting.push(newFsm.states[i]);
		}
	}

	newFsm.acceptingStates = newAccepting;

	return newFsm;
};

// get a new fsm which accepts
// the language L1L2 where
// L1 is the language accepted by fsmA and L2 is the
// langauge accepted by fsmB
toc.fsm.concatenation = function (fsmA, fsmB) {
	if (!toc.util.areEquivalent(fsmA.alphabet, fsmB.alphabet)) {
		throw new Error("Alphabets must be the same");
	}

	if (toc.util.containsAny(fsmA.states, fsmB.states)) {
		throw new Error("States must not overlap");
	}

	var newFsm = {
		alphabet: toc.util.clone(fsmA.alphabet),
		states: toc.util.clone(fsmA.states).concat(toc.util.clone(fsmB.states)),
		initialState: toc.util.clone(fsmA.initialState),
		acceptingStates: toc.util.clone(fsmB.acceptingStates),
		transitions: toc.util
			.clone(fsmA.transitions)
			.concat(toc.util.clone(fsmB.transitions)),
	};

	for (var i = 0; i < fsmA.acceptingStates.length; i++) {
		newFsm.transitions.push({
			fromState: toc.util.clone(fsmA.acceptingStates[i]),
			toStates: [toc.util.clone(fsmB.initialState)],
			symbol: toc.fsm.epsilonSymbol,
		});
	}

	return newFsm;
};

// get a new fsm which accepts the language L*,
// where L is
// accepted by the input fsm and * is the kleene operator
toc.fsm.kleene = function (fsm) {
	var newFsm = toc.util.clone(fsm);

	var newInitial = "NEW_INITIAL";

	newFsm.states.push(newInitial);
	newFsm.transitions.push({
		fromState: newInitial,
		toStates: [newFsm.initialState],
		symbol: toc.fsm.epsilonSymbol,
	});
	newFsm.initialState = newInitial;

	for (var i = 0; i < newFsm.acceptingStates.length; i++) {
		newFsm.transitions.push({
			fromState: newFsm.acceptingStates[i],
			toStates: [newInitial],
			symbol: toc.fsm.epsilonSymbol,
		});
	}

	return newFsm;
};

// get a new fsm which accepts
// the reverse language of the input fsm
toc.fsm.reverse = function (fsm) {
	var newFsm = toc.util.clone(fsm);

	var newTransitions = [];

	for (var i = 0; i < newFsm.transitions.length; i++) {
		for (var j = 0; j < newFsm.transitions[i].toStates.length; j++) {
			newTransitions.push({
				fromState: newFsm.transitions[i].toStates[j],
				toStates: [newFsm.transitions[i].fromState],
				symbol: newFsm.transitions[i].symbol,
			});
		}
	}

	newFsm.transitions = newTransitions;

	var oldAcceptingStates = newFsm.acceptingStates;

	newFsm.acceptingStates = [newFsm.initialState];

	var newInitialState = "NEW_INITIAL";
	newFsm.states.push(newInitialState);
	newFsm.initialState = newInitialState;

	newFsm.transitions.push({
		fromState: newInitialState,
		toStates: oldAcceptingStates,
		symbol: toc.fsm.epsilonSymbol,
	});

	return newFsm;
};

// check whether the language accepted by fsmB is a subset of
// the language accepted by fsmA
toc.fsm.isSubset = function (fsmA, fsmB) {
	var fsmIntersection = toc.fsm.intersection(fsmA, fsmB);

	return toc.fsm.areEquivalentFSMs(fsmB, fsmIntersection);
};

// convert the fsm
// into a regular grammar
toc.fsm.grammar = function (fsm) {
	var grammar = {
		nonterminals: toc.util.clone(fsm.states),
		terminals: toc.util.clone(fsm.alphabet),
		initialNonterminal: toc.util.clone(fsm.initialState),
		productions: [],
	};

	var i;

	for (i = 0; i < fsm.transitions.length; i++) {
		if (fsm.transitions[i].symbol === toc.fsm.epsilonSymbol) {
			grammar.productions.push({
				left: [toc.util.clone(fsm.transitions[i].fromState)],
				right: toc.util.clone(fsm.transitions[i].toStates),
			});
		} else {
			grammar.productions.push({
				left: [toc.util.clone(fsm.transitions[i].fromState)],
				right: [toc.util.clone(fsm.transitions[i].symbol)].concat(
					toc.util.clone(fsm.transitions[i].toStates)
				),
			});
		}
	}

	for (i = 0; i < fsm.acceptingStates.length; i++) {
		grammar.productions.push({
			left: [toc.util.clone(fsm.acceptingStates[i])],
			right: [toc.grammar.epsilonSymbol],
		});
	}

	return grammar;
};

toc.fsm.symbolsForTransitions = function (fsm, stateA, stateB) {
	var res = [];

	for (var i = 0; i < fsm.transitions.length; i++) {
		var transition = fsm.transitions[i];

		if (
			toc.util.areEquivalent(transition.fromState, stateA) &&
			toc.util.contains(transition.toStates, stateB)
		) {
			res.push(transition.symbol);
		}
	}

	return res;
};

toc.fsm.toRegex = function (fsm) {
	var r = [];
	var n = fsm.states.length;

	var i, j, k, z;

	for (k = 0; k < n + 1; k++) {
		r[k] = [];
		for (i = 0; i < n; i++) {
			r[k][i] = [];
		}
	}

	for (i = 0; i < n; i++) {
		for (j = 0; j < n; j++) {
			var symbols = toc.fsm.symbolsForTransitions(
				fsm,
				fsm.states[i],
				fsm.states[j]
			);

			for (z = 0; z < symbols.length; z++) {
				symbols[z] = toc.re.tree.makeLit(symbols[z]);
			}

			if (i === j) {
				symbols.push(toc.re.tree.makeEps());
			}

			r[0][i][j] = toc.re.tree.makeAlt(symbols);
		}
	}

	for (k = 1; k < n + 1; k++) {
		for (i = 0; i < n; i++) {
			for (j = 0; j < n; j++) {
				var t1 =
					(typeof r[k - 1][i][k - 1].choices !== "undefined" &&
						r[k - 1][i][k - 1].choices.length === 0) ||
					(typeof r[k - 1][k - 1][j].choices !== "undefined" &&
						r[k - 1][k - 1][j].choices.length === 0) ||
					(typeof r[k - 1][k - 1][k - 1].choices !== "undefined" &&
						r[k - 1][k - 1][k - 1].choices.length === 0);
				var t2 =
					typeof r[k - 1][i][j].choices !== "undefined" &&
					r[k - 1][i][j].choices.length === 0;

				var seq = null;

				if (r[k - 1][k - 1][k - 1].tag === toc.re.tree.tags.EPS) {
					seq = toc.re.tree.makeSeq([r[k - 1][i][k - 1], r[k - 1][k - 1][j]]);
				} else {
					seq = toc.re.tree.makeSeq([
						r[k - 1][i][k - 1],
						toc.re.tree.makeKStar(r[k - 1][k - 1][k - 1]),
						r[k - 1][k - 1][j],
					]);
				}

				var alt = [];

				if (!t2) {
					alt.push(r[k - 1][i][j]);
				}

				if (!t1) {
					alt.push(seq);
				}

				alt = toc.re.tree.makeAlt(alt);

				r[k][i][j] = alt;
			}
		}
	}

	var startStateIndex = -1;
	var acceptableStatesIndexes = [];

	for (i = 0; i < fsm.states.length; i++) {
		if (toc.util.areEquivalent(fsm.states[i], fsm.initialState)) {
			startStateIndex = i;
		}

		if (toc.util.contains(fsm.acceptingStates, fsm.states[i])) {
			acceptableStatesIndexes.push(i);
		}
	}

	var elements = [];

	for (i = 0; i < acceptableStatesIndexes.length; i++) {
		elements.push(r[n][startStateIndex][acceptableStatesIndexes[i]]);
	}

	return toc.re.tree.makeAlt(elements);
};
