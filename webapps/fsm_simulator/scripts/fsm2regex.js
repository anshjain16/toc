var current_regex = $("#regex").val()
var current_fsm = $("#fsm").val()

function drawGraph(automaton) {
  var dotString = toc.fsm.printDotFormat(automaton);
  var gvizXml = Viz(dotString, "svg");
  $("#automatonGraph").html(gvizXml);
  $("#automatonGraph svg").width($("#automatonGraph").width());
}

$("#generateRegex").click(function() {
  var regex = toc.re.string.random(5, "abcd", {});
  regex = toc.re.string.simplify(regex);
  $("#regex").val(regex);
  $("#regex").focus();
  onRegexChangeDebounced();
});

function generateAutomaton(fsmType) {
  var automaton = toc.fsm.createRandomFsm(fsmType, 3, 2, 2);
  $("#fsm").val(toc.fsm.serializeFsmToString(automaton));
  $("#fsm").scrollTop(0);
  $("#fsm").focus();
  onAutomatonChangeDebounced();
}

$("#generateDFA").click(function() {
  generateAutomaton(toc.fsm.dfaType);
});

$("#generateNFA").click(function() {
  generateAutomaton(toc.fsm.nfaType);
});

$("#generateENFA").click(function() {
  generateAutomaton(toc.fsm.enfaType);
});

function onRegexChange() {
  if (current_regex === $("#regex").val()) {
    return;
  }

  current_regex = $("#regex").val();

  $("#automatonGraph").html("");
  $("#fsm").val("");
  var regex = validateRegex();
  if (regex !== null) {
    var automaton = toc.re.tree.toAutomaton(regex);
    drawGraph(automaton);
    $("#fsm").val(toc.fsm.serializeFsmToString(automaton));
    current_fsm = $("#fsm").val();
  }
}

function onAutomatonChange() {
  if (current_fsm === $("#fsm").val()) {
    return;
  }

  current_fsm = $("#fsm").val();

  $("#automatonGraph").html("");
  $("#regex").val("");
  var automaton = validateFsm();
  if (automaton !== null) {
    drawGraph(automaton);
    automaton = toc.fsm.minimize(automaton);
    var r = toc.fsm.toRegex(automaton);
    r = toc.re.tree.simplify(r, {"useFsmPatterns": false});
    var s = toc.re.tree.toString(r);
    $("#regex").val(s);
    current_regex = $("#regex").val();
  }
}

function validateFsm() {
  var fsm = $("#fsm").val();
  console.log(fsm);

  if (fsm.length === 0) {
    $("#fsm").parent().removeClass("success error");
    $("#regex").parent().removeClass("success error");
    $("#inputError").hide();
  } else {
    try {
      fsm = toc.fsm.parseFsmFromString(fsm);
      $("#fsm").parent().removeClass("error");
      $("#fsm").parent().addClass("success");
      $("#regex").parent().removeClass("error");
      $("#regex").parent().addClass("success");
      $("#inputError").hide();
      return fsm;
    } catch (e) {
      $("#fsm").parent().removeClass("success");
      $("#fsm").parent().addClass("error");
      $("#inputError").show();
      $("#inputError").text("Error: " + e.message);
      return null;
    }
  }
}

function validateRegex() {
  var regex = $("#regex").val();
  console.log(regex)
  if (regex.length === 0) {
    $("#regex").parent().removeClass("success error");
    $("#fsm").parent().removeClass("success error");
    $("#inputError").hide();
  } else {
    try {
      regex = toc.re.string.toTree(regex);
      $("#regex").parent().removeClass("error");
      $("#regex").parent().addClass("success");
      $("#fsm").parent().removeClass("error");
      $("#fsm").parent().addClass("success");
      $("#inputError").hide();
      return regex;
    } catch (e) {
      $("#regex").parent().removeClass("success");
      $("#regex").parent().addClass("error");
      $("#inputError").show();
      $("#inputError").text("Error: " + e.message);
      return null;
    }
  }
}

var onRegexChangeDebounced = _.debounce(onRegexChange, 500);
var onAutomatonChangeDebounced = _.debounce(onAutomatonChange, 500)

$("#regex").change(onRegexChangeDebounced);
$("#regex").keyup(onRegexChangeDebounced);
$("#fsm").change(onAutomatonChangeDebounced);
$("#fsm").keyup(onAutomatonChangeDebounced);
