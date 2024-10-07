  toc.grammar = {};

  toc.grammar.epsilonSymbol = '$';
  toc.grammar.regType = 'regular';
  toc.grammar.cfgType = 'context-free';
  toc.grammar.csgType = 'context-sensitive';
  toc.grammar.unrestrictedType = 'unrestricted';

  // validate the grammar
  toc.grammar.validate = function(grammar) {
    if (!(typeof grammar !== 'undefined' &&
        Array.isArray(grammar.nonterminals) &&
        Array.isArray(grammar.terminals) &&
        typeof grammar.initialNonterminal !== 'undefined' && grammar.initialNonterminal !== null &&
        Array.isArray(grammar.productions))) {
      throw new Error('Grammar must be defined and have nonterminals, terminals, initialNonterminal and productions array properties!');
    }
    
    var i, j;

    if (grammar.nonterminals.length < 1) {
      throw new Error('Set of nonterminals must not be empty.');
    }

    if (grammar.terminals.length < 1) {
      throw new Error('Set of terminals must not be empty.');
    }

    for (i=0; i<grammar.nonterminals.length; i++) {
      if (toc.util.contains(grammar.nonterminals, grammar.nonterminals[i], i+1)) {
        throw new Error('Equivalent nonterminals');
      }
    }

    for (i=0; i<grammar.terminals.length; i++) {
      if (toc.util.contains(grammar.terminals, grammar.terminals[i], i+1)) {
        throw new Error('Equivalent terminals');
      }
    }

    for (i=0; i<grammar.terminals.length; i++) {
      if (toc.util.contains(grammar.nonterminals, grammar.terminals[i])) {
        throw new Error('Terminals and nonterminals must not overlap');
      }
    }

    if (!(toc.util.contains(grammar.nonterminals, grammar.initialNonterminal))) {
      throw new Error('InitialNonterminal must be in nonterminals');
    }

    for (i=0; i<grammar.productions.length; i++) {
      var production = grammar.productions[i];

      if (!(Array.isArray(production.left))) {
        throw new Error('Left side of production must be an array');
      }

      if (production.left.length === 0) {
        throw new Error('Left side of production must have at least one terminal or nonterminal');
      }

      for (j=0; j<production.left.length; j++) {
        if (!(toc.util.contains(grammar.nonterminals, production.left[j])) &&
            !(toc.util.contains(grammar.terminals, production.left[j]))) {
          throw new Error('Left side of production must be in nonterminals or terminals');
        }
      }

      if (!(Array.isArray(production.right))) {
        throw new Error('Right side of production must be an array');
      }

      if (production.right.length === 1 && production.right[0] === toc.grammar.epsilonSymbol) {
        
      } else {
        if (production.right.length === 0) {
          throw new Error('Right side of production must have at least one terminal or nonterminal or epsilon symbol');
        }

        for (j=0; j<production.right.length; j++) {
          if (!(toc.util.contains(grammar.nonterminals, production.right[j])) &&
              !(toc.util.contains(grammar.terminals, production.right[j]))) {
            throw new Error('Right side of production must be in nonterminals or terminals');
          }
        }
      }

      if (toc.util.contains(grammar.productions, production, i+1)) {
        throw new Error('Grammar must not have duplicate productions');
      }
    }

    return true;
  };

  // determine whether the grammar is regular, context-free, 
  // context-sensitive or unrestricted
  toc.grammar.determineType = function(grammar) {
    var type = toc.grammar.regType;
    var isRightRegular = null;
    var i, j, indexOfNonterminal;

    for (i=0; i<grammar.productions.length; i++) {
      var production = grammar.productions[i];

      // handle both left-regular and right-regular
      if (type === toc.grammar.regType) {
        if (production.left.length !== 1 || !(toc.util.contains(grammar.nonterminals, production.left[0]))) {
          type = toc.grammar.cfgType;
        } else {
          if (production.right.length === 1) {
            continue;
          } else {
            var rightNonTerminalCount = 0;
            indexOfNonterminal = -1;

            for (j=0; j<production.right.length; j++) {
              if (toc.util.contains(grammar.nonterminals, production.right[j])) {
                rightNonTerminalCount += 1;
                indexOfNonterminal = j;
              }
            }

            if (rightNonTerminalCount > 1) {
              type = toc.grammar.cfgType;
            } else if (rightNonTerminalCount === 0) {
              continue;
            } else {
              if (indexOfNonterminal === 0) {
                if (isRightRegular === null) {
                  isRightRegular = false;
                  continue;
                } else if (isRightRegular === false) {
                  continue;
                } else if (isRightRegular === true) {
                  type = toc.grammar.cfgType;
                }
              } else if (indexOfNonterminal === production.right.length - 1) {
                if (isRightRegular === null) {
                  isRightRegular = true;
                  continue;
                } else if (isRightRegular === true) {
                  continue;
                } else if (isRightRegular === false) {
                  type = toc.grammar.cfgType;
                }
              } else {
                type = toc.grammar.cfgType;
              }
            }
          }
        }
      }

      if (type === toc.grammar.cfgType) {
        if (production.left.length !== 1 || !(toc.util.contains(grammar.nonterminals, production.left[0]))) {
          type = toc.grammar.csgType;
        }
      }

      if (type === toc.grammar.csgType) {
        var leftNonTerminalCount = 0;
        indexOfNonterminal = -1;

        for (j=0; j<production.left.length; j++) {
          if (toc.util.contains(grammar.nonterminals, production.left[j])) {
            leftNonTerminalCount += 1;
            indexOfNonterminal = j;
          }
        }

        if (leftNonTerminalCount > 1) {
          return toc.grammar.unrestrictedType;
        }

        var prefix = production.left.slice(0, indexOfNonterminal-1);
        var sufix = production.left.slice(indexOfNonterminal);

        for (j=0; j<prefix.length; j++) {
          if (!(toc.util.areEquivalent(prefix[j], production.right[j]))) {
            return toc.grammar.unrestrictedType;
          }
        }

        for (j=0; j<sufix.length; j++) {
          if (!(toc.util.areEquivalent(sufix[sufix.length-j-1], production.right[production.right.length-j-1]))) {
            return toc.grammar.unrestrictedType;
          }
        }

        if (production.right.length <= prefix.length + sufix.length) {
          return toc.grammar.unrestrictedType;
        }
      }
    }

    return type;
  };

  // print the grammar in a human-readable condensed ascii format
  toc.grammar.printAscii = function(grammar) {
    var str = [];

    str.push("Initial nonterminal: " + "<" + grammar.initialNonterminal + ">");

    var slimProds = [], i, j, k;

    for (i=0; i<grammar.productions.length; i++) {
      var foundSlim = -1;

      for (j=0; j<slimProds.length; j++) {
        if (toc.util.areEquivalent(slimProds[j][0], grammar.productions[i].left)) {
          foundSlim = j;
          break;
        }
      }

      if (foundSlim === -1) {
        slimProds[slimProds.length] = [grammar.productions[i].left, [grammar.productions[i].right]];
      } else {
        slimProds[foundSlim][1].push(grammar.productions[i].right);
      }
    }

    for (i=0; i<slimProds.length; i++) {
      var prod = [];

      for (j=0; j<slimProds[i][0].length; j++) {
        if (toc.util.contains(grammar.nonterminals, slimProds[i][0][j])) {
          prod.push("<" + slimProds[i][0][j].toString() + ">");
        } else {
          if (slimProds[i][0][j] === toc.grammar.epsilonSymbol) {
            prod.push(slimProds[i][0][j].toString());
          } else {
            prod.push('"' + slimProds[i][0][j].toString() + '"');
          }
        }
      }

      prod.push("->");

      for (j=0; j<slimProds[i][1].length; j++) {
        for (k=0; k<slimProds[i][1][j].length; k++) {
          if (toc.util.contains(grammar.nonterminals, slimProds[i][1][j][k])) {
            prod.push("<" + slimProds[i][1][j][k].toString() + ">");
          } else {
            if (slimProds[i][1][j][k] === toc.grammar.epsilonSymbol) {
              prod.push(slimProds[i][1][j][k].toString());
            } else {
              prod.push('"' + slimProds[i][1][j][k].toString() + '"');
            }
          }
        }

        if (j < slimProds[i][1].length - 1) {
          prod.push("|");
        }
      }

      str.push(prod.join(" "));
    }

    return str.join("\n");
  };
