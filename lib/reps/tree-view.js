/* See license.txt for terms of usage */

define(function(require, exports, module) {

// Dependencies
const React = require("react");
const { Reps } = require("reps/repository");
const { isCropped } = require("reps/string");
const { TR, TD, SPAN, TABLE, TBODY } = Reps.DOM;

/**
 * @template TODO docs
 */
var TreeView = React.createFactory(React.createClass(
/** @lends TreeView */
{
  displayName: "TreeView",

  getInitialState: function() {
    return {
      data: {},
      uid: 0,
      searchFilter: null
    };
  },

  // Rendering

  render: function() {
    var rows = [];
    var mode = this.props.mode;
    var state = this.state;

    var renderMembers = (members) => {
      for (var i in members) {
        var member = members[i];
        rows.push(TreeRow({
          key: member.key,
          data: member,
          mode: mode,
          searchFilter: state.searchFilter || this.props.searchFilter
        }));

        if (member.children && member.children.length && member.open) {
          renderMembers(member.children);
        }
      };
    }

    renderMembers(this.state.data, 0);

    return (
      TABLE({className: "domTable", cellPadding: 0, cellSpacing: 0,
        onClick: this.onClick},
        TBODY({}, rows)
      )
    );
  },

  // Event Handlers

  onClick: function(event) {
    this.setState({data: this.state.data});
  },

  // Data

  componentDidMount: function() {
    var members = this.initMembers(this.props.data, 0);
    this.setState({data: members, searchFilter: this.props.searchFilter});
  },

  componentWillReceiveProps: function(nextProps) {
    var updatedState = {
      searchFilter: nextProps.searchFilter
    };

    if (this.props.data !== nextProps.data) {
      updatedState.data = this.initMembers(nextProps.data, 0);
    }

    this.setState(updatedState);
  },

  initMembers: function(parent, level) {
    var members = this.getMembers(parent, level);
    for (var i in members) {
      var member = members[i];

      // Cropped string are expandable, but they don't have children.
      var isString = typeof(member.value) == "string";
      if (member.hasChildren && !isString) {
        member.children = this.initMembers(member.value, level+1);
      }
    };
    return members;
  },

  getMembers: function(object, level) {
    level = level || 0;

    var members = [];
    this.getObjectProperties(object, function(prop, value) {
      var valueType = typeof(value);
      var hasChildren = (valueType === "object" && this.hasProperties(value));

      // Cropped strings are expandable, so the user can see the
      // entire original value.
      if (isCropped(value)) {
        hasChildren = true;
      }

      var type = this.getType(value);
      var member = this.createMember(type, prop, value, level, hasChildren);
      members.push(member);
    });

    return members;
  },

  createMember: function(type, name, value, level, hasChildren) {
    var member = {
      name: name,
      type: type,
      rowClass: "memberRow-" + type,
      open: "",
      level: level,
      hasChildren: hasChildren,
      value: value,
      open: false,
      key: this.state.uid++
    };

    return member;
  },

  getObjectProperties: function(obj, callback) {
    for (var p in obj) {
      try {
        callback.call(this, p, obj[p]);
      }
      catch (e) {
        console.log(e)
        Trace.sysout("domTree.getObjectProperties; EXCEPTION " + e, e);
      }
    }
  },

  hasProperties: function(obj) {
    if (typeof(obj) == "string") {
      return false;
    }

    try {
      for (var name in obj) {
        return true;
      }
    }
    catch (exc) {
    }

    return false;
  },

  getType: function(object) {
    // xxxHonza: A type provider (or a decorator) should be used here.
    return "dom";
  }
}));

/**
 * @template TODO docs
 */
var TreeRow = React.createFactory(React.createClass({
  displayName: "TreeRow",
  getInitialState: function() {
    return { data: {}, searchFilter: null };
  },

  componentDidMount: function() {
    this.setState({data: this.props.data});
  },

  render: function() {
    var member = this.state.data;
    var classNames = ["memberRow"];
    classNames.push(member.type + "Row");

    if (member.hasChildren) {
      classNames.push("hasChildren");
    }

    if (member.open) {
      classNames.push("opened");
    }

    var filter = this.props.searchFilter;
    var name = member.name || "";
    var value = member.value || "";

    if (filter && (name.indexOf(filter) < 0)) {
      // Cache the stringify result, so the filtering is fast
      // the next time.
      if (!member.valueString) {
        member.valueString = JSON.stringify(value);
      }

      if (member.valueString && member.valueString.indexOf(filter) < 0) {
        classNames.push("hidden");
      }
    }

    var rowStyle = {
      "paddingLeft": (member.level * 16) + "px",
    };

    var TAG = Reps.getRep(member.value);
    return (
      TR({className: classNames.join(" "), onClick: this.onClick},
        TD({className: "memberLabelCell", style: rowStyle},
          SPAN({className: "memberLabel " + member.type + "Label"},
            member.name)
        ),
        TD({className: "memberValueCell"},
          SPAN({},
            TAG({
              object: member.value,
              mode: this.props.mode,
              member: member
            })
          )
        )
      )
    )
  },

  onClick: function(event) {
    var member = this.state.data;
    member.open = !member.open;

    this.setState({data: member});
  },
}));

// Exports from this module
exports.TreeView = TreeView;
});
