(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var zenObservable = createCommonjsModule(function (module, exports) {
	 (function(fn, name) { { fn(exports, module); } })(function(exports, module) { // === Symbol Support ===

	function hasSymbol(name) {
	  return typeof Symbol === "function" && Boolean(Symbol[name]);
	}

	function getSymbol(name) {
	  return hasSymbol(name) ? Symbol[name] : "@@" + name;
	}

	// Ponyfill Symbol.observable for interoperability with other libraries
	if (typeof Symbol === "function" && !Symbol.observable) {
	  Symbol.observable = Symbol("observable");
	}

	// === Abstract Operations ===

	function hostReportError(e) {
	  setTimeout(function() { throw e });
	}

	function getMethod(obj, key) {
	  var value = obj[key];

	  if (value == null)
	    return undefined;

	  if (typeof value !== "function")
	    throw new TypeError(value + " is not a function");

	  return value;
	}

	function getSpecies(obj) {
	  var ctor = obj.constructor;
	  if (ctor !== undefined) {
	    ctor = ctor[getSymbol("species")];
	    if (ctor === null) {
	      ctor = undefined;
	    }
	  }
	  return ctor !== undefined ? ctor : Observable;
	}

	function addMethods(target, methods) {
	  Object.keys(methods).forEach(function(k) {
	    var desc = Object.getOwnPropertyDescriptor(methods, k);
	    desc.enumerable = false;
	    Object.defineProperty(target, k, desc);
	  });
	}

	function cleanupSubscription(subscription) {
	  // Assert:  observer._observer is undefined

	  var cleanup = subscription._cleanup;

	  if (!cleanup)
	    return;

	  // Drop the reference to the cleanup function so that we won't call it
	  // more than once
	  subscription._cleanup = undefined;

	  // Call the cleanup function
	  try { cleanup(); }
	  catch (e) { hostReportError(e); }
	}

	function subscriptionClosed(subscription) {
	  return subscription._observer === undefined;
	}

	function closeSubscription(subscription) {
	  if (subscriptionClosed(subscription))
	    return;

	  subscription._observer = undefined;
	  cleanupSubscription(subscription);
	}

	function cleanupFromSubscription(subscription) {
	  return function() { subscription.unsubscribe(); };
	}

	function Subscription(observer, subscriber) {
	  // Assert: subscriber is callable

	  // The observer must be an object
	  if (Object(observer) !== observer)
	    throw new TypeError("Observer must be an object");

	  this._cleanup = undefined;
	  this._observer = observer;

	  try {
	    var start$0 = getMethod(observer, "start");
	    if (start$0) start$0.call(observer, this);
	  } catch (e) {
	    hostReportError(e);
	  }

	  if (subscriptionClosed(this))
	    return;

	  observer = new SubscriptionObserver(this);

	  try {
	    // Call the subscriber function
	    var cleanup$0 = subscriber.call(undefined, observer);

	    // The return value must be undefined, null, a subscription object, or a function
	    if (cleanup$0 != null) {
	      if (typeof cleanup$0.unsubscribe === "function")
	        cleanup$0 = cleanupFromSubscription(cleanup$0);
	      else if (typeof cleanup$0 !== "function")
	        throw new TypeError(cleanup$0 + " is not a function");

	      this._cleanup = cleanup$0;
	    }
	  } catch (e) {
	    // If an error occurs during startup, then attempt to send the error
	    // to the observer
	    observer.error(e);
	    return;
	  }

	  // If the stream is already finished, then perform cleanup
	  if (subscriptionClosed(this))
	    cleanupSubscription(this);
	}

	addMethods(Subscription.prototype = {}, {
	  get closed() { return subscriptionClosed(this) },
	  unsubscribe: function() { closeSubscription(this); },
	});

	function SubscriptionObserver(subscription) {
	  this._subscription = subscription;
	}

	addMethods(SubscriptionObserver.prototype = {}, {

	  get closed() { return subscriptionClosed(this._subscription) },

	  next: function(value) {
	    var subscription = this._subscription;

	    // If the stream is closed, then return undefined
	    if (subscriptionClosed(subscription))
	      return;

	    var observer = subscription._observer;

	    try {
	      // If the observer has a "next" method, send the next value
	      var m$0 = getMethod(observer, "next");
	      if (m$0) m$0.call(observer, value);
	    } catch (e) {
	      hostReportError(e);
	    }
	  },

	  error: function(value) {
	    var subscription = this._subscription;

	    // If the stream is closed, throw the error to the caller
	    if (subscriptionClosed(subscription)) {
	      hostReportError(value);
	      return;
	    }

	    var observer = subscription._observer;
	    subscription._observer = undefined;

	    try {
	      var m$1 = getMethod(observer, "error");
	      if (m$1) m$1.call(observer, value);
	      else throw value;
	    } catch (e) {
	      hostReportError(e);
	    }

	    cleanupSubscription(subscription);
	  },

	  complete: function() {
	    var subscription = this._subscription;

	    if (subscriptionClosed(subscription))
	      return;

	    var observer = subscription._observer;
	    subscription._observer = undefined;

	    try {
	      var m$2 = getMethod(observer, "complete");
	      if (m$2) m$2.call(observer);
	    } catch (e) {
	      hostReportError(e);
	    }

	    cleanupSubscription(subscription);
	  },

	});

	function Observable(subscriber) {
	  // Constructor cannot be called as a function
	  if (!(this instanceof Observable))
	    throw new TypeError("Observable cannot be called as a function");

	  // The stream subscriber must be a function
	  if (typeof subscriber !== "function")
	    throw new TypeError("Observable initializer must be a function");

	  this._subscriber = subscriber;
	}

	addMethods(Observable.prototype, {

	  subscribe: function(observer) { for (var args = [], __$0 = 1; __$0 < arguments.length; ++__$0) args.push(arguments[__$0]); 
	    if (typeof observer === 'function') {
	      observer = {
	        next: observer,
	        error: args[0],
	        complete: args[1],
	      };
	    } else if (typeof observer !== 'object' || observer === null) {
	      observer = {};
	    }

	    return new Subscription(observer, this._subscriber);
	  },

	  forEach: function(fn) { var __this = this; 
	    return new Promise(function(resolve, reject) {
	      if (typeof fn !== "function")
	        return Promise.reject(new TypeError(fn + " is not a function"));

	      __this.subscribe({
	        _subscription: null,

	        start: function(subscription) {
	          if (Object(subscription) !== subscription)
	            throw new TypeError(subscription + " is not an object");

	          this._subscription = subscription;
	        },

	        next: function(value) {
	          var subscription = this._subscription;

	          if (subscription.closed)
	            return;

	          try {
	            fn(value);
	          } catch (err) {
	            reject(err);
	            subscription.unsubscribe();
	          }
	        },

	        error: reject,
	        complete: resolve,
	      });
	    });
	  },

	  map: function(fn) { var __this = this; 
	    if (typeof fn !== "function")
	      throw new TypeError(fn + " is not a function");

	    var C = getSpecies(this);

	    return new C(function(observer) { return __this.subscribe({
	      next: function(value) {
	        if (observer.closed)
	          return;

	        try { value = fn(value); }
	        catch (e) { return observer.error(e) }

	        observer.next(value);
	      },

	      error: function(e) { observer.error(e); },
	      complete: function() { observer.complete(); },
	    }); });
	  },

	  filter: function(fn) { var __this = this; 
	    if (typeof fn !== "function")
	      throw new TypeError(fn + " is not a function");

	    var C = getSpecies(this);

	    return new C(function(observer) { return __this.subscribe({
	      next: function(value) {
	        if (observer.closed)
	          return;

	        try { if (!fn(value)) return }
	        catch (e) { return observer.error(e) }

	        observer.next(value);
	      },

	      error: function(e) { observer.error(e); },
	      complete: function() { observer.complete(); },
	    }); });
	  },

	  reduce: function(fn) { var __this = this; 
	    if (typeof fn !== "function")
	      throw new TypeError(fn + " is not a function");

	    var C = getSpecies(this);
	    var hasSeed = arguments.length > 1;
	    var hasValue = false;
	    var seed = arguments[1];
	    var acc = seed;

	    return new C(function(observer) { return __this.subscribe({

	      next: function(value) {
	        if (observer.closed)
	          return;

	        var first = !hasValue;
	        hasValue = true;

	        if (!first || hasSeed) {
	          try { acc = fn(acc, value); }
	          catch (e) { return observer.error(e) }
	        } else {
	          acc = value;
	        }
	      },

	      error: function(e) { observer.error(e); },

	      complete: function() {
	        if (!hasValue && !hasSeed) {
	          return observer.error(new TypeError("Cannot reduce an empty sequence"));
	        }

	        observer.next(acc);
	        observer.complete();
	      },

	    }); });
	  },

	});

	Object.defineProperty(Observable.prototype, getSymbol("observable"), {
	  value: function() { return this },
	  writable: true,
	  configurable: true,
	});

	addMethods(Observable, {

	  from: function(x) {
	    var C = typeof this === "function" ? this : Observable;

	    if (x == null)
	      throw new TypeError(x + " is not an object");

	    var method = getMethod(x, getSymbol("observable"));

	    if (method) {
	      var observable$0 = method.call(x);

	      if (Object(observable$0) !== observable$0)
	        throw new TypeError(observable$0 + " is not an object");

	      if (observable$0.constructor === C)
	        return observable$0;

	      return new C(function(observer) { return observable$0.subscribe(observer); });
	    }

	    if (hasSymbol("iterator") && (method = getMethod(x, getSymbol("iterator")))) {
	      return new C(function(observer) {
	        for (var __$0 = (method.call(x))[Symbol.iterator](), __$1; __$1 = __$0.next(), !__$1.done;) { var item$0 = __$1.value; 
	          observer.next(item$0);
	          if (observer.closed)
	            return;
	        }

	        observer.complete();
	      });
	    }

	    if (Array.isArray(x)) {
	      return new C(function(observer) {
	        for (var i$0 = 0; i$0 < x.length; ++i$0) {
	          observer.next(x[i$0]);
	          if (observer.closed)
	            return;
	        }

	        observer.complete();
	      });
	    }

	    throw new TypeError(x + " is not observable");
	  },

	  of: function() { for (var items = [], __$0 = 0; __$0 < arguments.length; ++__$0) items.push(arguments[__$0]); 
	    var C = typeof this === "function" ? this : Observable;

	    return new C(function(observer) {
	      for (var i$1 = 0; i$1 < items.length; ++i$1) {
	        observer.next(items[i$1]);
	        if (observer.closed)
	          return;
	      }

	      observer.complete();
	    });
	  },

	});

	Object.defineProperty(Observable, getSymbol("species"), {
	  get: function() { return this },
	  configurable: true,
	});

	Object.defineProperty(Observable, "extensions", {
	  value: {
	    observableSymbol: getSymbol("observable"),
	    setHostReportError: function(fn) { hostReportError = fn; },
	  },
	});

	exports.Observable = Observable;


	}, "*");
	});

	var zenObservable$1 = zenObservable.Observable;

	var Observable = zenObservable$1;

	var __assign = (undefined && undefined.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};

	var __assign$1 = (undefined && undefined.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};

	/**
	 * Deeply clones a value to create a new instance.
	 */

	/**
	 * Performs a deep equality check on two JavaScript values.
	 */

	var visitor = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.visit = visit;
	exports.visitInParallel = visitInParallel;
	exports.visitWithTypeInfo = visitWithTypeInfo;
	exports.getVisitFn = getVisitFn;


	/**
	 * A visitor is comprised of visit functions, which are called on each node
	 * during the visitor's traversal.
	 */


	/**
	 * A visitor is provided to visit, it contains the collection of
	 * relevant functions to be called during the visitor's traversal.
	 */
	/**
	 * Copyright (c) 2015-present, Facebook, Inc.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 *  strict
	 */

	var QueryDocumentKeys = exports.QueryDocumentKeys = {
	  Name: [],

	  Document: ['definitions'],
	  OperationDefinition: ['name', 'variableDefinitions', 'directives', 'selectionSet'],
	  VariableDefinition: ['variable', 'type', 'defaultValue'],
	  Variable: ['name'],
	  SelectionSet: ['selections'],
	  Field: ['alias', 'name', 'arguments', 'directives', 'selectionSet'],
	  Argument: ['name', 'value'],

	  FragmentSpread: ['name', 'directives'],
	  InlineFragment: ['typeCondition', 'directives', 'selectionSet'],
	  FragmentDefinition: ['name',
	  // Note: fragment variable definitions are experimental and may be changed
	  // or removed in the future.
	  'variableDefinitions', 'typeCondition', 'directives', 'selectionSet'],

	  IntValue: [],
	  FloatValue: [],
	  StringValue: [],
	  BooleanValue: [],
	  NullValue: [],
	  EnumValue: [],
	  ListValue: ['values'],
	  ObjectValue: ['fields'],
	  ObjectField: ['name', 'value'],

	  Directive: ['name', 'arguments'],

	  NamedType: ['name'],
	  ListType: ['type'],
	  NonNullType: ['type'],

	  SchemaDefinition: ['directives', 'operationTypes'],
	  OperationTypeDefinition: ['type'],

	  ScalarTypeDefinition: ['description', 'name', 'directives'],
	  ObjectTypeDefinition: ['description', 'name', 'interfaces', 'directives', 'fields'],
	  FieldDefinition: ['description', 'name', 'arguments', 'type', 'directives'],
	  InputValueDefinition: ['description', 'name', 'type', 'defaultValue', 'directives'],
	  InterfaceTypeDefinition: ['description', 'name', 'directives', 'fields'],
	  UnionTypeDefinition: ['description', 'name', 'directives', 'types'],
	  EnumTypeDefinition: ['description', 'name', 'directives', 'values'],
	  EnumValueDefinition: ['description', 'name', 'directives'],
	  InputObjectTypeDefinition: ['description', 'name', 'directives', 'fields'],

	  ScalarTypeExtension: ['name', 'directives'],
	  ObjectTypeExtension: ['name', 'interfaces', 'directives', 'fields'],
	  InterfaceTypeExtension: ['name', 'directives', 'fields'],
	  UnionTypeExtension: ['name', 'directives', 'types'],
	  EnumTypeExtension: ['name', 'directives', 'values'],
	  InputObjectTypeExtension: ['name', 'directives', 'fields'],

	  DirectiveDefinition: ['description', 'name', 'arguments', 'locations']
	};

	/**
	 * A KeyMap describes each the traversable properties of each kind of node.
	 */
	var BREAK = exports.BREAK = {};

	/**
	 * visit() will walk through an AST using a depth first traversal, calling
	 * the visitor's enter function at each node in the traversal, and calling the
	 * leave function after visiting that node and all of its child nodes.
	 *
	 * By returning different values from the enter and leave functions, the
	 * behavior of the visitor can be altered, including skipping over a sub-tree of
	 * the AST (by returning false), editing the AST by returning a value or null
	 * to remove the value, or to stop the whole traversal by returning BREAK.
	 *
	 * When using visit() to edit an AST, the original AST will not be modified, and
	 * a new version of the AST with the changes applied will be returned from the
	 * visit function.
	 *
	 *     const editedAST = visit(ast, {
	 *       enter(node, key, parent, path, ancestors) {
	 *         // @return
	 *         //   undefined: no action
	 *         //   false: skip visiting this node
	 *         //   visitor.BREAK: stop visiting altogether
	 *         //   null: delete this node
	 *         //   any value: replace this node with the returned value
	 *       },
	 *       leave(node, key, parent, path, ancestors) {
	 *         // @return
	 *         //   undefined: no action
	 *         //   false: no action
	 *         //   visitor.BREAK: stop visiting altogether
	 *         //   null: delete this node
	 *         //   any value: replace this node with the returned value
	 *       }
	 *     });
	 *
	 * Alternatively to providing enter() and leave() functions, a visitor can
	 * instead provide functions named the same as the kinds of AST nodes, or
	 * enter/leave visitors at a named key, leading to four permutations of
	 * visitor API:
	 *
	 * 1) Named visitors triggered when entering a node a specific kind.
	 *
	 *     visit(ast, {
	 *       Kind(node) {
	 *         // enter the "Kind" node
	 *       }
	 *     })
	 *
	 * 2) Named visitors that trigger upon entering and leaving a node of
	 *    a specific kind.
	 *
	 *     visit(ast, {
	 *       Kind: {
	 *         enter(node) {
	 *           // enter the "Kind" node
	 *         }
	 *         leave(node) {
	 *           // leave the "Kind" node
	 *         }
	 *       }
	 *     })
	 *
	 * 3) Generic visitors that trigger upon entering and leaving any node.
	 *
	 *     visit(ast, {
	 *       enter(node) {
	 *         // enter any node
	 *       },
	 *       leave(node) {
	 *         // leave any node
	 *       }
	 *     })
	 *
	 * 4) Parallel visitors for entering and leaving nodes of a specific kind.
	 *
	 *     visit(ast, {
	 *       enter: {
	 *         Kind(node) {
	 *           // enter the "Kind" node
	 *         }
	 *       },
	 *       leave: {
	 *         Kind(node) {
	 *           // leave the "Kind" node
	 *         }
	 *       }
	 *     })
	 */
	function visit(root, visitor) {
	  var visitorKeys = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : QueryDocumentKeys;

	  /* eslint-disable no-undef-init */
	  var stack = undefined;
	  var inArray = Array.isArray(root);
	  var keys = [root];
	  var index = -1;
	  var edits = [];
	  var node = undefined;
	  var key = undefined;
	  var parent = undefined;
	  var path = [];
	  var ancestors = [];
	  var newRoot = root;
	  /* eslint-enable no-undef-init */

	  do {
	    index++;
	    var isLeaving = index === keys.length;
	    var isEdited = isLeaving && edits.length !== 0;
	    if (isLeaving) {
	      key = ancestors.length === 0 ? undefined : path[path.length - 1];
	      node = parent;
	      parent = ancestors.pop();
	      if (isEdited) {
	        if (inArray) {
	          node = node.slice();
	        } else {
	          var clone = {};
	          for (var k in node) {
	            if (node.hasOwnProperty(k)) {
	              clone[k] = node[k];
	            }
	          }
	          node = clone;
	        }
	        var editOffset = 0;
	        for (var ii = 0; ii < edits.length; ii++) {
	          var editKey = edits[ii][0];
	          var editValue = edits[ii][1];
	          if (inArray) {
	            editKey -= editOffset;
	          }
	          if (inArray && editValue === null) {
	            node.splice(editKey, 1);
	            editOffset++;
	          } else {
	            node[editKey] = editValue;
	          }
	        }
	      }
	      index = stack.index;
	      keys = stack.keys;
	      edits = stack.edits;
	      inArray = stack.inArray;
	      stack = stack.prev;
	    } else {
	      key = parent ? inArray ? index : keys[index] : undefined;
	      node = parent ? parent[key] : newRoot;
	      if (node === null || node === undefined) {
	        continue;
	      }
	      if (parent) {
	        path.push(key);
	      }
	    }

	    var result = void 0;
	    if (!Array.isArray(node)) {
	      if (!isNode(node)) {
	        throw new Error('Invalid AST Node: ' + JSON.stringify(node));
	      }
	      var visitFn = getVisitFn(visitor, node.kind, isLeaving);
	      if (visitFn) {
	        result = visitFn.call(visitor, node, key, parent, path, ancestors);

	        if (result === BREAK) {
	          break;
	        }

	        if (result === false) {
	          if (!isLeaving) {
	            path.pop();
	            continue;
	          }
	        } else if (result !== undefined) {
	          edits.push([key, result]);
	          if (!isLeaving) {
	            if (isNode(result)) {
	              node = result;
	            } else {
	              path.pop();
	              continue;
	            }
	          }
	        }
	      }
	    }

	    if (result === undefined && isEdited) {
	      edits.push([key, node]);
	    }

	    if (isLeaving) {
	      path.pop();
	    } else {
	      stack = { inArray: inArray, index: index, keys: keys, edits: edits, prev: stack };
	      inArray = Array.isArray(node);
	      keys = inArray ? node : visitorKeys[node.kind] || [];
	      index = -1;
	      edits = [];
	      if (parent) {
	        ancestors.push(parent);
	      }
	      parent = node;
	    }
	  } while (stack !== undefined);

	  if (edits.length !== 0) {
	    newRoot = edits[edits.length - 1][1];
	  }

	  return newRoot;
	}

	function isNode(maybeNode) {
	  return Boolean(maybeNode && typeof maybeNode.kind === 'string');
	}

	/**
	 * Creates a new visitor instance which delegates to many visitors to run in
	 * parallel. Each visitor will be visited for each node before moving on.
	 *
	 * If a prior visitor edits a node, no following visitors will see that node.
	 */
	function visitInParallel(visitors) {
	  var skipping = new Array(visitors.length);

	  return {
	    enter: function enter(node) {
	      for (var i = 0; i < visitors.length; i++) {
	        if (!skipping[i]) {
	          var fn = getVisitFn(visitors[i], node.kind, /* isLeaving */false);
	          if (fn) {
	            var result = fn.apply(visitors[i], arguments);
	            if (result === false) {
	              skipping[i] = node;
	            } else if (result === BREAK) {
	              skipping[i] = BREAK;
	            } else if (result !== undefined) {
	              return result;
	            }
	          }
	        }
	      }
	    },
	    leave: function leave(node) {
	      for (var i = 0; i < visitors.length; i++) {
	        if (!skipping[i]) {
	          var fn = getVisitFn(visitors[i], node.kind, /* isLeaving */true);
	          if (fn) {
	            var result = fn.apply(visitors[i], arguments);
	            if (result === BREAK) {
	              skipping[i] = BREAK;
	            } else if (result !== undefined && result !== false) {
	              return result;
	            }
	          }
	        } else if (skipping[i] === node) {
	          skipping[i] = null;
	        }
	      }
	    }
	  };
	}

	/**
	 * Creates a new visitor instance which maintains a provided TypeInfo instance
	 * along with visiting visitor.
	 */
	function visitWithTypeInfo(typeInfo, visitor) {
	  return {
	    enter: function enter(node) {
	      typeInfo.enter(node);
	      var fn = getVisitFn(visitor, node.kind, /* isLeaving */false);
	      if (fn) {
	        var result = fn.apply(visitor, arguments);
	        if (result !== undefined) {
	          typeInfo.leave(node);
	          if (isNode(result)) {
	            typeInfo.enter(result);
	          }
	        }
	        return result;
	      }
	    },
	    leave: function leave(node) {
	      var fn = getVisitFn(visitor, node.kind, /* isLeaving */true);
	      var result = void 0;
	      if (fn) {
	        result = fn.apply(visitor, arguments);
	      }
	      typeInfo.leave(node);
	      return result;
	    }
	  };
	}

	/**
	 * Given a visitor instance, if it is leaving or not, and a node kind, return
	 * the function the visitor runtime should call.
	 */
	function getVisitFn(visitor, kind, isLeaving) {
	  var kindVisitor = visitor[kind];
	  if (kindVisitor) {
	    if (!isLeaving && typeof kindVisitor === 'function') {
	      // { Kind() {} }
	      return kindVisitor;
	    }
	    var kindSpecificVisitor = isLeaving ? kindVisitor.leave : kindVisitor.enter;
	    if (typeof kindSpecificVisitor === 'function') {
	      // { Kind: { enter() {}, leave() {} } }
	      return kindSpecificVisitor;
	    }
	  } else {
	    var specificVisitor = isLeaving ? visitor.leave : visitor.enter;
	    if (specificVisitor) {
	      if (typeof specificVisitor === 'function') {
	        // { enter() {}, leave() {} }
	        return specificVisitor;
	      }
	      var specificKindVisitor = specificVisitor[kind];
	      if (typeof specificKindVisitor === 'function') {
	        // { enter: { Kind() {} }, leave: { Kind() {} } }
	        return specificKindVisitor;
	      }
	    }
	  }
	}
	});

	unwrapExports(visitor);
	var visitor_1 = visitor.visit;
	var visitor_2 = visitor.visitInParallel;
	var visitor_3 = visitor.visitWithTypeInfo;
	var visitor_4 = visitor.getVisitFn;
	var visitor_5 = visitor.QueryDocumentKeys;
	var visitor_6 = visitor.BREAK;

	var printer = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.print = print;



	/**
	 * Converts an AST into a string, using one set of reasonable
	 * formatting rules.
	 */
	function print(ast) {
	  return (0, visitor.visit)(ast, { leave: printDocASTReducer });
	} /**
	   * Copyright (c) 2015-present, Facebook, Inc.
	   *
	   * This source code is licensed under the MIT license found in the
	   * LICENSE file in the root directory of this source tree.
	   */

	var printDocASTReducer = {
	  Name: function Name(node) {
	    return node.value;
	  },
	  Variable: function Variable(node) {
	    return '$' + node.name;
	  },

	  // Document

	  Document: function Document(node) {
	    return join(node.definitions, '\n\n') + '\n';
	  },

	  OperationDefinition: function OperationDefinition(node) {
	    var op = node.operation;
	    var name = node.name;
	    var varDefs = wrap('(', join(node.variableDefinitions, ', '), ')');
	    var directives = join(node.directives, ' ');
	    var selectionSet = node.selectionSet;
	    // Anonymous queries with no directives or variable definitions can use
	    // the query short form.
	    return !name && !directives && !varDefs && op === 'query' ? selectionSet : join([op, join([name, varDefs]), directives, selectionSet], ' ');
	  },


	  VariableDefinition: function VariableDefinition(_ref) {
	    var variable = _ref.variable,
	        type = _ref.type,
	        defaultValue = _ref.defaultValue;
	    return variable + ': ' + type + wrap(' = ', defaultValue);
	  },

	  SelectionSet: function SelectionSet(_ref2) {
	    var selections = _ref2.selections;
	    return block(selections);
	  },

	  Field: function Field(_ref3) {
	    var alias = _ref3.alias,
	        name = _ref3.name,
	        args = _ref3.arguments,
	        directives = _ref3.directives,
	        selectionSet = _ref3.selectionSet;
	    return join([wrap('', alias, ': ') + name + wrap('(', join(args, ', '), ')'), join(directives, ' '), selectionSet], ' ');
	  },

	  Argument: function Argument(_ref4) {
	    var name = _ref4.name,
	        value = _ref4.value;
	    return name + ': ' + value;
	  },

	  // Fragments

	  FragmentSpread: function FragmentSpread(_ref5) {
	    var name = _ref5.name,
	        directives = _ref5.directives;
	    return '...' + name + wrap(' ', join(directives, ' '));
	  },

	  InlineFragment: function InlineFragment(_ref6) {
	    var typeCondition = _ref6.typeCondition,
	        directives = _ref6.directives,
	        selectionSet = _ref6.selectionSet;
	    return join(['...', wrap('on ', typeCondition), join(directives, ' '), selectionSet], ' ');
	  },

	  FragmentDefinition: function FragmentDefinition(_ref7) {
	    var name = _ref7.name,
	        typeCondition = _ref7.typeCondition,
	        variableDefinitions = _ref7.variableDefinitions,
	        directives = _ref7.directives,
	        selectionSet = _ref7.selectionSet;
	    return (
	      // Note: fragment variable definitions are experimental and may be changed
	      // or removed in the future.
	      'fragment ' + name + wrap('(', join(variableDefinitions, ', '), ')') + ' ' + ('on ' + typeCondition + ' ' + wrap('', join(directives, ' '), ' ')) + selectionSet
	    );
	  },

	  // Value

	  IntValue: function IntValue(_ref8) {
	    var value = _ref8.value;
	    return value;
	  },
	  FloatValue: function FloatValue(_ref9) {
	    var value = _ref9.value;
	    return value;
	  },
	  StringValue: function StringValue(_ref10, key) {
	    var value = _ref10.value,
	        isBlockString = _ref10.block;
	    return isBlockString ? printBlockString(value, key === 'description') : JSON.stringify(value);
	  },
	  BooleanValue: function BooleanValue(_ref11) {
	    var value = _ref11.value;
	    return value ? 'true' : 'false';
	  },
	  NullValue: function NullValue() {
	    return 'null';
	  },
	  EnumValue: function EnumValue(_ref12) {
	    var value = _ref12.value;
	    return value;
	  },
	  ListValue: function ListValue(_ref13) {
	    var values = _ref13.values;
	    return '[' + join(values, ', ') + ']';
	  },
	  ObjectValue: function ObjectValue(_ref14) {
	    var fields = _ref14.fields;
	    return '{' + join(fields, ', ') + '}';
	  },
	  ObjectField: function ObjectField(_ref15) {
	    var name = _ref15.name,
	        value = _ref15.value;
	    return name + ': ' + value;
	  },

	  // Directive

	  Directive: function Directive(_ref16) {
	    var name = _ref16.name,
	        args = _ref16.arguments;
	    return '@' + name + wrap('(', join(args, ', '), ')');
	  },

	  // Type

	  NamedType: function NamedType(_ref17) {
	    var name = _ref17.name;
	    return name;
	  },
	  ListType: function ListType(_ref18) {
	    var type = _ref18.type;
	    return '[' + type + ']';
	  },
	  NonNullType: function NonNullType(_ref19) {
	    var type = _ref19.type;
	    return type + '!';
	  },

	  // Type System Definitions

	  SchemaDefinition: function SchemaDefinition(_ref20) {
	    var directives = _ref20.directives,
	        operationTypes = _ref20.operationTypes;
	    return join(['schema', join(directives, ' '), block(operationTypes)], ' ');
	  },

	  OperationTypeDefinition: function OperationTypeDefinition(_ref21) {
	    var operation = _ref21.operation,
	        type = _ref21.type;
	    return operation + ': ' + type;
	  },

	  ScalarTypeDefinition: addDescription(function (_ref22) {
	    var name = _ref22.name,
	        directives = _ref22.directives;
	    return join(['scalar', name, join(directives, ' ')], ' ');
	  }),

	  ObjectTypeDefinition: addDescription(function (_ref23) {
	    var name = _ref23.name,
	        interfaces = _ref23.interfaces,
	        directives = _ref23.directives,
	        fields = _ref23.fields;
	    return join(['type', name, wrap('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
	  }),

	  FieldDefinition: addDescription(function (_ref24) {
	    var name = _ref24.name,
	        args = _ref24.arguments,
	        type = _ref24.type,
	        directives = _ref24.directives;
	    return name + wrap('(', join(args, ', '), ')') + ': ' + type + wrap(' ', join(directives, ' '));
	  }),

	  InputValueDefinition: addDescription(function (_ref25) {
	    var name = _ref25.name,
	        type = _ref25.type,
	        defaultValue = _ref25.defaultValue,
	        directives = _ref25.directives;
	    return join([name + ': ' + type, wrap('= ', defaultValue), join(directives, ' ')], ' ');
	  }),

	  InterfaceTypeDefinition: addDescription(function (_ref26) {
	    var name = _ref26.name,
	        directives = _ref26.directives,
	        fields = _ref26.fields;
	    return join(['interface', name, join(directives, ' '), block(fields)], ' ');
	  }),

	  UnionTypeDefinition: addDescription(function (_ref27) {
	    var name = _ref27.name,
	        directives = _ref27.directives,
	        types = _ref27.types;
	    return join(['union', name, join(directives, ' '), types && types.length !== 0 ? '= ' + join(types, ' | ') : ''], ' ');
	  }),

	  EnumTypeDefinition: addDescription(function (_ref28) {
	    var name = _ref28.name,
	        directives = _ref28.directives,
	        values = _ref28.values;
	    return join(['enum', name, join(directives, ' '), block(values)], ' ');
	  }),

	  EnumValueDefinition: addDescription(function (_ref29) {
	    var name = _ref29.name,
	        directives = _ref29.directives;
	    return join([name, join(directives, ' ')], ' ');
	  }),

	  InputObjectTypeDefinition: addDescription(function (_ref30) {
	    var name = _ref30.name,
	        directives = _ref30.directives,
	        fields = _ref30.fields;
	    return join(['input', name, join(directives, ' '), block(fields)], ' ');
	  }),

	  ScalarTypeExtension: function ScalarTypeExtension(_ref31) {
	    var name = _ref31.name,
	        directives = _ref31.directives;
	    return join(['extend scalar', name, join(directives, ' ')], ' ');
	  },

	  ObjectTypeExtension: function ObjectTypeExtension(_ref32) {
	    var name = _ref32.name,
	        interfaces = _ref32.interfaces,
	        directives = _ref32.directives,
	        fields = _ref32.fields;
	    return join(['extend type', name, wrap('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
	  },

	  InterfaceTypeExtension: function InterfaceTypeExtension(_ref33) {
	    var name = _ref33.name,
	        directives = _ref33.directives,
	        fields = _ref33.fields;
	    return join(['extend interface', name, join(directives, ' '), block(fields)], ' ');
	  },

	  UnionTypeExtension: function UnionTypeExtension(_ref34) {
	    var name = _ref34.name,
	        directives = _ref34.directives,
	        types = _ref34.types;
	    return join(['extend union', name, join(directives, ' '), types && types.length !== 0 ? '= ' + join(types, ' | ') : ''], ' ');
	  },

	  EnumTypeExtension: function EnumTypeExtension(_ref35) {
	    var name = _ref35.name,
	        directives = _ref35.directives,
	        values = _ref35.values;
	    return join(['extend enum', name, join(directives, ' '), block(values)], ' ');
	  },

	  InputObjectTypeExtension: function InputObjectTypeExtension(_ref36) {
	    var name = _ref36.name,
	        directives = _ref36.directives,
	        fields = _ref36.fields;
	    return join(['extend input', name, join(directives, ' '), block(fields)], ' ');
	  },

	  DirectiveDefinition: addDescription(function (_ref37) {
	    var name = _ref37.name,
	        args = _ref37.arguments,
	        locations = _ref37.locations;
	    return 'directive @' + name + wrap('(', join(args, ', '), ')') + ' on ' + join(locations, ' | ');
	  })
	};

	function addDescription(cb) {
	  return function (node) {
	    return join([node.description, cb(node)], '\n');
	  };
	}

	/**
	 * Given maybeArray, print an empty string if it is null or empty, otherwise
	 * print all items together separated by separator if provided
	 */
	function join(maybeArray, separator) {
	  return maybeArray ? maybeArray.filter(function (x) {
	    return x;
	  }).join(separator || '') : '';
	}

	/**
	 * Given array, print each item on its own line, wrapped in an
	 * indented "{ }" block.
	 */
	function block(array) {
	  return array && array.length !== 0 ? '{\n' + indent(join(array, '\n')) + '\n}' : '';
	}

	/**
	 * If maybeString is not null or empty, then wrap with start and end, otherwise
	 * print an empty string.
	 */
	function wrap(start, maybeString, end) {
	  return maybeString ? start + maybeString + (end || '') : '';
	}

	function indent(maybeString) {
	  return maybeString && '  ' + maybeString.replace(/\n/g, '\n  ');
	}

	/**
	 * Print a block string in the indented block form by adding a leading and
	 * trailing blank line. However, if a block string starts with whitespace and is
	 * a single-line, adding a leading blank line would strip that whitespace.
	 */
	function printBlockString(value, isDescription) {
	  var escaped = value.replace(/"""/g, '\\"""');
	  return (value[0] === ' ' || value[0] === '\t') && value.indexOf('\n') === -1 ? '"""' + escaped.replace(/"$/, '"\n') + '"""' : '"""\n' + (isDescription ? escaped : indent(escaped)) + '\n"""';
	}
	});

	unwrapExports(printer);
	var printer_1 = printer.print;

	var __extends = (undefined && undefined.__extends) || (function () {
	    var extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	    return function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	var __assign$2 = (undefined && undefined.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};
	var LinkError = (function (_super) {
	    __extends(LinkError, _super);
	    function LinkError(message, link) {
	        var _this = _super.call(this, message) || this;
	        _this.link = link;
	        return _this;
	    }
	    return LinkError;
	}(Error));

	console.info(Observable);

})));
