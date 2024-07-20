  toc.re = (function() {

    var tree = (function() {
      var tags = {
        ALT: 'alt',
        SEQ: 'sequence',
        KSTAR: 'kleene_star',
        LIT: 'literal',
        EPS: 'epsilon'
      };

      function copyAndDeleteProperties(o1, o2) {
        var p;

        for (p in o1) {
          if (o1.hasOwnProperty(p)) {
            delete o1[p];
          }
        }

        for (p in o2) {
          if (o2.hasOwnProperty(p)) {
            o1[p] = o2[p];
          }
        }
      }

      var _regex_simplification_patterns = [];

      // (a) => a (sequence)
      function _regex_simplify_1(tree, fsmCache) {
        if (tree.tag === tags.SEQ && tree.elements.length === 1){
          tree.tag = tree.elements[0].tag;

          copyAndDeleteProperties(tree, tree.elements[0]);
          return true;
        }

        return false;
      }

      // (a) => a (choices)
      function _regex_simplify_2(tree, fsmCache) {
        if (tree.tag === tags.ALT && tree.choices.length === 1) {
          tree.tag = tree.choices[0].tag;

          copyAndDeleteProperties(tree, tree.choices[0]);
          return true;
        }

        return false;
      }

      // $* => $
      function _regex_simplify_3(tree, fsmCache) {
         if (tree.tag === tags.KSTAR && tree.expr.tag === tags.EPS) {
           tree.tag = tree.expr.tag;
           delete tree.expr;
           return true;
         }

         return false;
      }

      // (a*)* => a*
      function _regex_simplify_4(tree, fsmCache) {
         if (tree.tag === tags.KSTAR && tree.expr.tag === tags.KSTAR) {
           tree.expr = tree.expr.expr;
           return true;
         }

         return false;
      }

      // (a+b*)* => (a+b)*
      function _regex_simplify_5(tree, fsmCache) {
        if (tree.tag === tags.KSTAR && tree.expr.tag === tags.ALT) {
          var changed = false;
          for (var i=0; i<tree.expr.choices.length; i++) {
            if (tree.expr.choices[i].tag === tags.KSTAR) {
              tree.expr.choices[i] = tree.expr.choices[i].expr;
              return true;
            }
          }
        }

        return false;
      }

      // $+a* => a*
      function _regex_simplify_6(tree, fsmCache) {
        if (tree.tag === tags.ALT && tree.choices.length >= 2) {
          var epsIndex = -1;
          var kstarIndex = -1;

          for (var i=0; i<tree.choices.length; i++) {
            if (tree.choices[i].tag === tags.EPS) {
              epsIndex = i;
            } else if (tree.choices[i].tag === tags.KSTAR) {
              kstarIndex = i;
            }
          }

          if (epsIndex >= 0 && kstarIndex >= 0) {
            tree.choices.splice(epsIndex, 1);
            return true;
          }
        }

        return false;
      }

      // (a*b*)* => (a*+b*)*
      function _regex_simplify_7(tree, fsmCache) {
        if (tree.tag === tags.KSTAR && tree.expr.tag === tags.SEQ && tree.expr.elements.length > 0) {
          var check = true;
          for (var i=0; i<tree.expr.elements.length; i++) {
            if (tree.expr.elements[i].tag !== tags.KSTAR) {
              check = false;
              break;
            }
          }

          if (check) {
            tree.expr.tag = tags.ALT;
            tree.expr.choices = tree.expr.elements;
            delete tree.expr.elements;
            return true;
          }
        }

        return false;
      }

      // $a => a
      function _regex_simplify_8(tree, fsmCache) {
        if (tree.tag === tags.SEQ && tree.elements.length >= 2) {
          var epsIndex = -1;

          for (var i=0; i<tree.elements.length; i++) {
            if (tree.elements[i].tag === tags.EPS) {
              epsIndex = i;
            }
          }

          if (epsIndex >= 0) {
            tree.elements.splice(epsIndex, 1);
            return true;
          }
        }

        return false;
      }

      // (a+(b+c)) => a+b+c
      function _regex_simplify_9(tree, fsmCache) {
        if (tree.tag === tags.ALT && tree.choices.length >= 2) {
          var found = -1, i;
          for (i=0; i<tree.choices.length; i++) {
            if (tree.choices[i].tag === tags.ALT) {
              found = i;
            }
          }

          if (found >= 0) {
            var node = tree.choices[found];
            tree.choices.splice(found, 1);

            for (i=0; i<node.choices.length; i++) {
              tree.choices.splice(found+i, 0, node.choices[i]);
            }

            return true;
          }
        }

        return false;
      }

      // ab(cd) => abcd
      function _regex_simplify_10(tree, fsmCache) {
        if (tree.tag === tags.SEQ && tree.elements.length >= 2) {
          var found = -1, i;
          for (i=0; i<tree.elements.length; i++) {
            if (tree.elements[i].tag === tags.SEQ) {
              found = i;
              break;
            }
          }

          if (found >= 0) {
            var node = tree.elements[i];
            tree.elements.splice(i, 1);

            for (i=0; i<node.elements.length; i++) {
              tree.elements.splice(found+i, 0, node.elements[i]);
            }

            return true;
          }
        }

        return false;
      }

      // a+a => a
      function _regex_simplify_11(tree, fsmCache) {
        if (tree.tag === tags.ALT && tree.choices.length >= 2) {
          for (var i=0; i<tree.choices.length-1; i++) {
            var found = -1;
            for (var j=i+1; j<tree.choices.length; j++) {
              if (toc.util.areEquivalent(tree.choices[i], tree.choices[j])) {
                found = j;
                break;
              }
            }

            if (found >= 0) {
              tree.choices.splice(found, 1);
              return true;
            }
          }
        }

        return false;
      }

      // a+a* => a*
      function _regex_simplify_12(tree, fsmCache) {
        if (tree.tag === tags.ALT && tree.choices.length >= 2) {
          for (var i=0; i<tree.choices.length-1; i++) {
            var found = -1;
            for (var j=i+1; j<tree.choices.length; j++) {
              if (tree.choices[j].tag === tags.KSTAR && toc.util.areEquivalent(tree.choices[j].expr, tree.choices[i])) {
                found = i;
                break;
              }

              else if (tree.choices[i].tag === tags.KSTAR && toc.util.areEquivalent(tree.choices[i].expr, tree.choices[j])) {
                found = j;
                break;
              }
            }

            if (found >= 0) {
              tree.choices.splice(found, 1);
              return true;
            }
          }
        }

        return false;
      }

      // a*a* => a*
      function _regex_simplify_13(tree, fsmCache) {
        if (tree.tag === tags.SEQ && tree.elements.length >= 2) {
          var found = -1;

          for (var i=0; i<tree.elements.length-1; i++) {
            if (tree.elements[i].tag === tags.KSTAR && tree.elements[i+1].tag === tags.KSTAR && toc.util.areEquivalent(tree.elements[i], tree.elements[i+1])) {
              found = i;
              break;
            }
          }

          if (found >= 0) {
            tree.elements.splice(found+1, 1);
            return true;
          }
        }

        return false;
      }

      // (aa+a)* => (a)*
      function _regex_simplify_14(tree, fsmCache) {
        if (tree.tag === tags.KSTAR && tree.expr.tag === tags.ALT && tree.expr.choices.length >= 2) {
          for (var i=0; i<tree.expr.choices.length; i++) {
            for (var j=0; j<tree.expr.choices.length; j++) {
              if (i !== j && tree.expr.choices[j].tag === tags.SEQ && tree.expr.choices[j].elements.length >= 2) {
                var found = true;

                for (var k=0; k<tree.expr.choices[j].elements.length; k++) {
                  if (!(toc.util.areEquivalent(tree.expr.choices[i], tree.expr.choices[j].elements[k]))) {
                    found = false;
                    break;
                  }
                }

                if (found) {
                  tree.expr.choices.splice(j, 1);
                  return true;
                }
              }
            }
          }
        }

        return false;
      }

      // (a + $)* => (a)*
      function _regex_simplify_15(tree, fsmCache) {
        if (tree.tag === tags.KSTAR && tree.expr.tag === tags.ALT && tree.expr.choices.length >= 2) {
          for (var i=0; i<tree.expr.choices.length; i++) {
            if (tree.expr.choices[i].tag === tags.EPS) {
              tree.expr.choices.splice(i, 1);
              return true;
            }
          }
        }

        return false;
      }

      // (ab+ac) => a(b+c)
      function _regex_simplify_16(tree, fsmCache) {
        if (tree.tag === tags.ALT && tree.choices.length >=2) {
          for (var i=0; i<tree.choices.length-1; i++) {
            if (tree.choices[i].tag === tags.SEQ && tree.choices[i].elements.length >= 2) {
              for (var j=i+1; j<tree.choices.length; j++) {
                if (tree.choices[j].tag === tags.SEQ && tree.choices[j].elements.length >= 2) {
                  if (toc.util.areEquivalent(tree.choices[j].elements[0], tree.choices[i].elements[0])) {
                    var first = tree.choices[i].elements[0];
                    var rest1 = makeSeq(tree.choices[i].elements.slice(1));
                    var rest2 = makeSeq(tree.choices[j].elements.slice(1));

                    var _alt = makeAlt([rest1, rest2]);
                    var _seq = makeSeq([first, _alt]);

                    tree.choices[i] = _seq;
                    tree.choices.splice(j, 1);

                    return true;
                  }
                }
              }
            }
          }
        }

        return false;
      }

      // a*aa* => aa*
      function _regex_simplify_17(tree, fsmCache) {
        if (tree.tag === tags.SEQ && tree.elements.length >=3) {
          for (var i=1; i<tree.elements.length-1; i++) {
            if (tree.elements[i-1].tag === tags.KSTAR && tree.elements[i+1].tag === tags.KSTAR) {
              if (toc.util.areEquivalent(tree.elements[i-1], tree.elements[i+1]) &&
                  toc.util.areEquivalent(tree.elements[i-1].expr, tree.elements[i])) {
                tree.elements.splice(i-1, 1);
                return true;
              }
            }
          }
        }

        return false;
      }

      // (ab+cb) => (a+c)b
      function _regex_simplify_18(tree, fsmCache) {
        if (tree.tag === tags.ALT && tree.choices.length >=2) {
          for (var i=0; i<tree.choices.length-1; i++) {
            if (tree.choices[i].tag === tags.SEQ && tree.choices[i].elements.length >= 2) {
              for (var j=i+1; j<tree.choices.length; j++) {
                if (tree.choices[j].tag === tags.SEQ && tree.choices[j].elements.length >= 2) {
                  if (toc.util.areEquivalent(tree.choices[j].elements[tree.choices[j].elements.length-1],
                                              tree.choices[i].elements[tree.choices[i].elements.length-1])) {
                    var last = tree.choices[i].elements[tree.choices[i].elements.length-1];
                    var rest1 = makeSeq(tree.choices[i].elements.slice(0, tree.choices[i].elements.length-1));
                    var rest2 = makeSeq(tree.choices[j].elements.slice(0, tree.choices[j].elements.length-1));

                    var _alt = makeAlt([rest1, rest2]);
                    var _seq = makeSeq([_alt, last]);

                    tree.choices[i] = _seq;
                    tree.choices.splice(j, 1);

                    return true;
                  }
                }
              }
            }
          }
        }

        return false;
      }

      // L1+L2 => L2, if L1 is subset of L2
      function _regex_simplify_19(tree, fsmCache) {
        if (tree.tag === tags.ALT && tree.choices.length >= 2) {
          var fsms = [];

          fsms.push(getFromCacheOrCreateFsm(tree.choices[0], fsmCache));

          var found = -1;

          for (var i=0; i<tree.choices.length-1; i++) {
            for (var j=i+1; j<tree.choices.length; j++) {
              if (fsms.length <= j) {
                fsms.push(getFromCacheOrCreateFsm(tree.choices[j], fsmCache));
              }

              try {
                if (toc.fsm.isSubset(fsms[i], fsms[j]) ) {
                  found = j;
                }
              } catch (e) {
              }

              try {
                if (toc.fsm.isSubset(fsms[j], fsms[i]) ) {
                  found = i;
                }
              } catch (e) {
              }

              if (found >= 0) {
                tree.choices.splice(found, 1);
                return true;
              }
            }
          }
        }

          return false;
      }

      // (L1+L2)* => L2*, if L1* is subset of L2*
      function _regex_simplify_20(tree, fsmCache) {
        if (tree.tag === tags.KSTAR && tree.expr.tag === tags.ALT && tree.expr.choices.length >= 2) {
          var fsms = [];

          fsms.push(getFromCacheOrCreateFsm(makeKStar(tree.expr.choices[0]), fsmCache));

          var found = -1;

          for (var i=0; i<tree.expr.choices.length-1; i++) {
            for (var j=i+1; j<tree.expr.choices.length; j++) {
              if (fsms.length <= j) {
                fsms.push(getFromCacheOrCreateFsm(makeKStar(tree.expr.choices[j]), fsmCache));
              }

              try {
                if (toc.fsm.isSubset(fsms[i], fsms[j]) ) {
                  found = j;
                }
              } catch (e) {
              }

              try {
                if (toc.fsm.isSubset(fsms[j], fsms[i]) ) {
                  found = i;
                }
              } catch (e) {
              }

              if (found >= 0) {
                tree.expr.choices.splice(found, 1);
                return true;
              }
            }
          }
        }

        return false;
      }

      function getFromCacheOrCreateFsm(key, ht) {
        var fsm = ht.get(key);

        if (!(fsm)) {
          fsm = toc.fsm.minimize(toc.re.tree.toAutomaton(key));
          ht.put(key, fsm);
        }

        return fsm;
      }

      // L1*L2* => L2, if L1* is subset of L2*
      function _regex_simplify_21(tree, fsmCache) {
        if (tree.tag === tags.SEQ && tree.elements.length >= 2) {
          var fsms = [];
          fsms.push(getFromCacheOrCreateFsm(tree.elements[0], fsmCache));

          var found = -1;

          for (var i=0; i<tree.elements.length-1; i++) {
            fsms.push(getFromCacheOrCreateFsm(tree.elements[i+1], fsmCache));

            if (tree.elements[i].tag === tags.KSTAR && tree.elements[i+1].tag === tags.KSTAR) {
              try {
                if (toc.fsm.isSubset(fsms[i], fsms[i+1]) ) {
                  found = i+1;
                }
              } catch (e) {
              }

              try {
                if (toc.fsm.isSubset(fsms[i+1], fsms[i]) ) {
                  found = i;
                }
              } catch (e) {
              }

              if (found >= 0) {
                tree.elements.splice(found, 1);
                return true;
              }
            }
          }
        }

        return false;
      }

      // $+L => L, if L contains $
      function _regex_simplify_22(tree, fsmCache) {
        if (tree.tag === tags.ALT && tree.choices.length > 1) {
          var index_eps = toc.util.index(tree.choices, makeEps());

          if (index_eps >= 0) {
            for (var i=0; i<tree.choices.length; i++) {
              if (tree.choices[i].tag !== tags.EPS) {
                var fsm = getFromCacheOrCreateFsm(tree.choices[i], fsmCache);

                if (toc.fsm.isAcceptingState(fsm, fsm.initialState)) {
                  tree.choices.splice(index_eps, 1);
                  return true;
                }
              }
            }
          }
        }

        return false;
      }

      // a*($+b(a+b)*) => (a+b)*
      function _regex_simplify_23(tree, fsmCache) {
        if (tree.tag === tags.SEQ && tree.elements.length > 1) {
          for (var i=0; i<tree.elements.length-1; i++) {
            if (tree.elements[i].tag === tags.KSTAR && tree.elements[i+1].tag === tags.ALT &&
              tree.elements[i+1].choices.length === 2) {

              var index_eps = toc.util.index(tree.elements[i+1].choices, makeEps());

              if (index_eps >= 0) {
                var internal = index_eps === 0 ? tree.elements[i+1].choices[1] : tree.elements[i+1].choices[0];

                if (internal.tag === tags.SEQ && internal.elements.length === 2) {
                  if (internal.elements[1].tag === tags.KSTAR && internal.elements[1].expr.tag === tags.ALT &&
                      internal.elements[1].expr.choices.length === 2 && toc.util.contains(internal.elements[1].expr.choices, tree.elements[i].expr)) {
                    if (toc.util.contains(internal.elements[1].expr.choices, internal.elements[0])) {
                      tree.elements[i+1] = internal.elements[1];
                      tree.elements.splice(i, 1);
                      return true;
                    }
                  }
                }
              }
            }
          }
        }

        return false;
      }

      // ($+(a+b)*a)b* => (a+b)*
      function _regex_simplify_24(tree, fsmCache) {
        if (tree.tag === tags.SEQ && tree.elements.length > 1) {
          for (var i=1; i<tree.elements.length; i++) {
            if (tree.elements[i].tag === tags.KSTAR && tree.elements[i-1].tag === tags.ALT &&
              tree.elements[i-1].choices.length === 2) {

              var index_eps = toc.util.index(tree.elements[i-1].choices, makeEps());

              if (index_eps >= 0) {
                var internal = index_eps === 0 ? tree.elements[i-1].choices[1] : tree.elements[i-1].choices[0];

                if (internal.tag === tags.SEQ && internal.elements.length === 2) {
                  if (internal.elements[0].tag === tags.KSTAR && internal.elements[0].expr.tag === tags.ALT &&
                      internal.elements[0].expr.choices.length === 2 && toc.util.contains(internal.elements[0].expr.choices, tree.elements[i].expr)) {
                    if (toc.util.contains(internal.elements[0].expr.choices, internal.elements[1])) {
                      tree.elements[i-1] = internal.elements[0];
                      tree.elements.splice(i, 1);
                      return true;
                    }
                  }
                }
              }
            }
          }
        }

        return false;
      }

      // (L1+$)(L2)* => (L2)* if L1 is subset of L2
      function _regex_simplify_27(tree, fsmCache) {
        if (tree.tag === tags.SEQ && tree.elements.length > 1) {
          for (var i=0; i<tree.elements.length; i++) {
            if (tree.elements[i].tag === tags.KSTAR) {
              if (i > 0 && tree.elements[i-1].tag === tags.ALT && tree.elements[i-1].choices.length > 1) {
                var index_eps = toc.util.index(tree.elements[i-1].choices, makeEps());

                if (index_eps >= 0) {
                  var eps = tree.elements[i-1].choices.splice(index_eps, 1)[0];

                  var fsm_kstar = getFromCacheOrCreateFsm(tree.elements[i], fsmCache);
                  var fsm_other = getFromCacheOrCreateFsm(tree.elements[i-1], fsmCache);

                  var found = false;

                  try {
                    if (toc.fsm.isSubset(fsm_kstar, fsm_other)) {
                      found = true;
                    }
                  } catch (e) {
                  }

                  if (found) {
                    tree.elements.splice(i-1, 1);
                    return true;
                  } else {
                    tree.elements[i-1].choices.splice(index_eps, 0, eps);
                  }
                }
              } else if (i < tree.elements.length-1 && tree.elements[i+1].tag === tags.ALT && tree.elements[i+1].choices.length > 1) {
                var index_eps = toc.util.index(tree.elements[i+1].choices, makeEps());

                if (index_eps >= 0) {
                  var eps = tree.elements[i+1].choices.splice(index_eps, 1)[0];

                  var fsm_kstar = getFromCacheOrCreateFsm(tree.elements[i], fsmCache);
                  var fsm_other = getFromCacheOrCreateFsm(tree.elements[i+1], fsmCache);

                  var found = false;

                  try {
                    if (toc.fsm.isSubset(fsm_kstar, fsm_other)) {
                      found = true;
                    }
                  } catch (e) {
                  }

                  if (found) {
                    tree.elements.splice(i+1, 1);
                    return true;
                  } else {
                    tree.elements[i+1].choices.splice(index_eps, 0, eps);
                  }
                }
              }
            }
          }
        }
      }

      // (a()) => ()
      function _regex_simplify_25(tree, fsmCache) {
        if (tree.tag === tags.SEQ && tree.elements.length >= 1) {
          for (var i=0; i<tree.elements.length; i++) {
            if ((tree.elements[i].tag === tags.SEQ && tree.elements[i].elements.length === 0) ||
                (tree.elements[i].tag === tags.ALT && tree.elements[i].choices.length === 0)) {
              tree.elements = [];
              return true;
            }
          }
        }

        return false;
      }

      // ()* => ()
      function _regex_simplify_26(tree, fsmCache) {
        if (tree.tag === tags.KSTAR && tree.expr.tag === tags.SEQ && tree.expr.elements.length === 0) {
          tree.tag = tags.SEQ;
          delete tree.expr;
          tree.elements = [];
          return true;
        }

        return false;
      }

      _regex_simplification_patterns.push({ 'pattern' : "(a()) => ()", 'type' : 'structure', 'function' : _regex_simplify_25});
      _regex_simplification_patterns.push({ 'pattern' : "()* => ()", 'type' : 'structure', 'function' : _regex_simplify_26});
      _regex_simplification_patterns.push({ 'pattern' : "(a) => a", 'type' : 'structure', 'function' : _regex_simplify_1 });
      _regex_simplification_patterns.push({ 'pattern' : "(a) => a", 'type' : 'structure', 'function' : _regex_simplify_2 });
      _regex_simplification_patterns.push({ 'pattern' : "$* => $", 'type' : 'structure', 'function' : _regex_simplify_3});
      _regex_simplification_patterns.push({ 'pattern' : "(a*)* => a*", 'type' : 'structure', 'function' : _regex_simplify_4});
      _regex_simplification_patterns.push({ 'pattern' : "(a+b*)* => (a+b)*", 'type' : 'structure', 'function' : _regex_simplify_5});
      _regex_simplification_patterns.push({ 'pattern' : "$+a* => a*", 'type' : 'structure', 'function' : _regex_simplify_6});
      _regex_simplification_patterns.push({ 'pattern' : "(a*b*)* => (a*+b*)*", 'type' : 'structure', 'function' : _regex_simplify_7});
      _regex_simplification_patterns.push({ 'pattern' : "$a => a", 'type' : 'structure', 'function' : _regex_simplify_8});
      _regex_simplification_patterns.push({ 'pattern' : "a+a => a", 'type' : 'structure', 'function' : _regex_simplify_11});
      _regex_simplification_patterns.push({ 'pattern' : "a+a* => a*", 'type' : 'structure', 'function' : _regex_simplify_12});
      _regex_simplification_patterns.push({ 'pattern' : "a*a* => a*", 'type' : 'structure', 'function' : _regex_simplify_13});
      _regex_simplification_patterns.push({ 'pattern' : "(aa+a)* => (a)*", 'type' : 'structure', 'function' : _regex_simplify_14});
      _regex_simplification_patterns.push({ 'pattern' : "(a + $)* => (a)*", 'type' : 'structure', 'function' : _regex_simplify_15});
      _regex_simplification_patterns.push({ 'pattern' : "(ab+ac) => a(b+c)", 'type' : 'structure', 'function' : _regex_simplify_16});
      _regex_simplification_patterns.push({ 'pattern' : "a*aa* => aa*", 'type' : 'structure', 'function' : _regex_simplify_17});
      _regex_simplification_patterns.push({ 'pattern' : "(ab+cb) => (a+c)b", 'type' : 'structure', 'function' : _regex_simplify_18});
      _regex_simplification_patterns.push({ 'pattern' : "a*($+b(a+b)*) => (a+b)*", 'type' : 'structure', 'function' : _regex_simplify_23});
      _regex_simplification_patterns.push({ 'pattern' : "($+(a+b)*a)b* => (a+b)*", 'type' : 'structure', 'function' : _regex_simplify_24});
      _regex_simplification_patterns.push({ 'pattern' : "$+L => L, if L contains $", 'type' : 'fsm', 'function' : _regex_simplify_22});
      _regex_simplification_patterns.push({ 'pattern' : "L1+L2 => L2, if L1 is subset of L2", 'type' : 'fsm', 'function' : _regex_simplify_19});
      _regex_simplification_patterns.push({ 'pattern' : "(L1+L2)* => L2, if L1* is subset of L2*", 'type' : 'fsm', 'function' : _regex_simplify_20});
      _regex_simplification_patterns.push({ 'pattern' : "L1*L2* => L2, if L1* is subset of L2*", 'type' : 'fsm', 'function' : _regex_simplify_21});
      _regex_simplification_patterns.push({ 'pattern' : "(L1+$)(L2)* => (L2)* if L1 is subset of L2", 'type' : 'fsm', 'function' : _regex_simplify_27});
      _regex_simplification_patterns.push({ 'pattern' : "ab(cd) => abcd", 'type' : 'structure', 'function' : _regex_simplify_10});
      _regex_simplification_patterns.push({ 'pattern' : "(a+(b+c)) => a+b+c", 'type' : 'structure', 'function' : _regex_simplify_9});

      function simplify(tree, config) {
        var treeClone = toc.util.clone(tree);

        if (typeof config === "undefined") {
          config = {};
        }

        var opts = toc.util.clone(config);

        if (typeof opts.numIterations === "undefined") {
          opts.numIterations = null;
        }

        if (typeof opts.appliedPatterns === 'undefined') {
          opts.appliedPatterns = null;
        } else {
          opts.appliedPatterns = config.appliedPatterns;
        }

        if (typeof opts.useFsmPatterns === "undefined") {
          opts.useFsmPatterns = true;
        }

        var appliedPattern = "temp";
        var iterCount = 0;
        var fsmCache = new toc.util.HashTable();

        while (appliedPattern !== null && (opts.numIterations === null || iterCount < opts.numIterations)) {
          appliedPattern = _simplify_iteration(treeClone, fsmCache, opts.useFsmPatterns);

          if (appliedPattern !== null && opts.appliedPatterns !== null) {
            opts.appliedPatterns.push(appliedPattern);
          }

          iterCount += 1;
        }

        return treeClone;
      }

      function _simplify_iteration(tree, fsmCache, useFsmPatterns) {
        var pattern = null;
        var result = null;

        for (var i=0; i<_regex_simplification_patterns.length; i++) {
          pattern = _regex_simplification_patterns[i];

          if (useFsmPatterns === false && pattern.type === "fsm") {
            continue;
          }

          result = _simplify_recursion(tree, pattern['function'], fsmCache);

          if (result) {
            return pattern.pattern;
          }
        }

        return null;
      }

      function _simplify_recursion(tree, patternFunction, fsmCache) {
        var appliedPattern = patternFunction(tree, fsmCache);

        if (appliedPattern) {
          return appliedPattern;
        }

        var children = [];

        if (tree.tag === tags.ALT) {
          children = tree.choices;
        } else if (tree.tag === tags.SEQ) {
          children = tree.elements;
        } else if (tree.tag === tags.KSTAR) {
          children = [tree.expr];
        }

        for (var i=0; i<children.length; i++) {
          appliedPattern = _simplify_recursion(children[i], patternFunction, fsmCache);
          if (appliedPattern) {
            return appliedPattern;
          }
        }

        return false;
      }

      // The choices parameter must be an array of expression trees.
      // Returns the root of a new tree that represents
      //  the expression that is the union of
      // all the choices.
      function makeAlt(choices) {
        return {
          tag: tags.ALT,
          choices: choices
        };
      }

      // The elements parameter must be an array of expression trees.
      // Returns the root of a new tree that represents
      //  the expression that is the sequence
      // of all the elements.
      function makeSeq(elements) {
        return {
          tag: tags.SEQ,
          elements: elements
        };
      }

      // Wraps the given expressin tree under a Kleene star operator.
      // Returns the root of the new tree.
      function makeKStar(expr) {
        return {
          tag: tags.KSTAR,
          expr: expr
        };
      }

      // Creates a node that represents the literal obj.
      function makeLit(obj) {
        return {
          tag: tags.LIT,
          obj: obj
        };
      }

      var epsNode = {
        tag: tags.EPS
      };
      // Returns a node representing the empty string regular expression.
      function makeEps() {
        return epsNode;
      }

      function _altToAutomaton(regex, automaton, stateCounter) {
        var l = toc.fsm.addState(automaton, stateCounter.getAndAdvance());
        var r = toc.fsm.addState(automaton, stateCounter.getAndAdvance());
        for (var i=0; i<regex.choices.length; i++) {
          var statePair = _dispatchToAutomaton(regex.choices[i], automaton, stateCounter);
          toc.fsm.addEpsilonTransition(automaton, l, [statePair[0]]);
          toc.fsm.addEpsilonTransition(automaton, statePair[1], [r]);
        }
        return [l, r];
      }

      function _seqToAutomaton(regex, automaton, stateCounter) {
        // Create the parts for the sequence elements and connect them via epsilon transitions.
        var l, r, statePair;
        for (var i=0; i<regex.elements.length; i++) {
          statePair = _dispatchToAutomaton(regex.elements[i], automaton, stateCounter);
          if (i === 0) { // this is the first element
            l = statePair[0];
          } else { // this is a later element that needs to be connected to the previous elements
            toc.fsm.addEpsilonTransition(automaton, r, [statePair[0]]);
          }
          r = statePair[1];
        }

        if (l === undefined) { // empty language
          l = toc.fsm.addState(automaton, stateCounter.getAndAdvance());
          r = toc.fsm.addState(automaton, stateCounter.getAndAdvance());
        }

        return [l, r];
      }

      function _KStarToAutomaton(regex, automaton, stateCounter) {
        var l = toc.fsm.addState(automaton, stateCounter.getAndAdvance());
        var r = toc.fsm.addState(automaton, stateCounter.getAndAdvance());
        var inner = _dispatchToAutomaton(regex.expr, automaton, stateCounter);
        var ll = inner[0];
        var rr = inner[1];
        toc.fsm.addEpsilonTransition(automaton, l, [r]); // zero times
        toc.fsm.addEpsilonTransition(automaton, l, [ll]); // once or more times
        toc.fsm.addEpsilonTransition(automaton, rr, [ll]); // repeat
        toc.fsm.addEpsilonTransition(automaton, rr, [r]); // continue after one or more repetitions

        return [l, r];
      }

      function _litToAutomaton(regex, automaton, stateCounter) {
        // Generate the "left" and "right" states 
        // and connect them with the appropriate
        // transition symbol.
        var l = toc.fsm.addState(automaton, stateCounter.getAndAdvance());
        var r = toc.fsm.addState(automaton, stateCounter.getAndAdvance());
        try {
          toc.fsm.addSymbol(automaton, regex.obj);
        } catch (err) {
            // addSymbol can throw if the symbol already exists - that's ok but
            // would like to be able to avoid catching other exceptions
            // TODO: use a custom exception class instead of Error
        }
        toc.fsm.addTransition(automaton, l, [r], regex.obj);
        return [l, r];
      }

      function _epsToAutomaton(regex, automaton, stateCounter) {
        // Generate the "left" and "right" states and connect them with an epsilon transition.
        var l = toc.fsm.addState(automaton, stateCounter.getAndAdvance());
        var r = toc.fsm.addState(automaton, stateCounter.getAndAdvance());
        toc.fsm.addEpsilonTransition(automaton, l, [r]);
        return [l, r];
      }

      var _toAutomatonFuns = {};
      _toAutomatonFuns[tags.ALT] = _altToAutomaton;
      _toAutomatonFuns[tags.SEQ] = _seqToAutomaton;
      _toAutomatonFuns[tags.KSTAR] = _KStarToAutomaton;
      _toAutomatonFuns[tags.LIT] = _litToAutomaton;
      _toAutomatonFuns[tags.EPS] = _epsToAutomaton;

      function _dispatchToAutomaton(regex, automaton, stateCounter) {
        return _toAutomatonFuns[regex.tag](regex, automaton, stateCounter);
      }

      // Returns the equivalent FSM for the specified regular expression in the tree representation.
      function toAutomaton(regex) {
        var automaton = toc.fsm.makeNew();
        var statePair = _dispatchToAutomaton(regex, automaton, toc.util.makeCounter(0));
        toc.fsm.setInitialState(automaton, statePair[0]);
        toc.fsm.addAcceptingState(automaton, statePair[1]);
        return automaton;
      }


      // "Operator" precedence lookup. This is used when determining if we need to
      // insert parentheses to preserve the meaning of the regex when converting from
      // the tree representation to the array representation.
      var _prec = {};
      _prec[tags.ALT] = 0;
      _prec[tags.SEQ] = 1;
      _prec[tags.KSTAR] = 2;
      // these two are not operators, but it's convenient to assign them a precedence
      // for uniformity... since they are just atoms (i.e. can't be "regrouped"), their
      // precedence is higher than all the operators
      _prec[tags.LIT] = 3;
      _prec[tags.EPS] = 3;

      // Returns true if parantheses are needed around the child expression
      // when it is embedded into the parent expression, false otherwise.
      function _needParens(par, child) {
        return _prec[par.tag] >= _prec[child.tag];
      }

      // Add child to the array representation, and surround it with parentheses
      // if necessary.
      function _optParenToArray(par, child, arr) {
        var parens = _needParens(par, child);
        if (parens) {
            arr.push(toc.re.array.specials.LEFT_PAREN);
        }
        _dispatchToArray(child, arr);
        if (parens) {
            arr.push(toc.re.array.specials.RIGHT_PAREN);
        }
      }

      // Common implementation for _altToArray and _seqToArray.
      function _binOpToArray(regex, arr, parts, operand) {
        for (var i=0; i<parts.length; i++) {
          if (operand!==undefined && i>0) {
            arr.push(operand);
          }
          _optParenToArray(regex, parts[i], arr);
        }
      }

      function _altToArray(regex, arr) {
        _binOpToArray(regex, arr, regex.choices, toc.re.array.specials.ALT);
      }

      function _seqToArray(regex, arr) {
        _binOpToArray(regex, arr, regex.elements);
      }

      function _KStarToArray(regex, arr) {
        _optParenToArray(regex, regex.expr, arr);
        arr.push(toc.re.array.specials.KSTAR);
      }

      function _litToArray(regex, arr) {
        arr.push(regex.obj);
      }

      function _epsToArray(regex, arr) {
        arr.push(toc.re.array.specials.EPS);
      }

      var _toArrayFuns = {};
      _toArrayFuns[tags.ALT] = _altToArray;
      _toArrayFuns[tags.SEQ] = _seqToArray;
      _toArrayFuns[tags.KSTAR] = _KStarToArray;
      _toArrayFuns[tags.LIT] = _litToArray;
      _toArrayFuns[tags.EPS] = _epsToArray;

      // Calls the appropriate *ToArray function to handle the various kinds of regular expressions.
      // @a arr acts as an accumulator for all *ToArray functions.
      function _dispatchToArray(regex, arr) {
        return _toArrayFuns[regex.tag](regex, arr);
      }

      function toArray(regex) {
        var arr = [];
        _dispatchToArray(regex, arr);
        return arr;
      }
      function toString(regex) {
        return toc.re.array.toString(toArray(regex));
      }

      
      function random(numSymbols, alphabet, cfg) {
        var altp = 0.5;
        var kleenep = 0.1;
        var epsp = 0.1;
        if (cfg) {
          if (cfg.ALT_PROB) {
            altp = cfg.ALT_PROB;
          }
          if (cfg.KLEENE_PROB) {
            kleenep = cfg.KLEENE_PROB;
          }
          if (cfg.EPS_PROB) {
            epsp = cfg.EPS_PROB;
          }
        }

        return _randomKleene(numSymbols, alphabet, altp, kleenep, epsp);
      }

      function _randomKleene(numSymbols, alphabet, altp, kleenep, epsp) {
        var expr = _randomExpr(numSymbols, alphabet, altp, kleenep, epsp);
        if (Math.random() <= kleenep) {
          expr = makeKStar(expr);
        }
        return expr;
      }

      function _randomExpr(numSymbols, alphabet, altp, kleenep, epsp) {
        if (numSymbols === 0) {
          return makeEps();
        } else if (numSymbols == 1) {
          return makeLit(alphabet[toc.util.randint(0, alphabet.length-1)]);
        } else if (Math.random() <= epsp) {
          return makeAlt([makeEps(),
              _randomKleene(numSymbols, alphabet, altp, kleenep, epsp)]);
        } else {
          var left_sz = toc.util.randint(1, numSymbols-1);
          var left = _randomKleene(left_sz, alphabet, altp, kleenep, epsp);
          var right = _randomKleene(numSymbols - left_sz, alphabet, altp, kleenep, epsp);
          if (Math.random() <= altp) {
            return makeAlt([left, right]);
          } else {
            return makeSeq([left, right]);
          }
        }
      }

      return {
        tags: tags,

        makeAlt: makeAlt,
        makeSeq: makeSeq,
        makeKStar: makeKStar,
        makeLit: makeLit,
        makeEps: makeEps,

        toAutomaton: toAutomaton,
        toArray: toArray,
        toString: toString,

        random: random,
        simplify: simplify
      };
    })();


    var array = (function() {

      var specials = {
        ALT: {},
        KSTAR: {},
        LEFT_PAREN: {},
        RIGHT_PAREN: {},
        EPS: {}
      };
      specials.ALT.toString = function() { return "+"; };
      specials.KSTAR.toString = function() { return "*"; };
      specials.LEFT_PAREN.toString = function() { return "("; };
      specials.RIGHT_PAREN.toString = function() { return ")"; };
      specials.EPS.toString = function() { return "$"; };

  
      function RegexError(message, position) {
        this.name = "RegexError";
        this.message = message;
        this.position = position;
      }

      // We do this to get the stack trace when RegexError objects are thrown.
      RegexError.prototype = new Error();

      function _peek() {
        return this.arr[this.idx];
      }
      function _advance() {
        ++this.idx;
      }
      function _makeInputSeq(arr) {
        return {
          arr: arr,
          idx: 0,
          peek: _peek,
          advance: _advance
        };
      }

      // Returns the tree representation of the regex given by @a arr.
      function toTree(arr) {
        // special case for the empty language
        // empty subexpressions are not allowed except when defining the empty language
        if (arr.length === 0) {
          return toc.re.tree.makeSeq([]);
        }
        var input = _makeInputSeq(arr);
        var result = _parseExpr(input);

        // should be at end of input
        if (input.peek() !== undefined) {
          throw new RegexError("Malformed regex array: successfully parsed up to position " + input.idx, input.idx);
        }
        return result;
      }

      // Returns the replacement string for objects in toc.re.array.specials or
      // undefined if @a obj doesn't match any of them.
      function _replacementStr(obj) {
        // This can't be done with a dict because objects are not hashable...
        if (obj === specials.ALT || obj === specials.KSTAR ||
            obj === specials.LEFT_PAREN || obj === specials.RIGHT_PAREN ||
            obj === specials.EPS) {
          return obj.toString();
        } else {
          return undefined;
        }
      }

      function _escape(chr) {
        var escapable = toc.re.string.escapable;
        for (var i=0; i<escapable.length; i++) {
          if (chr === escapable[i]) {
            return "\\" + chr;
          }
        }
        return chr;
      }

      // Returns the string representation of the regex given by @a arr.
      // Throws if the regex contains any symbols which are not one-character strings
      // and special symbols from toc.re.array.specials.
      function toString(arr) {
        var res = [];
        var elem;
        var failed = false;
        for (var i=0; i<arr.length; i++) {
          elem = arr[i];
          if (typeof(elem) === "string") {
            if (elem.length !== 1) {
              failed = true;
            } else {
              elem = _escape(elem);
            }
          } else {
            elem = _replacementStr(elem);
            if (elem === undefined) {
              failed = true;
            }
          }
          if (failed) {
            throw new RegexError("Array regex not convertible to string representation:" +
                " failed at position " + i, i);
          }
          res.push(elem);
        }
        return res.join("");
      }

      // Returns the automaton accepting the language represented by the regex @a arr.
      // Semantically equivalent to first calling toTree on @a arr and then converting
      // the result to an automaton via toc.re.tree.toAutomaton.
      function toAutomaton(arr) {
        var tree = toc.re.array.toTree(arr);
        return toc.re.tree.toAutomaton(tree);
      }

      function _parseExpr(input) {
        var concats = [];
        while (true) {
          concats.push(_parseConcat(input));
          if (input.peek() === specials.ALT) {
            input.advance();
          } else {
            break;
          }
        }

        return toc.re.tree.makeAlt(concats);
      }

      function _parseConcat(input) {
        var katoms = [];
        var katom;
        while (true) {
          katom = _parseKatom(input);
          if (katom === undefined) {
            break;
          }
          katoms.push(katom);
        }
        if (katoms.length === 0) {
          throw new RegexError("Malformed regex array: empty choice subexpression at index " +
              input.idx, input.idx);
        }

        return toc.re.tree.makeSeq(katoms);
      }

      function _parseKatom(input) {
        var atom = _parseAtom(input);
        if (input.peek() === specials.KSTAR) {
          input.advance();
          atom = toc.re.tree.makeKStar(atom);
        }
        return atom;
      }

      function _parseAtom(input) {
        if (input.peek() === specials.LEFT_PAREN) {
          input.advance(); // skip the left parenthesis
          var expr = _parseExpr(input);
          if (input.peek() !== specials.RIGHT_PAREN) {
            throw new RegexError("Malformed regex array: missing matching right parenthesis at index " +
                input.idx, input.idx);
          }
          input.advance(); // skip the right parenthesis
          return expr;
        } else if (input.peek() === specials.EPS) {
          input.advance();
          return toc.re.tree.makeEps();
        } else if (input.peek()===undefined || input.peek()===specials.ALT ||
              input.peek()===specials.RIGHT_PAREN) {
          return undefined; // this will stop the parsing of <concat>
        } else if (input.peek() === specials.KSTAR) {
            throw new RegexError("Malformed regex array: empty subexpression before Kleene star at index " +
                input.idx, input.idx);
        } else {
          var sym = toc.re.tree.makeLit(input.peek());
          input.advance();
          return sym;
        }
      }

      // Returns a random regex in the array representation.
      // See toc.re.tree.random for further information.
      function random(numSymbols, alphabet, cfg) {
        return toc.re.tree.toArray(toc.re.tree.random(numSymbols, alphabet, cfg));
      }

      function simplify(arr, numIterations, appliedPatterns) {
        var tree = toc.re.array.toTree(arr);
        var treeSimplified = toc.re.tree.simplify(tree, numIterations, appliedPatterns);
        return toc.re.tree.toArray(treeSimplified);
      }

      return {
        specials: specials,

        toTree: toTree,
        toString: toString,
        toAutomaton: toAutomaton,

        random: random,
        simplify: simplify
      };
    })();


  
    var string = (function() {

      var escapable = "$+*()\\";

      function toArray(str) {
        var arr = [];
        var escaped = false;
        var specials = toc.re.array.specials;
        var chr;
        for (var i=0; i<str.length; ++i) {
          if (escaped) {
            if (escapable.indexOf(str[i]) === -1) {
              throw new RegexError("Malformed string regex: illegal escape sequence \\" + str[i], i);
            }
            arr.push(str[i]); // the result of the escape sequence is the escaped character itself
            escaped = false;
          } else if (str[i] === '\\') {
            escaped = true;
          } else {
            chr = str[i];
            switch (chr) {
              case "$": chr = specials.EPS; break;
              case "+": chr = specials.ALT; break;
              case "*": chr = specials.KSTAR; break;
              case "(": chr = specials.LEFT_PAREN; break;
              case ")": chr = specials.RIGHT_PAREN; break;
            }
            arr.push(chr);
          }
        }
        if (escaped) {
          throw new RegexError("Malformed string regex: unfinished escape sequence at end of string", str.length-1);
        }

        return arr;
      }

      function toTree(str) {
        var arr = toc.re.string.toArray(str);
        return toc.re.array.toTree(arr);
      }

      function toAutomaton(str) {
        var tree = toc.re.string.toTree(str);
        return toc.re.tree.toAutomaton(tree);
      }

      // Returns a random regex string. @a alphabet must be a string. The other
      // parameters have exactly the same role as in toc.re.tree.random.
      function random(numSymbols, alphabet, cfg) {
        var arr = [];
        for (var i=0; i<alphabet.length; i++) {
          arr.push(alphabet.charAt(i));
        }
        return toc.re.tree.toString(toc.re.tree.random(numSymbols, arr, cfg));
      }

      function simplify(str, numIterations, appliedPatterns) {
        var tree = toc.re.string.toTree(str);
        var treeSimplified = toc.re.tree.simplify(tree, numIterations, appliedPatterns);
        return toc.re.tree.toString(treeSimplified);
      }

      return {
        escapable: escapable,

        toArray: toArray,
        toTree: toTree,
        toAutomaton: toAutomaton,

        random: random,
        simplify: simplify
      };

    })();

    return {
      tree: tree,
      array: array,
      string: string
    };
  })();
