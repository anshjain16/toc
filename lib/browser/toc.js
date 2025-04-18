

(function (toc) {

if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
	module.exports = toc; // NodeJS
}

if (typeof exports !== "undefined" && typeof exports !== "function") {
	exports.toc = toc; // CommonJs
}

if (typeof define === "function" && define.amd) {
	define("toc", [], function () {
		return toc;
	}); // AMD
}

if (typeof window !== "undefined") {
	window.toc = toc; // <script>
}

}((function () {

var toc = {};

toc.util = {};

// taken from http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
toc.util.areEquivalent = function (object1, object2) {
	if (object1 === object2) {
		return true;
	}

	if (object1 instanceof Date && object2 instanceof Date) {
		return object1.getTime() === object2.getTime();
	}

	if (object1 instanceof RegExp && object2 instanceof RegExp) {
		return (
			object1.source === object2.source &&
			object1.global === object2.global &&
			object1.multiline === object2.multiline &&
			object1.lastIndex === object2.lastIndex &&
			object1.ignoreCase === object2.ignoreCase
		);
	}

	if (!(object1 instanceof Object) || !(object2 instanceof Object)) {
		return false;
	}

	if (typeof object1 === "undefined" || typeof object2 === "undefined") {
		return false;
	}

	if (object1.constructor !== object2.constructor) {
		return false;
	}

	for (var p in object1) {
		if (!(p in object2)) {
			return false;
		}

		if (object1[p] === object2[p]) {
			continue;
		}

		if (typeof object1[p] !== "object") {
			return false;
		}

		if (!toc.util.areEquivalent(object1[p], object2[p])) {
			return false;
		}
	}

	for (p in object2) {
		if (!(p in object1)) {
			return false;
		}
	}

	return true;
};

toc.util.contains = function (arr, obj, startIndex) {
	startIndex = startIndex ? startIndex : 0;

	for (var i = startIndex; i < arr.length; i++) {
		if (toc.util.areEquivalent(arr[i], obj)) {
			return true;
		}
	}

	return false;
};

// returns the index of the leftmost obj instance in arr starting from startIndex or -1
// if no instance of obj is found
toc.util.index = function (arr, obj, startIndex) {
	var i = startIndex || 0;
	while (i < arr.length) {
		if (toc.util.areEquivalent(arr[i], obj)) {
			return i;
		}
		i++;
	}
	return -1;
};

// check if array arr1 contains all elements from array arr2
toc.util.containsAll = function (arr1, arr2) {
	for (var i = 0; i < arr2.length; i++) {
		if (!toc.util.contains(arr1, arr2[i])) {
			return false;
		}
	}

	return true;
};

// check if array arr1 contains any element from array arr2
toc.util.containsAny = function (arr1, arr2) {
	for (var i = 0; i < arr2.length; i++) {
		if (toc.util.contains(arr1, arr2[i])) {
			return true;
		}
	}

	return false;
};

// check if arrays arr1 and arr2 contain the same elements
toc.util.areEqualSets = function (arr1, arr2) {
	if (arr1.length !== arr2.length) {
		return false;
	}

	for (var i = 0; i < arr1.length; i++) {
		if (!toc.util.contains(arr2, arr1[i])) {
			return false;
		}
	}

	return true;
};

// check if array arr1 contains the set obj
toc.util.containsSet = function (arr1, obj) {
	for (var i = 0; i < arr1.length; i++) {
		if (toc.util.areEqualSets(arr1[i], obj)) {
			return true;
		}
	}

	return false;
};

// returns an unsorted array representation of the union of the two arrays arr1 and arr2
// with each element included exactly once, regardless of the count in arr1 and arr2
toc.util.setUnion = function (arr1, arr2) {
	var res = [];
	var i;
	for (i = 0; i < arr1.length; i++) {
		// this will not include duplicates from arr1
		if (!toc.util.contains(res, arr1[i])) {
			res.push(arr1[i]);
		}
	}
	for (i = 0; i < arr2.length; i++) {
		if (!toc.util.contains(res, arr2[i])) {
			res.push(arr2[i]);
		}
	}
	return res;
};

// returns an unsorted array representation of the intersection of the two
// arrays arr1 and arr2 with each element included exactly once, regardless
// of the count in arr1 and arr2
toc.util.setIntersection = function (arr1, arr2) {
	var res = [];
	var i;
	for (i = 0; i < arr1.length; i++) {
		if (toc.util.contains(arr2, arr1[i])) {
			res.push(arr1[i]);
		}
	}

	return res;
};

// make a deep clone of an object
toc.util.clone = function (obj) {
	return JSON.parse(JSON.stringify(obj));
};

// Returns an object that is basically an integer reference useful for counting
// across multiple function calls. The current value can be accessed through the
// value property.
// See the toc.re.tree.toAutomaton function for a usage example.
toc.util.makeCounter = (function () {
	function getAndAdvance() {
		return this.value++;
	}

	function makeCounter(init) {
		return {
			value: init,
			getAndAdvance: getAndAdvance,
		};
	}

	return makeCounter;
})();

// Returns a random integer from the interval [from, to].
toc.util.randint = function (from, to) {
	return Math.floor(Math.random() * (to - from + 1)) + from;
};

  var structure = {};

  /* General purpose hashtable implementation.
   * Note that all the performance guarantees assume (as usual for hashtables) that
   *    1) hashing keys is O(1)
   *    2) comparing keys for equality is O(1)
   *    3) array access in JS is O(1)
   * In other words, the guarantees specify the number of these
   * three operations for any hashtable operation, rather than
   * actual time.
   */
  (function() {
    var CAPACITY_CHOICES = [5, 11, 23, 47, 97, 197, 397, 797, 1597, 3203, 6421, 12853,
        25717, 51437, 102877, 205759, 411527, 823117, 1646237, 3292489, 6584983,
        13169977, 26339969, 52679969, 105359939];

    var DEFAULT_INITIAL_CAPACITY_IDX = 0;
    var HASH_MASK = (1<<31) - 1; // keeps everything nonnegative int32
    var LF_HIGH = 0.75; // load factor upper limit
    var LF_LOW = 0.25; // load factor lower limit

    // See http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
    function _isArray(obj) {
      return Object.prototype.toString.call(obj) === "[object Array]";
    }

    function _get_capacity_index(wanted) {
      wanted = Math.max(wanted, CAPACITY_CHOICES[0]);
      wanted = Math.min(wanted, CAPACITY_CHOICES[CAPACITY_CHOICES.length-1]);
      var lo = 0;
      var hi = CAPACITY_CHOICES.length - 1;
      var mid;
      // binary search for the smallest capacity no smaller than wanted
      while (lo < hi) {
        mid = lo + Math.floor((hi-lo)/2);
        if (CAPACITY_CHOICES[mid] >= wanted) {
          hi = mid;
        } else {
          lo = mid + 1;
        }
      }
      return lo;
    }

    // TODO: needs serious testing
    function _defaultHash(obj) {
      var h, i;
      if (obj === undefined) { // undefined might be a "value" of some property
        return 12345; // arbitrary constant
      }
      if (obj === null) {
        return 54321; // arbitrary constant
      }
      if (typeof obj==="boolean" || typeof obj==="number") {
        return obj & HASH_MASK;
      }
      if (typeof obj==="string") {
        h = 5381;
        for (i=0; i<obj.length; i++) {
          h = ((h*33) ^ obj.charCodeAt(i)) & HASH_MASK;
        }
        return h;
      }
      if (_isArray(obj)) {
        h = 6421;
        for (i=0; i<obj.length; i++) {
          h = ((h*37) ^ _defaultHash(obj[i])) & HASH_MASK;
        }
        return h;
      }

      // objects
      var props = [];
      for (i in obj) {
        if (!(obj.hasOwnProperty(i))) {
          continue;
        }
        props.push(i);
      }
      props.sort(); // sort them so that logically equal object get the same hash

      h = 3203;
      for (i=0; i<props.length; i++) {
        // hash both the property name and its value
        h = ((((h*39) ^ _defaultHash(props[i])) * 43) ^ _defaultHash(obj[props[i]])) & HASH_MASK;
      }
      return h;
    }

    // "deep" compare of two objects
    // taken from http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
    function _defaultEquals(object1, object2) {
      if (object1 === object2) {
        return true;
      }

      if (object1 instanceof Date && object2 instanceof Date) {
        return object1.getTime() === object2.getTime();
      }

      if (object1 instanceof RegExp && object2 instanceof RegExp) {
        return object1.source === object2.source &&
               object1.global === object2.global &&
               object1.multiline === object2.multiline &&
               object1.lastIndex === object2.lastIndex &&
               object1.ignoreCase === object2.ignoreCase;
      }

      if (!(object1 instanceof Object) || !(object2 instanceof Object) ) {
        return false;
      }

      if (typeof object1 === 'undefined' || typeof object2 === 'undefined') {
        return false;
      }

      if (object1.constructor !== object2.constructor) {
        return false;
      }

      for (var p in object1) {
        if (!(p in object2)) {
          return false;
        }

        if (object1[p] === object2[p]) {
          continue;
        }

        if (typeof(object1[p]) !== "object") {
          return false;
        }

        if (!(_defaultEquals(object1[p], object2[p]))) {
          return false;
        }
      }

      for (p in object2) {
        if (!(p in object1)) {
          return false;
        }
      }

      return true;
    }

    /* Constructor for hash chain nodes.
     *
     * Each node has three properties:
     *  - key: the key of the key-value pair
     *  - value: the value of the key-value pair
     *  - next: either another _HashChainNode or undefined if this is the last node
     *          of the chain
     */
    function _HashChainNode(key, value) {
      this.key = key;
      this.value = value;
    }

    /* Constructor for an empty hash chain used for collision resolution.
     *
     * Every _HashChain has just one property:
     *  - head: the first _HashChainNode of the chain or undefined if the chain is
     *          empty
     */
    function _HashChain() {
      // intentionally empty
    }

    // Returns true iff the chain is empty.
    _HashChain.prototype.isEmpty = function() {
      return this.head === undefined;
    };

    // Adds the new node to the front of the chain.
    _HashChain.prototype.insertHead = function(node) {
      node.next = this.head;
      this.head = node;
    };

    /* Removes the successor of @a node from the chain. It is assumed that
     * the successor exists.
     *
     * If @a node equals undefined, removes the head of the chain.
     */
    _HashChain.prototype.removeSuccessor = function(node) {
      if (node === undefined) {
        this.head = this.head.next;
      } else {
        node.next = node.next.next;
      }
    };

    /* Inserts the key-value pair into the chain.
     * @a H is the HashTable that contains this chain.
     *
     * Returns true iff @a key is a new key that was not previously in the table.
     */
    _HashChain.prototype.put = function(H, key, value) {
      // first search for the key
      var iter = this.iterator();
      while (iter.hasNext()) {
        var node = iter.next();
        if (H.equals(key, node.key)) {
          // old key; just replace the value
          node.value = value;
          return false;
        }
      }
      // new key
      this.insertHead(new _HashChainNode(key, value));
      return true;
    };

    /* Returns the value associated with @a key in the chain or undefined
     * if @a key is not found in the chain.
     */
    _HashChain.prototype.get = function(H, key) {
      var iter = this.iterator();
      while (iter.hasNext()) {
        var node = iter.next();
        if (H.equals(key, node.key)) {
          return node.value;
        }
      }
      return undefined;
    };

    /* Removes the key-value pair with the given key from the chain. Does nothing
     * if there is no key-value pair with the given key in the chain.
     *
     * Returns true iff a key-value pair was actually removed.
     */
    _HashChain.prototype.remove = function(H, key) {
      var iter = this.iterator();
      var prev; // intentionally undefined
      while (iter.hasNext()) {
        var node = iter.next();
        if (H.equals(key, node.key)) {
          this.removeSuccessor(prev);
          return true;
        }
        prev = node;
      }
      return false;
    };

    /* Constructor for a hash chain iterator.
     *
     * Every iterator has two methods:
     *  - hasNext: returns true iff there is another node in the chain
     *  - next: returns the next node in the chain or throws if the iterator is
     *          exhausted
     *
     * If the hash chain changes in any way between the construction of the
     * iterator and a call to one of its methods, the behavior is undefined.
     */
    function _HashChainIterator(chain) {
      this.node = chain.head;
    }
    _HashChainIterator.prototype.hasNext = function() {
      return this.node !== undefined;
    };
    _HashChainIterator.prototype.next = function() {
      if (!this.hasNext()) {
        throw new Error("HashTable internal error: " +
            "called _HashChainIterator.next on exhausted iterator");
      }
      var retval = this.node;
      this.node = retval.next;
      return retval;
    };

    // Returns a new iterator for the hash chain.
    _HashChain.prototype.iterator = function() {
      return new _HashChainIterator(this);
    };


    /* Resizes the HashTable @a H to have capacity CAPACITY_CHOICES[to_cap_idx].
     * Throws if @a to_cap_idx >= CAPACITY_CHOICES.length.
     * Does nothing if @a to_cap_idx < 0, i.e. the HashTable never decreases below
     * CAPACITY_CHOICES[0] capacity.
     *
     * Takes O(n) time where n is the number of mappings in the HashTable.
     */
    function _resize(H, to_cap_idx) {
      if (to_cap_idx >= CAPACITY_CHOICES.length) {
        throw new Error("Capacity of HashTable can't grow beyond " + CAPACITY_CHOICES[CAPACITY_CHOICES.length - 1]);
      }
      if (to_cap_idx >= 0) {
        var old_cap = H.capacity;
        var old_slots = H.slots;

        H.capacity_index = to_cap_idx;
        H.capacity = CAPACITY_CHOICES[to_cap_idx];
        H.slots = [];
        for (var i=0; i<old_cap; i++) {
          if (old_slots[i] !== undefined) {
            var chain_iter = old_slots[i].iterator();
            while (chain_iter.hasNext()) {
              H._putNodeRsz(chain_iter.next());
            }
          }
        }
      }
    }

    // Returns the slot index for @a key in the hashtable @a H.
    function _getSlotIndex(H, key) {
      return H.hash(key) % H.capacity; // division method
    }

    /* Constructor for HashTable. To create an empty HashTable, do something like
     * var H = new structure.HashTable();
     *
     * @a cfg is optional and can contain any or all of the following properties
     *    - initial_capacity: a number that is a hint for the initial capacity
     *        - defaults to an implementation defined number
     *    - hash: a function that takes an object and returns a nonnegative 32-bit integer
     *        - the usual requirements for this function apply
     *           - it must be consistent, i.e. return the same value for the same object
     *             (if the object doesn't change)
     *           - if two objects are equal by the client's definition of equality,
     *             this function must return the same value for both of them
     *        - defaults to _defaultHash
     *   - equals: a function that takes two objects and returns true iff they are logically equal
     *        - the usual requirements for this function apply
     *           - it must be reflexive, symmetric and transitive
     *           - it must be consistent i.e. return the same value for unchanged arguments every
     *             time it's called
     *        - defaults to _defaultEqauls
     *
     * If you provide either hash or equals, you probably want to provide both
     */
    structure.HashTable = function(cfg) {
      this.capacity_index = DEFAULT_INITIAL_CAPACITY_IDX;
      if (cfg) {
        if (cfg.initial_capacity) {
          this.capacity_index = _get_capacity_index(cfg.initial_capacity);
        }
        if (cfg.hash) { // otherwise we use the prototype one
          this.hash = cfg.hash;
        }
        if (cfg.equals) { // otherwise we use the prototype one
          this.equals = cfg.equals;
        }
      }

      // this is redundan't information, but keeps code somewhat cleaner
      this.capacity = CAPACITY_CHOICES[this.capacity_index];
      this.numkeys = 0; // start out empty

      // we will use undefined as the indicator for empty slots so
      // we don't actually need to "allocate" the capacity because
      // JS arrays don't actually have bounds and a[i] returns
      // undefined if the ith element is "out of bounds"...
      // however, take care to never use this.slots.length as it will
      // be meaningless
      this.slots = [];
    };

    // defaults for hash and equals
    structure.HashTable.prototype.hash = _defaultHash;
    structure.HashTable.prototype.equals = _defaultEquals;

    // Returns the load factor of the HashTable, i.e. the ratio
    // of occupied slots to the capacity.
    structure.HashTable.prototype.loadFactor = function() {
      return this.numkeys / this.capacity;
    };

    /* Add the key-value pair to the HashTable.
     * Throws if @a key or @a value equals undefined.
     *
     * Takes O(1) time amortized, assuming uniform hashing.
     *
     * Only references to the key and value are stored, i.e. the client must do defensive
     * copies if they are required. If the key is mutable and changes after this operation
     * is performed, the behavior is undefined (the HashTable will most likely become
     * invalid and unpredictibly useless).
     * Changes to the value object are allowed but are in most situations probably
     * an indicator of bad design.
     */
    structure.HashTable.prototype.put = function(key, value) {
      if (key === undefined) {
        throw new Error("called HashTable.put with key === undefined");
      }

      if (value === undefined) {
        throw new Error("called HashTable.put with value === undefined");
      }

      var h = _getSlotIndex(this, key);
      if (this.slots[h] === undefined) {
        this.slots[h] = new _HashChain();
      }
      if (this.slots[h].put(this, key, value)) {
        ++this.numkeys;
        if (this.loadFactor() > LF_HIGH) {
          _resize(this, this.capacity_index + 1);
        }
      }
    };

    /* This is an internal put method that reuses existing _HashChainNode objects
     * to reduce garbage generation when the table gets resized.
     *
     * Don't use this outside of resizing functionality!
     */
    structure.HashTable.prototype._putNodeRsz = function(node) {
      // we don't check the validity of node.key and node.value because
      // it is assumed they are valid as they are already in a preexisting node
      var h = _getSlotIndex(this, node.key);
      if (this.slots[h] === undefined) {
        this.slots[h] = new _HashChain();
      }
      // don't need to actually iterate the chain to search for matching keys
      // because we know that the keys were unique prior to resizing
      this.slots[h].insertHead(node);
      // we don't check the load factor because we know that we have just
      // recently resized so no further resizing will be needed
    };

    /* Returns the value associated with @a key in the HashTable or
     * undefined if @a key is not found.
     *
     * Throws if @a key equals undefined.
     *
     * Takes O(1) time, assuming uniform hashing.
     */
    structure.HashTable.prototype.get = function(key) {
      if (key === undefined) {
        throw new Error("called HashTable.get with key === undefined");
      }

      var h = _getSlotIndex(this, key);
      var slot = this.slots[h];
      return slot===undefined ? undefined : slot.get(this, key);
    };

    /* Removes @a key from the HashTable. If @a key is not in the HashTable,
     * this operation does nothing.
     *
     * Throws if @a key equals undefined.
     *
     * Takes O(1) time ammortized, assuming uniform hashing.
     */
    structure.HashTable.prototype.remove = function(key) {
      if (key === undefined) {
        throw new Error("called HashTable.remove with key === undefined");
      }

      var h = _getSlotIndex(this, key);
      var slot = this.slots[h];
      if (slot === undefined) {
        return;
      }
      if (slot.remove(this, key)) {
        --this.numkeys;
        if (this.loadFactor() < LF_LOW) {
          _resize(this, this.capacity_index - 1);
        }
      }
    };

    // Returns true iff the HashTable is empty.
    // O(1) time.
    structure.HashTable.prototype.isEmpty = function() {
      return this.numkeys === 0;
    };

    // Clears the HashTable, making it empty.
    // O(1) time.
    structure.HashTable.prototype.clear = function() {
      this.capacity_index = DEFAULT_INITIAL_CAPACITY_IDX;
      this.capacity = CAPACITY_CHOICES[this.capacity_index];
      this.numkeys = 0;
      this.slots = [];
    };

    // Returns the number of mappings in the HashTable.
    // O(1) time.
    structure.HashTable.prototype.size = function() {
      return this.numkeys;
    };

    // Returns true iff @a key is in the HashTable.
    // Equivalent to get(key) !== undefined.
    structure.HashTable.prototype.containsKey = function(key) {
      if (key === undefined) {
        throw new Error("called HashTable.containsKey with key === undefined");
      }

      return this.get(key) !== undefined;
    };

    // Returns an array with all the keys in the HashTable
    structure.HashTable.prototype.keys = function() {
      var keys = [];

      for (var it = this.keyIterator(); it.hasNext(); ) {
        keys.push(it.next());
      }

      return keys;
    };

    // Returns an array with all the values in the HashTable
    structure.HashTable.prototype.values = function() {
      var values = [];

      for (var it = this.valueIterator(); it.hasNext(); ) {
        values.push(it.next());
      }

      return values;
    };

    // Returns an array with all the key-value pairs in the HashTable
    structure.HashTable.prototype.entries = function() {
      var entries = [];

      for (var it = this.keyValueIterator(); it.hasNext(); ) {
        entries.push(it.next());
      }

      return entries;
    };

    // Iterators internals. The API is below.
    var Iterator = {
      hasNext: function() {
        // first try the current chain iterator
        if (this.cur_chain_iterator!==undefined && this.cur_chain_iterator.hasNext()) {
          return true;
        }
        if (this.cur_chain_iterator !== undefined) {
          ++this.idx; // this chain iterator was exhausted
        }
        // try to find another chain
        while (this.idx<this.H.capacity &&
            (this.H.slots[this.idx]===undefined || // no chain OR
             this.H.slots[this.idx].isEmpty())) {  // empty chain
          ++this.idx;
        }
        var slotval = this.H.slots[this.idx];
        if (slotval === undefined) { // no more chains in the table
          this.cur_chain_iterator = undefined;
          return false;
        }
        this.cur_chain_iterator = slotval.iterator();
        return true; // we know this chain isn't empty so just return true
      },
      // @a err_msg is the message to throw if the iterator is empty
      // @a extract_next is a function that takes the iterator as its only
      // parameter and returns the required item
      _next: function(err_msg, extract_next) {
        if (!this.hasNext()) {
          throw new Error(err_msg);
        }
        //assert(this.H.keys[this.idx] !== undefined);
        var retval = extract_next(this);
        return retval;
      },
      // invoke function @a iterator_func with context @a context on each
      // element of the iterable collection
      each: function(iterator_func, context) {
        if (iterator_func === undefined) {
          throw new Error("called iterator.each with iterator_func === undefined");
        }

        for (var i=0, it = this; this.hasNext(); i++) {
          iterator_func.call(context, this.next(), i, this.H);
        }
      }
    };

    function _KeyIterator(H) {
      this.idx = 0;
      this.H = H;
    }
    _KeyIterator.prototype = Object.create(Iterator);
    _KeyIterator.prototype.next = function() {
      return this._next("KeyIterator.next called on empty iterator", function(it) {
        return it.cur_chain_iterator.next().key;
      });
    };

    function _ValueIterator(H) {
      this.idx = 0;
      this.H = H;
    }
    _ValueIterator.prototype = Object.create(Iterator);
    _ValueIterator.prototype.next = function() {
      return this._next("ValueIterator.next called on empty iterator", function(it) {
        return it.cur_chain_iterator.next().value;
      });
    };

    function _KeyValueIterator(H) {
      this.idx = 0;
      this.H = H;
    }
    _KeyValueIterator.prototype = Object.create(Iterator);
    _KeyValueIterator.prototype.next = function() {
      return this._next("KeyValueIterator.next called on empty iterator", function(it) {
        var node = it.cur_chain_iterator.next();
        return [node.key, node.value];
      });
    };

    /* Iterator API
     *
     * HashTable supports three iterators for iteration over keys, values
     * and key-value pairs.
     * The iterator is returned by the appropriate *Iterator
     * function on the hashtable. All three iterators have two methods
     *   - hasNext: Returns true iff there is at least one more item to iterate over.
     *   - next: Returns the next item from the iterator, or throws if the iterator is
     *           exhausted. It is guaranteed that next does not throw if a preceeding
     *           call to hasNext returned true.
     *   - each: Iterates over all elements in the collection, invoking a function on
     *           each element. The function is passed a reference to the element, the
     *           index of the element and a reference to the hashtable.
     *
     * If the HashTable changes in any way during iteration (e.g. by calling put, remove or clear),
     * the iterator is invalidated and the behavior of subsequent calls to hasNext or next is undefined.
     *
     * All three iterators iterate over the whole HashTable in O(n) time where n is the number of mappings
     * in the table.
     *
     * The KeyValueIterator's next method returns arrays of length two where the first element is the key
     * and the second element is the value.
     */
    structure.HashTable.prototype.keyIterator = function() {
      return new _KeyIterator(this);
    };
    structure.HashTable.prototype.valueIterator = function() {
      return new _ValueIterator(this);
    };
    structure.HashTable.prototype.keyValueIterator = function() {
      return new _KeyValueIterator(this);
    };

  })();

toc.util.HashTable = structure.HashTable;
delete structure;

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
	var errorState = "ERROR";

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

  /*
   * Regular expressions module.
   *
   * Parsed regular expressions are represented by a syntax tree. Tools for working with that
   * representation are accessible through toc.re.tree.
   *
   * Two linear representations are also available and provide a convenient way to specify
   * some languages, but are not composable like the tree representation. The array representation
   * is available through toc.re.array and supports arbitrarily complex literals. If all the
   * literals are characters, the string representation should be more convenient. It is
   * available through toc.re.string. These linear representations are only useful for specifying
   * languages and should usually be converted to a tree representation or to an automaton immediately.
   */
  toc.re = (function() {

    /*
     * Tools for creating and manipulating parsed regular expressions.
     *
     * The make* functions are a minimal API that can be used to create arbitrarily complex
     * regular expressions programatically.
     */
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

  return toc;
}())));
