
			let originalDFA = null;
			let minimizedDFA = null;
			let manualStates = [];
			let manualTransitions = [];

			function updateStateDropdowns() {
				const fromState = $("#fromState");
				const toState = $("#toState");
				fromState.empty();
				toState.empty();
				manualStates.forEach((state) => {
					fromState.append(
						$("<option></option>").text(state.name).attr("value", state.name)
					);
					toState.append(
						$("<option></option>").text(state.name).attr("value", state.name)
					);
				});
			}

			$("#addState").click(function () {
				const name = $("#stateName").val().trim();
				if (!name) {
					alert("State name cannot be empty");
					return;
				}
				if (manualStates.some((s) => s.name === name)) {
					alert("State name must be unique");
					return;
				}
				const isInitial = $("#isInitial").is(":checked");
				if (isInitial) {
					manualStates.forEach((s) => (s.isInitial = false));
				}
				const isAccepting = $("#isAccepting").is(":checked");
				manualStates.push({
					name: name,
					isInitial: isInitial,
					isAccepting: isAccepting,
				});

				$("#stateName").val("");
				$("#isInitial").prop("checked", false);
				$("#isAccepting").prop("checked", false);
				updateStateDropdowns();

				const stateList = $("#stateList");
				stateList.empty();
				manualStates.forEach((state) => {
					const li = $("<li></li>").text(
						state.name +
							(state.isInitial ? " (Initial)" : "") +
							(state.isAccepting ? " (Accepting)" : "")
					);
					stateList.append(li);
				});
			});

			$("#addTransition").click(function () {
				const fromState = $("#fromState").val();
				const toState = $("#toState").val();
				const symbol = $("#transitionSymbol").val().trim();

				if (!fromState || !toState || !symbol) {
					alert("Please fill in all fields for the transition");
					return;
				}
				if (
					manualTransitions.some(
						(t) => t.from === fromState && t.symbol === symbol
					)
				) {
					alert("Transition for this symbol already exists from this state");
					return;
				}

				manualTransitions.push({from: fromState, symbol: symbol, to: toState});
				$("#transitionSymbol").val("");

				const transitionList = $("#transitionList");
				transitionList.empty();
				manualTransitions.forEach((trans) => {
					const li = $("<li></li>").text(
						`${trans.from} --${trans.symbol}--> ${trans.to}`
					);
					transitionList.append(li);
				});
			});

			$("#generateManualDFA").click(function () {
				const initialStates = manualStates.filter((s) => s.isInitial);
				if (initialStates.length !== 1) {
					alert("DFA must have exactly one initial state");
					return;
				}

				// Check for complete transitions
				const alphabet = [...new Set(manualTransitions.map((t) => t.symbol))];
				manualStates.forEach((state) => {
					alphabet.forEach((symbol) => {
						if (
							!manualTransitions.some(
								(t) => t.from === state.name && t.symbol === symbol
							)
						) {
							alert(
								`Missing transition for symbol '${symbol}' from state '${state.name}'`
							);
							return;
						}
					});
				});

				const states = manualStates.map((s) => s.name);
				const acceptingStates = manualStates
					.filter((s) => s.isAccepting)
					.map((s) => s.name);
				const initialState = initialStates[0].name;

				const transitions = manualTransitions.map((t) => ({
					fromState: t.from,
					symbol: t.symbol,
					toStates: [t.to],
				}));

				const dfaObj = {
					states: states,
					alphabet: alphabet,
					transitions: transitions,
					initialState: initialState,
					acceptingStates: acceptingStates,
				};

				// if (!toc.fsm.isDeterministic(dfaObj)) {
				//     alert('Created automaton is not a valid DFA');
				//     return;
				// }

				const serialized = toc.fsm.serializeFsmToString(dfaObj);
				$("#fsm").val(serialized);
				$("#createAutomaton").click();
			});

			// Original functionality
			$("#createAutomaton").click(function () {
				try {
					originalDFA = toc.fsm.parseFsmFromString($("#fsm").val());
					// if (!toc.fsm.isDeterministic(originalDFA)) {
					//     throw new Error("Automaton is not a DFA");
					// }
					drawOriginalDFA();
					$("#minimizeDFA").attr("disabled", false);
				} catch (e) {
					alert("Error: " + e.message);
				}
			});

			$("#generateDFA").click(function () {
				originalDFA = toc.fsm.createRandomFsm(toc.fsm.dfaType, 6, 2, 3);
				$("#fsm").val(toc.fsm.serializeFsmToString(originalDFA));
				drawOriginalDFA();
				$("#minimizeDFA").attr("disabled", false);
			});

			$("#minimizeDFA").click(function () {
				if (!originalDFA) {
					alert("Please create a DFA first!");
					return;
				}

				try {
					minimizedDFA = toc.fsm.minimize(originalDFA);
					drawMinimizedDFA();
				} catch (e) {
					alert("Minimization failed: " + e.message);
				}
			});

			function drawOriginalDFA() {
				const dotString = toc.fsm.printDotFormat(originalDFA);
				const svg = Viz(dotString, {format: "svg"});
				$("#originalGraph").html(svg);
				$("#originalGraph svg").width($("#originalGraph").width());
			}

			function drawMinimizedDFA() {
				const dotString = toc.fsm.printDotFormat(minimizedDFA);
				const svg = Viz(dotString, {format: "svg"});
				$("#minimizedGraph").html(svg);
				$("#minimizedGraph svg").width($("#minimizedGraph").width());
			}
		