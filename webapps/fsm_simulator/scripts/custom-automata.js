
let automaton = {
    states: [],
    alphabet: [],
    transitions: [],
    acceptingStates: [],
    initialState: null
};

function updateAutomatonDisplay() {
    document.getElementById('automatonConfig').textContent = JSON.stringify(automaton, null, 2);
}

document.getElementById('addState').addEventListener('click', () => {
    const state = `s${automaton.states.length}`;
    automaton.states.push(state);
    updateAutomatonDisplay();
    alert(`State ${state} added.`);
});

document.getElementById('addAlphabetBtn').addEventListener('click', () => {
    const symbol = document.getElementById('alphabetSymbol').value.trim();
    if (!symbol) {
        alert('Please enter a valid symbol.');
        return;
    }
    if (automaton.alphabet.includes(symbol)) {
        alert('Symbol already exists in the alphabet.');
        return;
    }
    automaton.alphabet.push(symbol);
    updateAutomatonDisplay();
    alert(`Alphabet symbol ${symbol} added.`);
});

document.getElementById('addTransitionBtn').addEventListener('click', () => {
    const fromState = document.getElementById('fromState').value;
    const symbol = document.getElementById('symbol').value;
    const toState = document.getElementById('toState').value;

    if (!fromState || !symbol || !toState) {
        alert('Please fill in all fields for the transition.');
        return;
    }

    if (!automaton.states.includes(fromState) || !automaton.states.includes(toState)) {
        alert('Invalid state(s) specified.');
        return;
    }

    if (!automaton.alphabet.includes(symbol)) {
        alert(`Symbol '${symbol}' is not part of the DFA alphabet.`);
        return;
    }

    automaton.transitions.push({ fromState, symbol, toStates: [toState] });
    updateAutomatonDisplay();
    alert(`Transition ${fromState} --${symbol}--> ${toState} added.`);
});

document.getElementById('setAcceptingStateBtn').addEventListener('click', () => {
    const state = document.getElementById('acceptingState').value;
    if (state && automaton.states.includes(state)) {
        if (!automaton.acceptingStates.includes(state)) {
            automaton.acceptingStates.push(state);
            updateAutomatonDisplay();
            alert(`State ${state} marked as accepting.`);
        } else {
            alert(`State ${state} is already an accepting state.`);
        }
    } else {
        alert('Invalid state.');
    }
});

document.getElementById('setInitialStateBtn').addEventListener('click', () => {
    const state = document.getElementById('initialState').value;
    if (state && automaton.states.includes(state)) {
        automaton.initialState = state;
        updateAutomatonDisplay();
        alert(`State ${state} set as initial.`);
    } else {
        alert('Invalid state.');
    }
});

document.getElementById('resetAutomaton').addEventListener('click', () => {
    automaton = { states: [], alphabet: [], transitions: [], acceptingStates: [], initialState: null };
    updateAutomatonDisplay();
    alert('Automaton reset.');
});

document.getElementById('finalizeAutomaton').addEventListener('click', () => {
    if (!automaton.initialState || automaton.acceptingStates.length === 0) {
        alert('Please ensure the automaton has an initial state and at least one accepting state.');
        return;
    }
    alert('DFA finalized. Ready to simulate!');
    var dotString = toc.fsm.printDotFormat(automaton);
    console.log(dotString)
    var gvizXml = Viz(dotString, { format: "svg", totalMemory: 100 * 1024 * 1024 });
    $("#automatonGraph").html(gvizXml);
    reorderCirclesInAcceptingStates(automaton.acceptingStates);
    $("#automatonGraph svg").width($("#automatonGraph").width());
});

updateAutomatonDisplay();
