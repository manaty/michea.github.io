/*
 * Vanilla-DataTables
 * Copyright (c) 2015-2017 Karl Saunders (http://mobius.ovh)
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 *
 * Version: 2.0.0-beta.1
 */
(function(root, factory) {
    var plugin = "DataTable";

    if (typeof exports === "object") {
        module.exports = factory(plugin);
    } else if (typeof define === "function" && define.amd) {
        define([], factory(plugin));
    } else {
        root[plugin] = factory(plugin);
    }
})(typeof global !== 'undefined' ? global : this.window || this.global, function(plugin) {
	"use strict";
	var win = window,
		doc = document,
		body = doc.body,
		supports = true,//"classList" in body,
		IE = !!/(msie|trident)/i.test(navigator.userAgent);

	/**
	 * Default configuration
	 * @type {Object}
	 */
	var defaultConfig = {
		perPage: 10,
		perPageSelect: [5, 10, 15, 20, 25],

		sortable: true,
		searchable: true,

		// Pagination
		nextPrev: true,
		firstLast: false,
		prevText: "&lsaquo;",
		nextText: "&rsaquo;",
		firstText: "&laquo;",
		lastText: "&raquo;",
		ellipsisText: "&hellip;",
		truncatePager: true,
		pagerDelta: 2,

		fixedColumns: true,
		fixedHeight: false,

		header: true,
		footer: false,

		search: {
			includeHiddenColumns: false
		},

		classes: {
			top: "dt-top",
			info: "dt-info",
			input: "dt-input",
			table: "dt-table",
			bottom: "dt-bottom",
			search: "dt-search",
			sorter: "dt-sorter",
			wrapper: "dt-wrapper",
			dropdown: "dt-dropdown",
			ellipsis: "dt-ellipsis",
			selector: "dt-selector",
			container: "dt-container",
			pagination: "dt-pagination"
		},

		// Customise the display text
		labels: {
			placeholder: "Search...", // The search input placeholder
			perPage: "{select} entries per page", // per-page dropdown label
			noRows: "No entries found", // Message shown when there are no search results
			info: "Showing {start} to {end} of {rows} entries" //
		},

		// Customise the layout
		layout: {
			top: "{select}{search}",
			bottom: "{info}{pager}"
		}
	};
	
	/**
	 * Default extensions
	 * @type {Array}
	 */	
	var extensions = [
		"editable",
		"exportable",
		"filterable"
	];

	/**
	 * Check is item is object
	 * @return {Boolean}
	 */
	var isObject = function(val) {
		return Object.prototype.toString.call(val) === "[object Object]";
	};

	/**
	 * Check is item is array
	 * @return {Boolean}
	 */
	var isArray = function(val) {
		return Array.isArray(val);
	};

	/**
	 * Check for valid JSON string
	 * @param  {String}   str
	 * @return {Boolean|Array|Object}
	 */
	var isJson = function(str) {
		var t = !1;
		try {
			t = JSON.parse(str);
		} catch (e) {
			return !1;
		}
		return !(null === t || (!isArray(t) && !isObject(t))) && t;
	};

	var isset = function(obj, prop) {
		return obj.hasOwnProperty(prop);
	};

	/**
	 * Merge objects (reccursive)
	 * @param  {Object} r
	 * @param  {Object} t
	 * @return {Object}
	 */
	var extend = function(src, props) {
		for (var prop in props) {
			if (props.hasOwnProperty(prop)) {
				var val = props[prop];
				if (val && isObject(val)) {
					src[prop] = src[prop] || {};
					extend(src[prop], val);
				} else {
					src[prop] = val;
				}
			}
		}
		return src;
	};

	/**
	 * Iterator helper
	 * @param  {(Array|Object|Number)}   arr     Any number, object, array or array-like collection.
	 * @param  {Function}         fn             Callback
	 * @param  {Object}           scope          Change the value of this
	 * @return {Void}
	 */
	var each = function(arr, fn, scope) {
		var n;
		if (isObject(arr)) {
			for (n in arr) {
				if (Object.prototype.hasOwnProperty.call(arr, n)) {
					fn.call(scope, arr[n], n);
				}
			}
		} else if (isArray(arr)) {
			for (n = 0; n < arr.length; n++) {
				fn.call(scope, arr[n], n);
			}
		} else {
			for (n = 0; n < arr; n++) {
				fn.call(scope, n + 1, n);
			}
		}
	};

	/**
	 * Create DOM element node
	 * @param  {String}   a nodeName
	 * @param  {Object}   b properties and attributes
	 * @return {Object}
	 */
	var createElement = function(type, options) {
		var node = doc.createElement(type);
		if (options && "object" == typeof options) {
			var prop;
			for (prop in options) {
				if ("html" === prop) {
					node.innerHTML = options[prop];
				} else {
					if (prop in node) {
						node[prop] = options[prop];
					} else {
						node.setAttribute(prop, options[prop]);
					}
				}
			}
		}
		return node;
	};

	/**
	 * Get the closest matching ancestor
	 * @param  {Object}   el         The starting node.
	 * @param  {Function} fn         Callback to find matching ancestor.
	 * @return {Object|Boolean}      Returns the matching ancestor or false in not found.
	 */
	var closest = function(el, fn) {
		return el && el !== body && (fn(el) ? el : closest(el.parentNode, fn));
	};

	/**
	 * Add event listener to target
	 * @param  {Object} el
	 * @param  {String} e
	 * @param  {Function} fn
	 */
	var on = function(el, e, fn) {
		el.addEventListener(e, fn, false);
	};

	/**
	 * Empty a node
	 * @param  {Object} el HTMLElement
	 */
	var empty = function(el) {
		if (IE) {
			while (el.hasChildNodes()) {
				el.removeChild(el.lastChild);
			}
		} else {
			el.innerHTML = "";
		}
	};

	/**
	 * classList shim
	 * @type {Object}
	 */
	var classList = {
		add: function(s, a) {
			if (supports) {
				s.classList.add(a);
			} else {
				if (!classList.contains(s, a)) {
					s.className = s.className.trim() + " " + a;
				}
			}
		},
		remove: function(s, a) {
			if (supports) {
				s.classList.remove(a);
			} else {
				if (classList.contains(s, a)) {
					s.className = s.className.replace(new RegExp("(^|\\s)" + a.split(" ").join("|") + "(\\s|$)", "gi"), " ");
				}
			}
		},
		contains: function(s, a) {
			return supports ? s.classList.contains(a) : !!s.className && !!s.className.match(new RegExp("(\\s|^)" + a + "(\\s|$)"));
		},
		toggle: function(t, n, force) {
			n += "";
			var i = this.contains(t, n),
				o = i ? true !== force && "remove" : false !== force && "add";
			return o && this[o](t, n), true === force || false === force ? force : !i;
		}
	};
	
	/**
	 * Utils
	 * @type {Object}
	 */		
	var utils = {
		each: each,
		extend: extend,
		isObject: isObject,
		classList: classList,
		createElement: createElement
	};

	/**
	 * Parse cell contents for sorting
	 * @param  {String} content     The datetime string to parse
	 * @param  {String} format      The format for moment to use
	 * @return {String|Boolean}     Datatime string or false
	 */
	var parseDate = function(content, format, cell, row) {
		var date = false;

		if (format && win.moment) {

			// moment() throws a fit if the string isn't a valid datetime string
			// so we need to supply the format to the constructor (https://momentjs.com/docs/#/parsing/string-format/)

			// Converting to YYYYMMDD ensures we can accurately sort the column numerically                 

			switch (format) {
				case "ISO_8601":
					date = moment(content, moment.ISO_8601).format("YYYYMMDD");
					break;
				case "RFC_2822":
					date = moment(content, "ddd, DD MMM YYYY HH:mm:ss ZZ").format("YYYYMMDD");
					break;
				case "MYSQL":
					date = moment(content, "YYYY-MM-DD hh:mm:ss").format("YYYYMMDD");
					break;
				case "UNIX":
					date = moment(parseInt(content, 10)).unix();
					break;
					// User defined format using the data-format attribute or columns[n].format option
				default:
					date = moment(content, format).format("YYYYMMDD");
					break;
			}
		} else {
			date = new Date(content).getTime();
		}

		return date;
	};

	var Cell = function(cell, index) {
		this.node = cell;
		this.content = this.originalContent = cell.innerHTML;
		this.hidden = false;
		this.index = this.node.dataIndex = index;
		this.originalContent = this.content;
	};

	Cell.prototype.setContent = function(content) {
		this.content = this.node.innerHTML = content;
	};

	var Row = function(row, index) {

		if (isArray(row)) {
			this.node = createElement("tr");

			each(row, function(val, i) {
				this.node.appendChild(createElement("td", {
					html: val
				}));
			}, this);
		} else {
			this.node = row;
			if (index !== undefined) {
				this.isHeader = row.parentNode.nodeName === "THEAD";
			}
		}

		if (!this.isHeader && index !== undefined) {
			this.index = this.node.dataIndex = index - 1;
		}

		this.cells = [].slice.call(this.node.cells).map(function(cell, i) {
			return new Cell(cell, i, this);
		}, this);
	};

	var Table = function(table, data, dt) {
		this.node = table;

		if (typeof table === "string") {
			this.node = doc.querySelector(table);
		}

		if (data) {
			this.build(data);
		}

		this.rows = [].slice.call(this.node.rows).map(function(row, i) {
			return new Row(row, i, this);
		}, this);

		this.body = this.node.tBodies[0];

		if (!this.body) {
			this.body = createElement("tbody");
			this.node.appendChild(this.body);
		}

		if (this.rows.length) {
			if (this.rows[0].isHeader) {
				this.hasHeader = true;

				this.header = this.rows[0];

				this.head = this.header.node.parentNode;

				this.rows.shift();

				if (dt.config.sortable) {
					each(this.header.cells, function(cell) {
						classList.add(cell.node, dt.config.classes.sorter);
					});
				}
			} else {
				this.addHeader();
			}
		}

		if (!dt.config.header) {
			this.head.removeChild(this.header.node);
		}

		if (dt.config.footer) {
			this.hasFooter = true;
			this.footer = new Row(this.header.node.cloneNode(true));

			var foot = createElement("tfoot");
			foot.appendChild(this.footer.node);

			each(this.footer.cells, function(cell) {
				classList.remove(cell.node, dt.config.classes.sorter);
			});

			this.node.insertBefore(foot, this.body);
		}
	};

	Table.prototype = {

		build: function(data) {
			var thead = false,
				tbody = false;

			if (data.headings) {
				thead = createElement("thead");
				var tr = createElement("tr");
				each(data.headings, function(col) {
					var td = createElement("th", {
						html: col
					});
					tr.appendChild(td);
				});

				thead.appendChild(tr);
			}

			if (data.data && data.data.length) {
				tbody = createElement("tbody");
				each(data.data, function(rows) {
					var tr = createElement("tr");
					each(rows, function(value) {
						var td = createElement("td", {
							html: value
						});
						tr.appendChild(td);
					});
					tbody.appendChild(tr);
				});
			}

			if (thead) {
				if (this.node.tHead !== null) {
					this.node.removeChild(this.node.tHead);
				}
				this.node.appendChild(thead);
			}

			if (tbody) {
				if (this.node.tBodies.length) {
					this.node.removeChild(this.node.tBodies[0]);
				}
				this.node.appendChild(tbody);
			}
		},

		addHeader: function() {
			var th = createElement("thead"),
				tr = createElement("tr");

			each(this.rows[0].cells, function(cell) {
				tr.appendChild(createElement("td"));
			});

			th.appendChild(tr);

			this.head = th;
			this.header = new Row(tr, 1);
			this.hasHeader = true;
		},

		addRow: function(row, at, update) {
			if (row instanceof Row) {
				this.rows.splice(at || 0, 0, row);

				// We may have a table without a header
				if (!this.hasHeader) {
					this.addHeader();
				}

				if (update) {
					this.update();
				}

				return row;
			}
		},

		removeRow: function(row, update) {
			if (row instanceof Row) {
				this.rows.splice(this.rows.indexOf(row), 1);

				if (update) {
					this.update();
				}
			}
		},

		update: function(all) {
			each(this.rows, function(row, i) {
				row.index = row.node.dataIndex = i;
			});
		}
	};

	// PAGER
	var Pager = function(instance, parent) {
		this.instance = instance;
		this.parent = parent;
	};

	Pager.prototype = {
		render: function(pages) {
			var that = this,
				dt = that.instance,
				o = dt.config;

			pages = pages || dt.totalPages;

			empty(that.parent);

			// No need for pager if we only have one page
			if (pages > 1) {
				var c = "pager",
					ul = createElement("ul"),
					prev = dt.onFirstPage ? 1 : dt.currentPage - 1,
					next = dt.onlastPage ? pages : dt.currentPage + 1;

				// first button
				if (o.firstLast) {
					ul.appendChild(that.button(c, 1, o.firstText));
				}

				// prev button
				if (o.nextPrev) {
					ul.appendChild(that.button(c, prev, o.prevText));
				}

				var pager = that.truncate();
				// append the links
				each(pager, function(btn) {
					ul.appendChild(btn);
				});

				// next button
				if (o.nextPrev) {
					ul.appendChild(that.button(c, next, o.nextText));
				}

				// first button
				if (o.firstLast) {
					ul.appendChild(that.button(c, pages, o.lastText));
				}

				that.parent.appendChild(ul);
			}
		},

		truncate: function() {
			var that = this,
				o = that.instance.config,
				delta = o.pagerDelta * 2,
				page = that.instance.currentPage,
				left = page - o.pagerDelta,
				right = page + o.pagerDelta,
				pages = that.instance.totalPages,
				range = [],
				pager = [],
				n;

			// No need to truncate if it's disabled
			if (!o.truncatePager) {
				each(pages, function(index) {
					pager.push(that.button(index == page ? "active" : "", index, index));
				});
			} else {
				if (page < 4 - o.pagerDelta + delta) {
					right = 3 + delta;
				} else if (page > pages - (3 - o.pagerDelta + delta)) {
					left = pages - (2 + delta);
				}

				// Get the links that will be visible
				for (var i = 1; i <= pages; i++) {
					if (i == 1 || i == pages || (i >= left && i <= right)) {
						range.push(i);
					}
				}

				each(range, function(index) {
					if (n) {
						if (index - n == 2) {
							pager.push(that.button("", n + 1, n + 1));
						} else if (index - n != 1) {
							// Create ellipsis node
							pager.push(that.button(o.classes.ellipsis, 0, o.ellipsisText, true));
						}
					}

					pager.push(that.button(index == page ? "active" : "", index, index));
					n = index;
				});
			}

			return pager;
		},

		button: function(className, pageNum, content, ellipsis) {
			return createElement("li", {
				class: className,
				html: !ellipsis ? '<a href="#" data-page="' + pageNum + '">' + content + "</a>" : '<span>' + content + "</span>"
			});
		}
	};

	// ROWS
	var Rows = function(instance, select) {
		this.instance = instance;
		
		if ( select !== undefined ) {
			if ( !isNaN(select) ) {
				this.select = [select];
			} else if ( isArray(select) ) {
				this.select = select;
			}
		} else {
			this.select = instance.table.rows.map(function(row) {
				return row.index;
			});
		}		
	};

	Rows.prototype = {
		init: function() {},

		count: function() {
			return this.instance.table.rows.length;
		},

		render: function(page) {
			var that = this,
				dt = that.instance;
			page = page || dt.currentPage;

			empty(dt.table.body);

			if (page < 1 || page > dt.totalPages) return;

			var head = dt.table.header,
				fragment = doc.createDocumentFragment();

			if (dt.table.hasHeader) {
				empty(head.node);
				each(head.cells, function(cell) {
					if (!cell.hidden) {
						head.node.appendChild(cell.node);
					}
				});
			}

			if (dt.pages.length) {
				each(dt.pages[page - 1], function(row) {
					empty(row.node);

					each(row.cells, function(cell) {
						if (!cell.hidden) {
							row.node.appendChild(cell.node);
						}
					});

					fragment.append(row.node);
				});
			}

			dt.table.body.appendChild(fragment);

			each(dt.pagers, function(pager) {
				pager.render();
			});

			dt.getInfo();
			
			if (dt.currentPage == 1) {
					dt.fixHeight();
			}			

			dt.emit("rows.render");
		},

		paginate: function() {
			var o = this.instance.config,
				rows = this.instance.table.rows,
				dt = this.instance;

			if (dt.searching && dt.searchData) {
				rows = dt.searchData;
			}

			dt.pages = rows
				.map(function(tr, i) {
					return i % o.perPage === 0 ? rows.slice(i, i + o.perPage) : null;
				})
				.filter(function(page) {
					return page;
				});

			dt.totalPages = dt.pages.length;

			// Current page maybe outside the range
			if (dt.currentPage > dt.totalPages) {
				dt.currentPage = dt.totalPages;
			}
		},

		add: function(row, at) {
			if (isArray(row)) {
				at = at || 0;
				if (isArray(row[0])) {
					each(row, function(tr) {
						tr = this.instance.table.addRow(new Row(tr, this.instance.columns().count() + 1), at);
					}, this);
					// only update after adding multiple rows
					// to keep performance hit to a minimum
					this.instance.table.update();
				} else {
					row = this.instance.table.addRow(new Row(row, this.instance.columns().count() + 1), at, true);
				}

				this.instance.update();

				return row;
			}
		},

		remove: function(obj) {
			var row = false,
				dt = this.instance;

			if (isArray(obj)) {
				// reverse order or there'll be shit to pay
				for (var i = obj.length - 1; i >= 0; i--) {
					dt.table.removeRow(this.get(obj[i]));
				}
				dt.table.update();
				dt.update();
			} else {
				row = this.get(obj);
				if (row) {
					dt.table.removeRow(row, true);
					dt.update();

					return row;
				}
			}
		},
		
		cells: function() {
			var that = this, rows = [];
			
			if ( this.select.length == 1 ) {
				this.select = this.select[0];
			}
			
			each(this.instance.table.rows, function(row) {
				if ( (isArray(that.select) && that.select.indexOf(row.index) >= 0) || that.select == row.index ) {
					rows.push(row.cells);
				}
			});
			
			return rows;
		},		

		get: function(row) {
			var rows = this.instance.table.rows;
			if (row instanceof Row || row instanceof Element) {
				for (var n = 0; n < rows.length; n++) {
					if (rows[n].node === row || rows[n] === row) {
						row = rows[n];
						break;
					}
				}
			} else {
				row = rows[row];
			}

			return row;
		}
	};

	// COLUMNS
	var Columns = function(instance, select) {
		this.instance = instance;
		
		if ( select !== undefined ) {
			if ( !isNaN(select) ) {
				this.select = [select];
			} else if ( isArray(select) ) {
				this.select = select;
			}
		} else {
			this.select = instance.table.header.cells.map(function(cell) {
				return cell.index;
			});
		}
	};

	Columns.prototype = {
		init: function() {},

		count: function() {
			return this.instance.table.header.cells.length;
		},

		sort: function(column, direction) {

			var dt = this.instance;

			column = column || 0;
			direction = direction || (dt.lastDirection && "asc" === dt.lastDirection ? direction = "desc" : direction = "asc");

			if (column < 0 || column > dt.table.header.cells.length - 1) {
				return false;
			}

			var node = dt.table.header.cells[column].node,
				rows = dt.table.rows;

			if (dt.searching && dt.searchData) {
				rows = dt.searchData;
			}

			// Remove class from previus column
			if (dt.lastHeading) {
				classList.remove(dt.lastHeading, dt.lastDirection);
			}

			if (dt.lastDirection) {
				classList.remove(node, dt.lastDirection);
			}

			classList.add(node, direction);

			var format, datetime;

			if (node.hasAttribute("data-type")) {
				// Check for date format and moment.js
				if (node.getAttribute("data-type") === "date") {
					format = false;
					datetime = node.hasAttribute("data-format");

					if (datetime) {
						format = node.getAttribute("data-format");
					}
				}
			}

			rows.sort(function(a, b) {
				var ca = a.cells[column].content;
				var cb = b.cells[column].content;

				if (datetime) {
					ca = parseDate(ca, format, a.cells[column], a);
					cb = parseDate(cb, format, b.cells[column], b);
				} else {
					ca = ca.replace(/(\$|\,|\s|%)/g, "");
					cb = cb.replace(/(\$|\,|\s|%)/g, "");
				}

				ca = !isNaN(ca) ? parseInt(ca, 10) : ca;
				cb = !isNaN(cb) ? parseInt(cb, 10) : cb;

				return direction === "asc" ? ca > cb : ca < cb;
			});

			dt.table.update();
			dt.update();

			dt.lastHeading = node;
			dt.lastDirection = direction;

			dt.emit("columns.sort", direction, column, node);

			classList.remove(node, "loading");
		},

		search: function(column, query) {
			this.instance.search(query, column);
		},

		order: function(order) {
			var dt = this.instance;

			if (isArray(order)) {
				// Check for erroneous indexes
				for (var n = 0; n < order.length; n++) {
					if (order[n] >= dt.columns().count()) {
						throw new Error("Column index " + order[n] + " is outside the range of columns.");
					}
				}

				var reorder = function(node) {
					var arr = [];
					each(order, function(column, i) {
						arr[i] = node.cells[column];
						arr[i].index = arr[i].node.dataIndex = i;
						node.node.appendChild(arr[i].node);
					});
					node.cells = arr;
				};

				// Reorder the header
				if (dt.table.hasHeader) {
					reorder(dt.table.header);
				}

				// Reorder the footer
				if (dt.table.hasFooter) {
					reorder(dt.table.footer);
				}

				// Reorder the rows
				each(dt.table.rows, function(row) {
					reorder(row);
				});

				dt.update();

				dt.emit("columns.order", order);
			}
		},

		hide: function() {
			var dt = this.instance,
				head = dt.table.header,
				rows = dt.table.rows;

			each(this.select, function(column) {
				each(head.cells, function(cell) {
					if (column == cell.index) {
						cell.hidden = true;
					}
				});

				each(rows, function(row) {
					each(row.cells, function(cell) {
						if (column == cell.index) {
							cell.hidden = true;
						}
					});
				});
			});

			this.fix(true);
			dt.update();

			dt.emit("columns.hide", this.select);
		},

		show: function() {
			var dt = this.instance,
				head = dt.table.header,
				rows = dt.table.rows;

			each(this.select, function(column) {
				each(head.cells, function(cell) {
					if (column == cell.index) {
						cell.hidden = false;
					}
				});

				each(rows, function(row) {
					each(row.cells, function(cell) {
						if (column == cell.index) {
							cell.hidden = false;
						}
					});
				});
			});

			this.fix(true);
			dt.update();

			dt.emit("columns.show", this.select);
		},

		visible: function() {
			var dt = this.instance,
				head = dt.table.header,
				cols = [];

			each(this.select, function(column) {
				cols.push(!head.cells[column].hidden);
			});
			
			return cols;
		},

		add: function(obj) {
			var dt = this.instance;

			if (isObject(obj)) {
				if (isset(obj, "heading")) {
					var cell = new Cell(createElement("th"), dt.columns().count());
					cell.setContent(obj.heading);

					dt.table.header.node.appendChild(cell.node);
					dt.table.header.cells.push(cell);
				}

				if (isset(obj, "data") && isArray(obj.data)) {
					each(dt.table.rows, function(row, i) {
						var cell = new Cell(createElement("td"), row.cells.length);
						cell.setContent(obj.data[i] || "");

						row.node.appendChild(cell.node);
						row.cells.push(cell);
					});
				}
			}

			this.fix(true);
			dt.update();

			dt.emit("columns.add");
		},

		remove: function(select, hold) {
			var dt = this.instance,
				table = dt.table,
				head = table.header;

			if (isArray(select)) {
				// Remove in reverse otherwise the indexes will be incorrect
				select.sort(function(a, b) {
					return b - a;
				});

				each(select, function(column, i) {
					this.remove(column, i < select.length - 1);
				}, this);

				return;
			} else {
				head.node.removeChild(head.cells[select].node);
				head.cells.splice(select, 1);

				each(table.rows, function(row) {
					row.node.removeChild(row.cells[select].node);
					row.cells.splice(select, 1);
				});
			}

			if (!hold) {
				each(head.cells, function(cell, i) {
					cell.index = cell.node.dataIndex = i;
				});

				each(table.rows, function(row) {
					each(row.cells, function(cell, i) {
						cell.index = cell.node.dataIndex = i;
					});
				});

				this.fix(true);
				dt.update();
			}

			dt.emit("columns.remove", select);
		},

		fix: function(update) {
			var dt = this.instance,
				table = dt.table,
				head = table.header;
			if (update) {
				if (table.hasHeader && dt.config.fixedColumns) {
					dt.columnWidths = head.cells.map(function(cell) {
						return cell.node.offsetWidth;
					});
				}
			}

			each(dt.columnWidths, function(size, cell) {
				head.cells[cell].node.style.width = (size / dt.rect.width * 100) + "%";
			});
		},
		
		cells: function() {
			var that = this, columns = [];
			
			if ( this.select.length == 1 ) {
				this.select = this.select[0];
			}
			
			each(this.instance.table.rows, function(row, i) {
				if ( isArray(that.select) ) {
					columns[i] = [];
				}
				each(row.cells, function(cell) {
					if( isArray(that.select) && that.select.indexOf(cell.index) >= 0 ) {
						columns[i].push(cell);
					} else if (that.select == cell.index) {
						columns.push(cell);
					}
				});
			});
			
			return columns;
		}
	};

	// MAIN LIB
	var DataTable = function(table, config) {
		this.config = extend(defaultConfig, config);

		if (this.config.ajax) {
			var that = this,
				ajax = this.config.ajax;

			this.request = new XMLHttpRequest();

			on(this.request, "load", function(xhr) {
				if (that.request.readyState === 4) {
					if (that.request.status === 200) {
						var obj = {};
						obj.data = ajax.load ? ajax.load.call(that, that.request) : that.request.responseText;

						obj.type = "json";

						if (ajax.content && ajax.content.type) {
							obj.type = ajax.content.type;
							obj = extend(obj, ajax.content);
						}

						that.table = new Table(table, obj.data, that);

						that.init();
					}
				}
			});

			this.request.open("GET", typeof ajax === "string" ? that.config.ajax : that.config.ajax.url);
			this.request.send();
		} else {
			if (this.config.data) {
				this.table = new Table(table, this.config.data, this);
			} else {
				this.table = new Table(table, false, this);
			}

			this.init();
		}
	};

	DataTable.prototype = {
		init: function() {

			if (this.initialised) return;

			var that = this,
				o = that.config;
			
			that.sortable = o.sortable;
			that.searchable = o.searchable;

			that.currentPage = 1;
			that.onFirstPage = true;
			that.onLastPage = false;

			that.rows().paginate();
			that.totalPages = that.pages.length;

			that.render();

			if (o.fixedColumns) {
				that.columns().fix();
			}

			that.extend();

			if (o.plugins) {
				each(o.plugins, function(options, plugin) {
					if (that[plugin] !== undefined && typeof that[plugin] === "function") {
						that[plugin] = that[plugin](that, options, utils);

						// Init plugin
						if (options.enabled && that[plugin].init && typeof that[plugin].init === "function") {
							that[plugin].init();
						}
					}
				});
			}

			// Check for the columns option
			if (o.columns) {
				var selectedColumns = [];
				var columnRenderers = [];

				each(o.columns, function(data) {
					// convert single column selection to array
					if (!isArray(data.select)) {
						data.select = [data.select];
					}

					if (isset(data, "render") && typeof data.render === "function") {
						selectedColumns = selectedColumns.concat(data.select);

						columnRenderers.push({
							columns: data.select,
							renderer: data.render
						});
					}

					// Add the data attributes to the th elements
					if (that.table.hasHeader) {
						each(data.select, function(column) {
							var cell = that.table.header.cells[column];

							if (data.type) {
								cell.node.setAttribute("data-type", data.type);
							}
							if (data.format) {
								cell.node.setAttribute("data-format", data.format);
							}
							if (isset(data, "sortable")) {
								cell.node.setAttribute("data-sortable", data.sortable);

								if (data.sortable === false) {
									classList.remove(cell.node, o.classes.sorter);
								}
							}

							if (isset(data, "hidden")) {
								if (data.hidden !== false) {
									that.columns().hide(column);
								}
							}

							if (isset(data, "sort") && data.select.length === 1) {
								that.columns().sort(data.select[0], data.sort);
							}
						});
					}
				});

				if (selectedColumns.length) {
					each(that.table.rows, function(row) {
						each(row.cells, function(cell) {
							if (selectedColumns.indexOf(cell.index) >= 0) {
								each(columnRenderers, function(obj) {
									if (obj.columns.indexOf(cell.index) >= 0) {
										cell.setContent(obj.renderer.call(that, cell.content, cell, row));
									}
								});
							}
						});
					});
				}
			}

			that.rows().render();

			that.bindEvents();
			
			that.setClasses();

			that.initialised = true;

			setTimeout(function() {
				that.emit("init");
			}, 10);
		},
		
		setClasses: function() {
			classList.toggle(this.wrapper, "dt-sortable", this.sortable);
			classList.toggle(this.wrapper, "dt-searchable", this.searchable);
		},

		extend: function() {
			var that = this;

			each(extensions, function(ext) {
				if (that[ext] !== undefined && typeof that[ext] === "function") {
					that[ext] = that[ext](that, that.config[ext], utils);

					// Init extension
					if (that[ext].init && typeof that[ext].init === "function") {
						that[ext].init();
					}
				}
			});
		},

		bindEvents: function() {
			var that = this,
				o = that.config;

			on(that.wrapper, "mousedown", function(e) {
				if (e.which === 1 && that.sortable && e.target.nodeName === "TH") {
					classList.add(e.target, "loading");
				}
			});

			on(that.wrapper, "click", function(e) {
				var node = e.target;

				if (node.hasAttribute("data-page")) {
					e.preventDefault();
					that.page(parseInt(node.getAttribute("data-page"), 10));
				}

				if (that.sortable && node.nodeName === "TH" && classList.contains(node, o.classes.sorter)) {
					if (node.hasAttribute("data-sortable") && node.getAttribute("data-sortable") === "false") return false;

					e.preventDefault();
					that
						.columns()
						.sort(node.dataIndex, classList.contains(node, "asc") ? "desc" : "asc");
				}
			});

			if (o.perPageSelect) {
				on(that.wrapper, "change", function(e) {
					var node = e.target;
					if (
						node.nodeName === "SELECT" &&
						classList.contains(node, o.classes.selector)
					) {
						e.preventDefault();
						that.setPerPage(node.value);
					}
				});
			}

			if (that.searchable) {
				on(that.wrapper, "keyup", function(e) {
					if (
						e.target.nodeName === "INPUT" &&
						classList.contains(e.target, o.classes.input)
					) {
						e.preventDefault();
						that.search(e.target.value);
					}
				});
			}

			if (that.sortable) {
				on(that.wrapper, "mousedown", function(e) {
					if (e.target.nodeName === "TH") {
						e.preventDefault();
					}
				});
			}
		},

		render: function() {

			if (this.rendered) return;

			var that = this,
				o = that.config;

			if (this.table.hasHeader && o.fixedColumns && o.header) {
				this.columnWidths = this.table.header.cells.map(function(cell) {
					return cell.node.offsetWidth;
				});
			}

			// Build
			that.wrapper = createElement("div", {
				class: o.classes.wrapper
			});

			// Template for custom layouts
			var inner = [
				"<div class='", o.classes.top, "'>", o.layout.top, "</div>",
				"<div class='", o.classes.container, "'></div>",
				"<div class='", o.classes.bottom, "'>", o.layout.bottom, "</div>"
			].join("");

			// Info placement
			inner = inner.replace(
				"{info}",
				"<div class='" + o.classes.info + "'></div>"
			);

			// Per Page Select
			if (o.perPageSelect) {
				var wrap = [
					"<div class='", o.classes.dropdown, "'>",
					"<label>", o.labels.perPage, "</label>",
					"</div>"
				].join("");

				// Create the select
				var select = createElement("select", {
					class: o.classes.selector
				});

				// Create the options
				each(o.perPageSelect, function(val) {
					var selected = val === o.perPage;
					var option = new Option(val, val, selected, selected);
					select.add(option);
				});

				// Custom label
				wrap = wrap.replace("{select}", select.outerHTML);

				// Selector placement
				inner = inner.replace(/\{select\}/g, wrap);
			} else {
				inner = inner.replace(/\{select\}/g, "");
			}

			// Searchable
			if (that.searchable) {
				var form = [
					"<div class='", o.classes.search, "'>",
					"<input class='", o.classes.input, "' placeholder='", o.labels.placeholder, "' type='text'>",
					"</div>"
				].join("");

				// Search input placement
				inner = inner.replace(/\{search\}/g, form);
			} else {
				inner = inner.replace(/\{search\}/g, "");
			}

			// Add table class
			that.table.node.classList.add(o.classes.table);

			// Pagers
			each(inner.match(/\{pager\}/g), function(pager, i) {
				inner = inner.replace(
					"{pager}",
					createElement("div", {
						class: o.classes.pagination
					}).outerHTML
				);
			});

			that.wrapper.innerHTML = inner;

			that.pagers = [].slice.call(
				that.wrapper.querySelectorAll("." + o.classes.pagination)
			);

			each(that.pagers, function(pager, i) {
				that.pagers[i] = new Pager(that, pager);
			});

			that.container = that.wrapper.querySelector("." + o.classes.container);

			that.labels = that.wrapper.querySelectorAll("." + o.classes.info);
			that.inputs = that.wrapper.querySelectorAll("." + o.classes.input);

			that.selectors = that.wrapper.querySelectorAll("." + o.classes.selector);

			// Insert in to DOM tree
			that.table.node.parentNode.replaceChild(that.wrapper, that.table.node);
			that.container.appendChild(that.table.node);

			// Store the table dimensions
			that.rect = that.table.node.getBoundingClientRect();

			that.rendered = true;
		},

		update: function() {
			this.rows().paginate();
			this.rows().render();

			this.emit("update");
		},
		
		fixHeight: function() {
			this.container.style.height = null;
			if (this.config.fixedHeight) {
				this.rect = this.container.getBoundingClientRect();
				this.container.style.height = this.rect.height + "px";
			}			
		},	

		getInfo: function() {
			// Update the info
			var current = 0,
				f = 0,
				t = 0,
				items;

			if (this.totalPages) {
				current = this.currentPage - 1;
				f = current * this.config.perPage;
				t = f + this.pages[current].length;
				f = f + 1;
				items = !!this.searching ? this.searchData.length : this.rows().count();
			}

			if (this.labels.length && this.config.labels.info.length) {
				// CUSTOM LABELS
				var string = this.config.labels.info
					.replace("{start}", f)
					.replace("{end}", t)
					.replace("{page}", this.currentPage)
					.replace("{pages}", this.totalPages)
					.replace("{rows}", items);

				each([].slice.call(this.labels), function(label) {
					label.innerHTML = items ? string : "";
				});
			}
		},

		search: function(query, column) {
			var that = this;

			query = query.toLowerCase();

			that.currentPage = 1;
			that.searching = true;
			that.searchData = [];

			if (!query.length) {
				that.searching = false;
				classList.remove(that.wrapper, "search-results");
				that.update();

				return false;
			}

			each(that.table.rows, function(row) {
				var inArray = that.searchData.indexOf(row) >= 0;

				// Filter column
				if (column !== undefined) {
					each(row.cells, function(cell) {
						if (column !== undefined && cell.index == column && !inArray) {
							if (cell.content.toLowerCase().indexOf(query) >= 0) {
								that.searchData.push(row);
							}
						}
					});
				} else {
					// https://github.com/Mobius1/Vanilla-DataTables/issues/12
					var match = query.split(" ").reduce(function(bool, word) {
						var includes = false;

						for (var x = 0; x < row.cells.length; x++) {
							if (row.cells[x].content.toLowerCase().indexOf(word) >= 0) {
								if (!row.cells[x].hidden ||
									(row.cells[x].hidden && that.config.search.includeHiddenColumns)
								)
									includes = true;
								break;
							}
						}

						return bool && includes;
					}, true);

					if (match && !inArray) {
						that.searchData.push(row);
					}
				}
			});

			classList.add(that.wrapper, "search-results");

			if (!that.searchData.length) {
				classList.remove(that.wrapper, "search-results");

				that.setMessage(that.config.labels.noRows);
			} else {
				that.update();
			}

			this.emit("search", query, this.searchData);
		},

		page: function(page) {
			// We don't want to load the current page again.
			if (page == this.currentPage) {
				return false;
			}

			if (!isNaN(page)) {
				this.currentPage = parseInt(page, 10);
			}

			this.onFirstPage = this.currentPage === 1;
			this.onLastPage = this.currentPage === this.totalPages;

			if (page > this.totalPages || page < 0) {
				return false;
			}

			this.rows().render(parseInt(page, 10));

			this.emit("page", page);
		},
		
		reset: function() {
			var that = this;
			
			if ( this.searching ) {
				this.searching = this.searchData = false;
				classList.remove(this.wrapper, "search-results");
			}
			
			each([].slice.call(this.inputs), function(input) {
				input.value = null;
				input.blur();
			});	
			
			this.update();
			
			this.emit("reset");
		},
		
		set: function(prop, val) {
			if ( this.hasOwnProperty(prop) ) {
				this[prop] = val;
				
				classList.toggle(this.wrapper, "dt-" + prop, this[prop]);
				
				this.update();
			}
		},
		
		setPerPage: function(value) {
			if ( !isNaN(value) ) {
				value = parseInt(value, 10);
				
				this.config.perPage = value;
				
				this.fixHeight();

				if ( this.config.perPageSelect.indexOf(value) >= 0 ) {
					each([].slice.call(this.selectors), function(select) {
						select.value = value;
					});
				}

				this.update();
				
				this.emit("perpage", value);
			}
		},

		import: function(options) {
			var that = this,
				obj = false;
			var defaults = {
				// csv
				lineDelimiter: "\n",
				columnDelimiter: ","
			};

			// Check for the options object
			if (!isObject(options)) {
				return false;
			}

			options = extend(defaults, options);

			if (options.data.length || isObject(options.data)) {
				// Import CSV
				if (options.type === "csv") {
					obj = {
						data: []
					};

					// Split the string into rows
					var rows = options.data.split(options.lineDelimiter);

					if (rows.length) {

						if (options.headings) {
							obj.headings = rows[0].split(options.columnDelimiter);

							rows.shift();
						}

						each(rows, function(row, i) {
							obj.data[i] = [];

							// Split the rows into values
							var values = row.split(options.columnDelimiter);

							if (values.length) {
								each(values, function(value) {
									obj.data[i].push(value);
								});
							}
						});
					}
				} else if (options.type === "json") {
					var json = isJson(options.data);

					// Valid JSON string
					if (json) {
						obj = {
							headings: [],
							data: []
						};

						each(json, function(data, i) {
							obj.data[i] = [];
							each(data, function(value, column) {
								if (obj.headings.indexOf(column) < 0) {
									obj.headings.push(column);
								}

								obj.data[i].push(value);
							});
						});
					} else {
						throw new Error("That's not valid JSON!");
					}
				}

				if (isObject(options.data)) {
					obj = options.data;
				}

				if (obj) {
					each(obj.headings, function(heading, i) {
						that.table.header.cells[i].setContent(heading);
					});

					this.rows().add(obj.data);
				}
			}

			return false;
		},

		setMessage: function(message) {
			var colspan = 1;

			if (this.rows().count()) {
				colspan = this.columns().count();
			}

			var node = createElement("tr", {
				html: '<td class="dataTables-empty" colspan="' +
					colspan +
					'">' +
					message +
					"</td>"
			});

			empty(this.table.body);

			this.table.body.appendChild(node);
		},

		columns: function(select) {
			return new Columns(this, select);
		},

		rows: function(select) {
			return new Rows(this, select);
		},

		on: function(event, callback) {
			this.events = this.events || {};
			this.events[event] = this.events[event] || [];
			this.events[event].push(callback);
		},

		off: function(event, callback) {
			this.events = this.events || {};
			if (event in this.events === false) return;
			this.events[event].splice(this.events[event].indexOf(callback), 1);
		},

		emit: function(event) {
			this.events = this.events || {};
			if (event in this.events === false) return;
			for (var i = 0; i < this.events[event].length; i++) {
				this.events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
			}
		},

		destroy: function() {

			var that = this,
				o = that.config,
				table = that.table;

			classList.remove(table.node, o.classes.table);

			each(table.header.cells, function(cell) {
				cell.node.style.width = "";
				classList.remove(cell.node, o.classes.sorter);
			});

			var frag = doc.createDocumentFragment();
			empty(table.body);

			each(table.rows, function(row) {
				frag.appendChild(row.node);
			});

			table.body.appendChild(frag);

			this.wrapper.parentNode.replaceChild(table.node, this.wrapper);

			this.rendered = false;
			this.initialised = false;
			
			each(extensions, function(ext) {
				if (that[ext] !== undefined && typeof that[ext] === "function") {
					if (that[ext].destroy && typeof that[ext].destroy === "function") {
						that[ext].destroy();
					}
				}
			});			
		}
	};

	DataTable.extend = function(prop, val) {
		if (typeof val === "function") {
			DataTable.prototype[prop] = val;
		} else {
			DataTable[prop] = val;
		}
	};

	return DataTable;
});

// Filterable
if (window.DataTable) {
	DataTable.extend("filterable", function(instance, options, utils) {

		/**
		 * Default config
		 * @type {Object}
		 */
		var defaults = {
			classes: {
				filter: "dt-filter",
				filterable: "dt-filterable",
			}
		};
		
		/**
		 * Get the closest matching ancestor
		 * @param  {Object}   el         The starting node.
		 * @param  {Function} fn         Callback to find matching ancestor.
		 * @return {Object|Boolean}      Returns the matching ancestor or false in not found.
		 */
		var closest = function(el, fn) {
				return el && el !== document.body && (fn(el) ? el : closest(el.parentNode, fn));
		};		

		/**
		 * Main lib
		 * @param {Object} config User config
		 */
		var Filter = function(config) {
			this.config = utils.extend(defaults, config);
		}

		/**
		 * Init instance
		 * @return {Void}
		 */
		Filter.prototype.init = function() {
			
			if ( this.initialised ) return;
			
			var that = this, o = that.config;
			
			that.inputs = [];
			that.row = utils.createElement("tr");
			
			utils.each(instance.table.header.cells, function(cell) {
				that.add({
					index: cell.index
				});
			});
			
			that.row.addEventListener("input", function(e) {
				var input = closest(e.target, function(el) {
					return el.nodeName === "INPUT";
				});
				
				if ( input ) {
					instance.columns().search(input.parentNode.cellIndex, input.value);
				}
			});
			
			instance.table.head.appendChild(that.row);
			
			instance.on("reset", function(columns) {
				utils.each(that.inputs, function(input) {
					input.value = null;
				});
			});			
			
			instance.on("columns.hide", function(columns) {
				utils.each(columns, function(column) {
					that.row.cells[column].style.display = "none";
				});
			});
			
			instance.on("columns.show", function(columns) {
				utils.each(columns, function(column) {
					that.row.cells[column].style.display = "";
				});
			});	
			
			instance.on("columns.order", function(order) {
				var inputs = [], cells = [];
				utils.each(order, function(i) {
					inputs[i] = that.inputs[i];
					cells.push(that.row.cells[i]);
				});
				
				utils.each(cells, function(cell) {
					that.row.appendChild(cell);
				});
				
				that.inputs = inputs;				
			});					
			
			instance.on("columns.add", function() {
				that.add();
			});			
			
			instance.on("columns.remove", function(column) {
				that.row.removeChild(that.row.cells[column]);
				
				that.inputs.splice(column, 1);
			});
			
			this.initialised = true;
		};
		
		Filter.prototype.add = function(config) {
			
			var that = this, o = that.config;
			
			var index = config && config.index !== undefined ? config.index : instance.columns().count() - 1;
			
			var options = utils.extend({
				placeholder: o.placeholders && o.placeholders[index] ? o.placeholders[index] : "Search " + instance.table.header.cells[index].content
			}, config);
			
			
			var td = utils.createElement("td", {
				class: o.classes.filterable
			});
			var input = utils.createElement("input", {
				type: "text",
				class: o.classes.filter,
				placeholder: options.placeholder || ""
			});

			if ( instance.config.fixedColumns ) {
				td.style.width = ((instance.columnWidths[index] / instance.rect.width) * 100) + "%";
			}

			td.appendChild(input)
			that.row.appendChild(td);

			that.inputs.push(input);
		};
		
		Filter.prototype.destroy = function() {
			instance.table.head.removeChild(this.row);
			
			this.initialised = false;
		};

		return new Filter(options);
	});
}

// Editable
if (window.DataTable) {
    DataTable.extend("editable", function(instance, options, utils) {

        /**
         * Default config
         * @type {Object}
         */
        var defaults = {
            classes: {
                row: "dt-editor-row",
                form: "dt-editor-form",
                item: "dt-editor-item",
                menu: "dt-editor-menu",
                save: "dt-editor-save",
                block: "dt-editor-block",
                close: "dt-editor-close",
                inner: "dt-editor-inner",
                input: "dt-editor-input",
                label: "dt-editor-label",
                modal: "dt-editor-modal",
                action: "dt-editor-action",
                header: "dt-editor-header",
                wrapper: "dt-editor-wrapper",
								editable: "dt-editor-editable",
                container: "dt-editor-container",
                separator: "dt-editor-separator"
            },

            // include hidden columns in the editor
            hiddenColumns: false,

            // enable th context menu
            contextMenu: true,
					
					  clickEvent: "dblclick",

            // set the context menu items
            menuItems: [{
                    text: "<span class='mdi mdi-lead-pencil'></span> Edit Cell",
                    action: function(e) {
                        this.editCell();
                    }
                },
                {
                    text: "<span class='mdi mdi-lead-pencil'></span> Edit Row",
                    action: function(e) {
                        this.editRow();
                    }
                },
                {
                    separator: true
                },
                {
                    text: "<span class='mdi mdi-delete'></span> Remove Row",
                    action: function(e) {
                        if (confirm("Are you sure?")) {
                            this.removeRow();
                        }
                    }
                }
            ]
        };

        /**
         * Add event listener to target
         * @param  {Object} el
         * @param  {String} e
         * @param  {Function} fn
         */
        var on = function(el, e, fn) {
            el.addEventListener(e, fn, false);
        };

        /**
         * Remove event listener from target
         * @param  {Object} el
         * @param  {String} e
         * @param  {Function} fn
         */
        var off = function(el, e, fn) {
            el.removeEventListener(e, fn);
        };

        /**
         * Get the closest matching ancestor
         * @param  {Object}   el         The starting node.
         * @param  {Function} fn         Callback to find matching ancestor.
         * @return {Object|Boolean}      Returns the matching ancestor or false in not found.
         */
        var closest = function(el, fn) {
            return el && el !== document.body && (fn(el) ? el : closest(el.parentNode, fn));
        };

        /**
         * Returns a function, that, as long as it continues to be invoked, will not be triggered.
         * @param  {Function} fn
         * @param  {Number} wait
         * @param  {Boolean} now
         * @return {Function}
         */
        var debounce = function(n, t, u) {
            var e;
            return function() {
                var i = this,
                    o = arguments,
                    a = u && !e;
                clearTimeout(e),
                    (e = setTimeout(function() {
                        (e = null), u || n.apply(i, o);
                    }, t)),
                    a && n.apply(i, o);
            };
        };

        /**
         * Main lib
         * @param {Object} target Target table
         * @param {Object} config User config
         */
        var Editor = function(target, config) {
            this.target = target;
            this.config = utils.extend(defaults, config);
        }

        /**
         * Init instance
         * @return {Void}
         */
        Editor.prototype.init = function() {
					
					  if ( this.initialised ) return;
					
            var that = this,
                o = that.config;

            utils.classList.add(instance.wrapper, o.classes.editable);

            if (o.contextMenu) {

                that.container = utils.createElement("div", {
                    id: o.classes.container
                });

                that.wrapper = utils.createElement("div", {
                    class: o.classes.wrapper
                });

                that.menu = utils.createElement("ul", {
                    class: o.classes.menu
                });

                if (o.menuItems && o.menuItems.length) {
                    o.menuItems.forEach(function(item) {
                        var li = utils.createElement("li", {
                            class: item.separator ? o.classes.separator : o.classes.item
                        });

                        if (!item.separator) {
                            var a = utils.createElement("a", {
                                class: o.classes.action,
                                href: item.url || "#",
                                html: item.text
                            });

                            li.appendChild(a);

                            if (item.action && typeof item.action === "function") {
                                on(a, "click", function(e) {
                                    e.preventDefault();
                                    item.action.call(that, e);
                                });
                            }
                        }

                        that.menu.appendChild(li);
                    });
                }

                that.wrapper.appendChild(that.menu);
                that.container.appendChild(that.wrapper);

                that.update();
            }

            that.data = {};
            that.closed = true;
            that.editing = false;
            that.editingRow = false;
            that.editingCell = false;

            that.bindEvents();

            setTimeout(function() {
								that.initialised = true;
                instance.emit("editable.init");
            }, 10);
        };

        /**
         * Bind events to DOM
         * @return {Void}
         */
        Editor.prototype.bindEvents = function() {
            var that = this;

            this.events = {
                context: this.context.bind(this),
                update: this.update.bind(this),
                dismiss: this.dismiss.bind(this),
                keydown: this.keydown.bind(this),
                click: this.click.bind(this)
            };

            // listen for click / double-click
            on(this.target, this.config.clickEvent, this.events.click);

            // listen for click anywhere but the menu
            on(document, "click", this.events.dismiss);

            // listen for right-click
            on(document, "keydown", this.events.keydown);

            if (this.config.contextMenu) {
                // listen for right-click
                on(this.target, "contextmenu", this.events.context);

                // reset
                this.events.reset = debounce(this.events.update, 50);
                on(window, "resize", this.events.reset);
                on(window, "scroll", this.events.reset);
            }
        };

        /**
         * contextmenu listener
         * @param  {Object} e Event
         * @return {Void}
         */
        Editor.prototype.context = function(e) {
            this.event = e;

            var valid = this.target.contains(e.target);

            if (this.config.contextMenu && !this.disabled && valid) {
                e.preventDefault();

                // get the mouse position
                var x = e.pageX;
                var y = e.pageY;

                // check if we're near the right edge of window
                if (x > this.limits.x) {
                    x -= this.rect.width;
                }

                // check if we're near the bottom edge of window
                if (y > this.limits.y) {
                    y -= this.rect.height;
                }

                this.wrapper.style.top = y + "px";
                this.wrapper.style.left = x + "px";

                this.openMenu();
                this.update();
            }
        };

        /**
         * dblclick listener
         * @param  {Object} e Event
         * @return {Void}
         */
        Editor.prototype.click = function(e) {
            if (!this.editing) {
                var cell = closest(e.target, function(el) {
                    return el.nodeName === "TD";
                });
                if (cell) {
                    this.editCell(cell);
                    e.preventDefault();
                }
            }
        };

        /**
         * keydown listener
         * @param  {Object} e Event
         * @return {Void}
         */
        Editor.prototype.keydown = function(e) {
            if (this.editing && this.data) {
                if (e.keyCode === 13) {
                    // Enter key saves
                    if (this.editingCell) {
                        this.saveCell();
                    } else if (this.editingRow) {
                        this.saveRow();
                    }
                } else if (e.keyCode === 27) {
                    // Escape key reverts
                    this.saveCell(this.data.content);
                }
            }
        };

        /**
         * Edit cell
         * @param  {Object} cell    The HTMLTableCellElement
         * @return {Void}
         */
        Editor.prototype.editCell = function(cell) {
            cell = cell || closest(this.event.target, function(el) {
                return el.nodeName === "TD";
            });

            if (cell.nodeName !== "TD" || this.editing) return;

            var that = this;
					
						var row = instance.table.rows[cell.parentNode.dataIndex];
					
						cell = row.cells[cell.dataIndex];

            that.data = {
                cell: cell,
							  content: cell.content,
                input: utils.createElement("input", {
                    type: "text",
										value: cell.content,
                    class: that.config.classes.input,
                })
            };

            cell.node.innerHTML = "";
            cell.node.appendChild(that.data.input);

            setTimeout(function() {
                that.data.input.focus();
                that.data.input.selectionStart = that.data.input.selectionEnd = that.data.input.value.length;
                that.editing = true;
                that.editingCell = true;

                that.closeMenu();
            }, 10);
        };

        /**
         * Save edited cell
         * @param  {Object} row    The HTMLTableCellElement
         * @param  {String} value   Cell content
         * @return {Void}
         */
        Editor.prototype.saveCell = function(value, cell) {
            cell = cell || this.data.cell;
            value = value || this.data.input.value;

            var oldData = cell.content;

            // Set the cell content
            cell.setContent(value.trim());

            this.data = {};
            this.editing = this.editingCell = false;

			let row = instance.table.rows[cell.node.parentNode.dataIndex];
            instance.emit("editable.save.cell", value, oldData,row);
        };

        /**
         * Edit row
         * @param  {Object} cell    The HTMLTableRowElement
         * @return {Void}
         */
        Editor.prototype.editRow = function(row) {
            row = row || closest(this.event.target, function(el) {
                return el.nodeName === "TR";
            });

            if (row.nodeName !== "TR" || this.editing) return;

            var that = this,
                o = that.config,
								row = instance.table.rows[row.dataIndex];

            var template = [
                "<div class='" + o.classes.inner + "'>",
                    "<div class='" + o.classes.header + "'>",
                        "<h4>Editing row</h4>",
                        "<button class='" + o.classes.close + "' type='button' data-editor-close>×</button>",
                    " </div>",
                    "<div class='" + o.classes.block + "'>",
                        "<form class='" + o.classes.form + "'>",
                            "<div class='" + o.classes.row + "'>",
                                "<button class='" + o.classes.save + "' type='button' data-editor-save>Save</button>",
                            "</div>",
                        "</form>",
                    "</div>",
                "</div>",
            ].join("");

            var modal = utils.createElement("div", {
                class: o.classes.modal,
                html: template
            });

            var inner = modal.firstElementChild;
            var form = inner.lastElementChild.firstElementChild;

            // Add the inputs for each cell
            [].slice.call(row.cells).forEach(function(cell, i) {
								if ( !cell.hidden || (cell.hidden && o.hiddenColumns) ) {
									form.insertBefore(utils.createElement("div", {
											class: o.classes.row,
											html: [
													"<div class='datatable-editor-row'>",
															"<label class='" + o.classes.label + "'>" + instance.table.header.cells[i].content + "</label>",
															"<input class='" + o.classes.input + "' value='" + cell.content + "' type='text'>",
													"</div>"
											].join("")
									}), form.lastElementChild);
								}
            });

            this.modal = modal;

            this.openModal();

            // Grab the inputs
            var inputs = [].slice.call(form.elements);

            // Remove save button
            inputs.pop();

            that.data = {
                row: row,
                inputs: inputs
            };

            this.editing = true;
            this.editingRow = true;

            // Close / save
            modal.addEventListener("click", function(e) {
                var node = e.target;
                if (node.hasAttribute("data-editor-close")) { // close button
                    that.closeModal();
                } else if (node.hasAttribute("data-editor-save")) { // save button
                    // Save
                    that.saveRow();
                }
            });

            that.closeMenu();
        };

        /**
         * Save edited row
         * @param  {Object} row    The HTMLTableRowElement
         * @param  {Array} data   Cell data
         * @return {Void}
         */
        Editor.prototype.saveRow = function(data, row) {
            var that = this,
                o = that.config;

            data = data || that.data.inputs.map(function(input) {
                return input.value.trim();
            });
            row = row || that.data.row;

            // Store the old data for the emitter
            var oldData = row.cells.map(function(cell) {
                return cell.content;
            });

            row.cells.forEach(function(cell, i) {
                cell.setContent(data[i]);
            });

            this.closeModal();

            instance.emit("editable.save.row", data, oldData);
        };

        /**
         * Open the row editor modal
         * @return {Void}
         */
        Editor.prototype.openModal = function() {
            if (!this.editing && this.modal) {
                document.body.appendChild(this.modal);
            }
        };

        /**
         * Close the row editor modal
         * @return {Void}
         */
        Editor.prototype.closeModal = function() {
            if (this.editing && this.modal) {
                document.body.removeChild(this.modal);
                this.modal = this.editing = this.editingRow = false;
            }
        };

        /**
         * Remove a row
         * @param  {Number|Object} row The HTMLTableRowElement or dataIndex property
         * @return {Void}
         */
        Editor.prototype.removeRow = function(row) {
            if (!row) {
                var row = closest(this.event.target, function(node) {
                    return node.nodeName === "TR";
                });

                if (row && row.dataIndex !== undefined) {
					instance.table.rows[row]
					instance.emit("editable.remove.row",  instance.table.rows[row.dataIndex]);
					instance.rows().remove(row.dataIndex);
                    this.closeMenu();
                }
            } else {
                // User passed a HTMLTableRowElement
                if (row instanceof Element && row.nodeName === "TR" && row.dataIndex !== undefined) {
                    row = row.dataIndex;
                }
				instance.emit("editable.remove.row", instance.table.rows[row]);
                instance.rows().remove(row);
                this.closeMenu();
            }
        };

        /**
         * Update context menu position
         * @return {Void}
         */
        Editor.prototype.update = function() {
            var scrollX = window.scrollX || window.pageXOffset;
            var scrollY = window.scrollY || window.pageYOffset;

            this.rect = this.wrapper.getBoundingClientRect();

            this.limits = {
                x: window.innerWidth + scrollX - this.rect.width,
                y: window.innerHeight + scrollY - this.rect.height
            };
        };

        /**
         * Dismiss the context menu
         * @param  {Object} e Event
         * @return {Void}
         */
        Editor.prototype.dismiss = function(e) {

            var valid = true;

            if (this.config.contextMenu) {
                valid = !this.wrapper.contains(e.target);
                if (this.editing) {
                    valid = !this.wrapper.contains(e.target) && e.target !== this.data.input;
                }
            }

            if (valid) {
                if (this.editingCell) {
                    // Revert
                    this.saveCell(this.data.cell.content);
                }
                this.closeMenu();
            }
        };

        /**
         * Open the context menu
         * @return {Void}
         */
        Editor.prototype.openMenu = function() {
            if (this.config.contextMenu) {
                document.body.appendChild(this.container);
                this.closed = false;

                instance.emit("editable.context.open");
            }
        };

        /**
         * Close the context menu
         * @return {Void}
         */
        Editor.prototype.closeMenu = function() {
            if (this.config.contextMenu && !this.closed) {
                this.closed = true;
                document.body.removeChild(this.container);

                instance.emit("editable.context.close");
            }
        };

        /**
         * Destroy the instance
         * @return {Void}
         */
        Editor.prototype.destroy = function() {
            off(this.target, this.config.clickEvent, this.events.click);
            off(this.target, "contextmenu", this.events.context);

            off(document, "click", this.events.dismiss);
            off(document, "keydown", this.events.keydown);

            off(window, "resize", this.events.reset);
            off(window, "scroll", this.events.reset);
					
						if ( document.body.contains(this.container) ) {
							document.body.removeChild(this.container);
						}
					
					  this.initialised = false;
        };

        return new Editor(this.table.body, options);
    });
}


if (window.DataTable) {
    DataTable.extend("exportable", function(instance, config, utils) {

        /**
         * Default configuration
         * @type {Object}
         */
        var defaultConfig = {
            download: true,
            skipColumns: [],

            // csv
            lineDelimiter: "\n",
            columnDelimiter: ",",

            // sql
            tableName: "table",

            // json
            replacer: null,
            space: 4,

            // print
            modal: true
        };

        var Exporter = function() {};

        /**
         * Initialise instance of Exporter
         * @return {[type]} [description]
         */
        Exporter.prototype.init = function() {
            if ( !this.initialised ) {
                this.config = utils.extend(defaultConfig, config);

                this.initialised = true;
            }
        };

        /**
         * Export with options
         * @param  {Object} config Export options
         * @return {[type]}        [description]
         */
        Exporter.prototype.export = function(config) {
            if (config && utils.isObject(config)) {
                this.config = utils.extend(this.config, config);
            }
            switch (this.config.type.toLowerCase()) {
                case "json":
                    this.toJSON();
                    break;
                case "sql":
                    this.toSQL();
                    break;
                case "csv":
                    this.toCSV();
                    break;
            }
        };

        /**
         * Export to json
         * @param  {Object} config JSON options
         * @return {String}        JSON string
         */
        Exporter.prototype.toJSON = function(config) {

            if (config && utils.isObject(config)) {
                this.config = utils.extend(this.config, config);
            }

            this.config.type = "json";

            var str = "",
                data = [],
                o = this.config,
                table = instance.table;

            utils.each(table.rows, function(row, n) {
                data[n] = data[n] || {};

                utils.each(row.cells, function(cell, i) {
                    if (!cell.hidden && o.skipColumns.indexOf(cell.index) < 0) {
                        data[n][table.header.cells[cell.index].content] = table.rows[n].cells[cell.index].content;
                    }
                })
            });

            // Convert the array of objects to JSON string
            str = JSON.stringify(data, o.replacer, o.space);

            if (o.download) {
                this.string = "data:application/json;charset=utf-8," + str;
                this.download();
            }

            return str;
        };

        /**
         * Export to csv
         * @param  {Object} config CSV options
         * @return {String}        CSV string
         */
        Exporter.prototype.toCSV = function(config) {
            if (config && utils.isObject(config)) {
                this.config = utils.extend(this.config, config);
            }

            this.config.type = "csv";

            var str = "",
                data = [],
                o = this.config,
                table = instance.table;

            utils.each(table.rows, function(row, n) {
                data[n] = data[n] || {};

                utils.each(row.cells, function(cell, i) {
                    if (!cell.hidden && o.skipColumns.indexOf(cell.index) < 0) {
                        str += cell.content + o.columnDelimiter;
                    }
                });

                // Remove trailing column delimiter
                str = str.trim().substring(0, str.length - 1);

                // Apply line delimiter
                str += o.lineDelimiter;
            });

            // Remove trailing line delimiter
            str = str.trim().substring(0, str.length - 1);

            if (o.download) {
                this.string = "data:text/csv;charset=utf-8," + str;
                this.download();
            }

            return str;
        };

        /**
         * Export to sql
         * @param  {Object} config SQL options
         * @return {String}        SQL string
         */
        Exporter.prototype.toSQL = function(config) {
            if (config && utils.isObject(config)) {
                this.config = utils.extend(this.config, config);
            }

            this.config.type = "sql";

            var o = this.config,
                table = instance.table;

            // Begin INSERT statement
            var str = "INSERT INTO `" + o.tableName + "` (";

            // Convert table headings to column names
            utils.each(table.header.cells, function(cell) {
                if (!cell.hidden && o.skipColumns.indexOf(cell.index) < 0) {
                    str += "`" + cell.content + "`,";
                }
            });

            // Remove trailing comma
            str = str.trim().substring(0, str.length - 1);

            // Begin VALUES
            str += ") VALUES ";

            // Iterate rows and convert cell data to column values
            utils.each(table.rows, function(row) {
                str += "(";

                utils.each(row.cells, function(cell) {
                    if (!cell.hidden && o.skipColumns.indexOf(cell.index) < 0) {
                        str += "`" + cell.content + "`,";
                    }
                });

                // Remove trailing comma
                str = str.trim().substring(0, str.length - 1);

                // end VALUES
                str += "),";
            });

            // Remove trailing comma
            str = str.trim().substring(0, str.length - 1);

            // Add trailing colon
            str += ";";

            if (o.download) {
                this.string = "data:application/sql;charset=utf-8," + str;
                this.download();
            }

            return str;
        };

        /**
         * Trigger download
         * @param  {String} str The formatted file contents
         * @return {Void}
         */
        Exporter.prototype.download = function(str) {

            // Download
            if (this.string) {
                // Filename
                var filename = this.config.filename || "datatable_export";
                filename += "." + this.config.type;

                this.string = encodeURI(this.string);

                // Create a link to trigger the download
                var link = document.createElement("a");
                link.href = this.string;
                link.download = filename;

                // Append the link
                document.body.appendChild(link);

                // Trigger the download
                link.click();

                // Remove the link
                document.body.removeChild(link);
            }
        };

        /**
         * Print table
         * @return {Void}
         */
        Exporter.prototype.print = function(config) {

            if (config && utils.isObject(config)) {
                this.config = utils.extend(this.config, config);
            }

            var table = document.createElement("table"),
                thead = document.createElement("thead"),
                tbody = document.createElement("tbody");

            table.appendChild(thead);
            table.appendChild(tbody);

            utils.each(instance.table.header.cells, function(cell) {
                thead.appendChild(cell.node.cloneNode(true));
            });

            utils.each(instance.table.rows, function(row) {
                tbody.appendChild(row.node.cloneNode(true));
            });

            // Open new window
            var w = window.open();

            // Append the table to the body
            w.document.body.appendChild(table);

            if ( this.config.modal ) {
                // Print
                w.focus(); // IE
                w.print();
            }
        };
			
        /**
         * Destroy instance of Exporter
         * @return {[type]} [description]
         */
        Exporter.prototype.destroy = function() {
            if ( this.initialised ) {
                this.initialised = false;
            }
        };			

        return new Exporter();
    });
}