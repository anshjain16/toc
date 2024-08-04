
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
				let symbol = $("#transitionSymbol").val().trim();
				if (symbol === "ε") symbol = "";

				if (!fromState || !toState || symbol === "") {
					alert("Please fill in all fields for the transition");
					return;
				}

				manualTransitions.push({from: fromState, symbol: symbol, to: toState});
				$("#transitionSymbol").val("");

				const transitionList = $("#transitionList");
				transitionList.empty();
				manualTransitions.forEach((trans) => {
					const displaySymbol = trans.symbol === "" ? "ε" : trans.symbol;
					const li = $("<li></li>").text(
						`${trans.from} --${displaySymbol}--> ${trans.to}`
					);
					transitionList.append(li);
				});
			});

			$("#generateManualFSM").click(function () {
				const initialStates = manualStates.filter((s) => s.isInitial);
				if (initialStates.length !== 1) {
					alert("There must be exactly one initial state");
					return;
				}

				const isDFA = $('input[name="automatonType"]:checked').val() === "dfa";
				const states = manualStates.map((s) => s.name);
				const acceptingStates = manualStates
					.filter((s) => s.isAccepting)
					.map((s) => s.name);
				const initialState = initialStates[0].name;
				const alphabet = [
					...new Set(manualTransitions.map((t) => t.symbol)),
				].filter((s) => s !== "");

				const transitions = [];
				const transitionMap = new Map();
				manualTransitions.forEach((trans) => {
					const key = `${trans.from},${trans.symbol}`;
					if (!transitionMap.has(key)) {
						transitionMap.set(key, []);
					}
					transitionMap.get(key).push(trans.to);
				});

				transitionMap.forEach((toStates, key) => {
					const [from, symbol] = key.split(",");
					transitions.push({
						fromState: from,
						symbol: symbol,
						toStates: toStates,
					});
				});

				const fsmObj = {
					states: states,
					alphabet: alphabet,
					transitions: transitions,
					initialState: initialState,
					acceptingStates: acceptingStates,
				};

				if (isDFA) {
					// Validate DFA
					let isValidDFA = true;
					states.forEach((state) => {
						alphabet.forEach((symbol) => {
							const key = `${state},${symbol}`;
							if (
								!transitionMap.has(key) ||
								transitionMap.get(key).length !== 1
							) {
								isValidDFA = false;
							}
						});
					});

					if (!isValidDFA) {
						alert(
							"Manual DFA is not valid - ensure exactly one transition per symbol per state"
						);
						return;
					}
				}

				const serialized = toc.fsm.serializeFsmToString(fsmObj);
				$("#fsm").val(serialized);
				// Trigger existing FSM processing
				$("#fsm").trigger("input");
			});

			// Modified existing generate buttons
			$("#generateDFA").click(function () {
				const dfa = toc.fsm.createRandomFsm(toc.fsm.dfaType, 6, 2, 3);
				$("#fsm").val(toc.fsm.serializeFsmToString(dfa));
				$("#fsm").trigger("input");
			});

			$("#generateNFA").click(function () {
				const nfa = toc.fsm.createRandomFsm(toc.fsm.enfaType, 6, 2, 3);
				$("#fsm").val(toc.fsm.serializeFsmToString(nfa));
				$("#fsm").trigger("input");
			});
	