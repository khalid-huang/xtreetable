(function(window, $) {
  var Node, Tree, methods, likeTable;
  Node = (function(){
    function Node(row, tree, table, settings) {
      var parentId;
      this.row = row; //保存对应的DOM结点
      this.tree = tree;
      this.table = table;
      this.settings = settings;

      this.id = this.row.data(this.settings.nodeIdAttr);
      parentId = this.row.data(this.settings.parentIdAttr);
      if(parentId !== null && parentId !== '') {
        this.parentId = parentId;
      }

      this.treeCell = $(this.row.children(this.settings.columnElClass)[this.settings.column]); //用于触发收缩与张开的元素
      if(settings.moveable) {
        this.moveUpTarget = $(this.row.find(this.settings.moveUpElClass)[0])
        this.moveDownTarget = $(this.row.find(this.settings.moveDownElClass)[0])
      }
      this.children = [];
      this.initialized = false;
    }

    Node.prototype.getNextChildId = function() {
      var maxId = 0;
      this.children.forEach(function(child) {
        if(child.id > maxId) {
          maxId = child.id;
        }
      })
      return maxId + 1;
    }

    Node.prototype.updateBranchLeafClass = function() {
      this.row.removeClass('branch');
      this.row.removeClass('leaf');
      this.row.addClass(this.isBranchNode() ? 'branch' : 'leaf');
    }

    Node.prototype.isBranchNode = function() {
      if(this.children.length > 0 || this.row.data(this.settings.branchAttr) === true) {
        return true;
      } else {
        return false;
      }
    }

    Node.prototype.addChild = function(child) {
      return this.children.push(child)
    }

    Node.prototype.show = function() {
      if(!this.initialized) {
        this._initialize()
      }
      //this.row.show();

      //从fragment里面将对应的DOM元素抽离出来; 这样真有意义吗？导致页面卡的原因是DOM太多还是DOM操作
      /*var fragments = this.table.fragments,
        id = this.id,
        row = fragments[id];
      if(row) {
        var set = this.nodeSet(),
          target;
        //这里的set只能是children而不可能是roots
        if(set.length === 0 || set.indexOf(this) === 0) {
          target = this.parentNode();
          target.row.after(row)
        } else {
          var preInd = set.indexOf(this) - 1;
          target = this.parentNode().children[preInd];
          target.row.after(row);
        }
        fragments[id] = null;        
      }*/

      this.row.slideDown();

      if(this.expanded()) {
        this._showChildren();
      }
      return this;
    }

    Node.prototype.hide = function() {
      this._hideChildren();
      //this.row.hide();
      this.row.slideUp()
      //隐藏完后，将对应的DOM元素放到fragment
      /*var fragments = this.table.fragments,
        id = this.id,
        self = this;
      this.row.slideUp("normal", function(){
        fragments[id] = $(document.createDocumentFragment());
        fragments[id].append(self.row);
      });*/

      return this;
    }

    //获取node对应的集合
    Node.prototype.nodeSet = function() {
      if(this.parentNode() != null) {
        return this.parentNode().children;
      } else {
        return this.table.roots;
      }
    }

    Node.prototype.toggle = function() {
      if(this.expanded()) {
        this.collapse();
      } else {
        this.expand();
      }
      return this;
    }

    Node.prototype._initialize = function() {
      var settings = this.settings;
      this.render();

      if(settings.expandable === true && settings.initialState === "collapsed") {
        this.collapse();
      } else {
        this.expand();
      }

      return this.initialized = true;
    }


    Node.prototype.expand = function() {
      if(this.expanded()) {
        return this;
      }

      this.row.removeClass("collapsed").addClass("expanded");

      if($(this.row).is(":visible")) {
        this._showChildren();
      }

      return this;
    }

    Node.prototype.collapse = function() {
      if(this.collapsed()) {
        return this;
      }

      this.row.removeClass('expanded').addClass('collapsed');
      this._hideChildren();

      return this;
    }

    Node.prototype._showChildren = function() {
      var result = [];
      for(var i = 0, len = this.children.length; i < len; i++) {
        result.push(this.children[i].show());
      }
      return result;
    }

    Node.prototype._hideChildren = function() {
      var result = [];
      for(var i = 0, len = this.children.length; i < len; i++) {
        result.push(this.children[i].hide());
      }
      return result
    }

    Node.prototype.expanded = function() {
      return this.row.hasClass('expanded');
    }

    Node.prototype.collapsed = function() {
      return this.row.hasClass("collapsed");
    };

    Node.prototype.render = function() {
      var settings = this.settings,
        target,
        moveUpTarget,
        moveDownTarget;

      if(settings.expandable === true && this.isBranchNode()) {
        /*var handler = function(e) {
          $(this).parents('.x-treetable').xtreetable("node", $(this).parents('.x-tr').data(settings.nodeIdAttr)).toggle();
          return e.preventDefault()
        }*/
        
        //target = this.treeCell;

        var handler = function(e) {
          $(this).parents('.x-treetable').xtreetable("node", $(this).data(settings.nodeIdAttr)).toggle();
          return e.preventDefault()
        }        
        target = this.row;
        target.off('click.xtreetable').on('click.xtreetable', handler);
        target.off('keydown.xtreetable').on('keydown.xtreetable', function(e) {
            if(e.keyCode == 13) {
              handler.apply(this, [e]);
            }
        })
      }

      if(settings.moveable === true) {
        var moveUpHandler = function(e) {
          if(e.target.className.indexOf('x-move-disable') !== -1) {
            return false; //防止冒泡
          }
          var node = $(this).parents('.x-treetable').xtreetable("node", $(this).parents('.x-tr').data(settings.nodeIdAttr))

          $(this).parents('.x-treetable').xtreetable("move", node, '+')
          return false;
        }
        var moveDownHandler = function(e) {
          if(e.target.className.indexOf('x-move-disable') !== -1) {
            return false;
          }          
          var node = $(this).parents('.x-treetable').xtreetable("node", $(this).parents('.x-tr').data(settings.nodeIdAttr))

          $(this).parents('.x-treetable').xtreetable("move", node, '-')
          return false;
        }
        moveUpTarget = this.moveUpTarget;
        moveDownTarget = this.moveDownTarget;
        moveUpTarget.off('click.xtreetable').on('click.xtreetable', moveUpHandler);
        moveDownTarget.off('click.x-treetable').on('click.xtreetable', moveDownHandler);
      }

      if(settings.contenteditable === true) {
        //如果callback返回false的话，就终止当前流程
        var preCallback = settings.editPreCallback,
          afterCallback = settings.editAfterCallback,
          oldVal = ''
        
        var clickHandler = function(e) {
          $(e.target).prop('contenteditable', true);
          $(e.target).prop('spellcheck', false)

          oldVal = $(e.target).text();
          if(preCallback && !preCallback(e, oldVal)) {
            return false;
          }

          e.preventDefault();
          return false;
        }

        var blurHandler = function(e) {
          var newVal = $(e.target).text();
          if(oldVal !== newVal && afterCallback) {
            afterCallback(e, oldVal, newVal);
          }
          return false; 
        }

        this.row.find('.x-content').off('click.xtreetable').on('click.xtreetable', clickHandler);
        this.row.find('.x-content').off('blur.xtreetable').on('blur.xtreetable', blurHandler);
      }

      this.row.find('.x-content')[0].style.marginLeft = "" + (this.level()*settings.indent) + 'px';
      return this;
    }

    Node.prototype.removeChild = function(child) {
      var index = $.inArray(child, this.children)
      return this.children.splice(index, 1);
    }

    Node.prototype.level = function() {
      return this.ancestors().length;
    }

    Node.prototype.ancestors = function() {
      var ancestors, node;
      node = this;
      ancestors = [];
      while(node = node.parentNode()) {
        ancestors.push(node)
      }
      return ancestors
    }

    Node.prototype.parentNode = function() {
      if(this.parentId != null) {
        return this.tree[this.parentId]
      } else {
        return null;
      }
    }

    Node.prototype.firstChild = function() {
      if(this.children.length !== 0) {
        return this.children[0]
      } else {
        return null;
      }
    }

    Node.prototype.lastChild = function() {
      if(this.children.length !== 0) {
        return this.children[this.children.length-1]
      } else {
        return null;
      }
    }

    //direction: + 表示上移；- 表示下移
    Node.prototype.move = function(direction) {
      var slibings = this.parentId == null ? this.table.roots :  this.parentNode().children,
        index = slibings.indexOf(this),
        dirIndex = direction === '+' ? index - 1 : index + 1,
        tmp = slibings[index];
      //更新对应的数组，数组与页面是的树需要对应
      slibings[index] = slibings[dirIndex];
      slibings[dirIndex] = tmp;

      //交换DOM
      var current = this,
        other = slibings[index],
        fragment;

      fragment = this.getSelfAndTotalChildren();
      if(direction === '+') {
        var target = other;
        target.row.before(fragment);
      } else {
        var target = other.findLastNode();
        target.row.after(fragment)
      }

      current.updateMoveableClass();
      other.updateMoveableClass();
    }

    Node.prototype.findLastNode = function() {
      if(this.children.length > 0) {
        return this.findLastNode.apply(this.children[this.children.length-1])
      } else {
        return this;
      }
    }

    //获取整个从self开始的整个家族
    Node.prototype.getSelfAndTotalChildren = function(fragment) {
      var fragment = $(document.createDocumentFragment());
      (function(node){
        fragment.append(node.row);
        for(var i = 0, len = node.children.length; i < len; i++) {
          arguments.callee(node.children[i])
        }
      })(this)
      return fragment;
    }

    Node.prototype.updateMoveableClass = function(){
      var slibings = this.parentId == null ? this.table.roots : this.parentNode().children,
        index = slibings.indexOf(this);
      if(index === 0) {
        this.moveUpTarget.addClass('x-move-disable');
      } else {
        this.moveUpTarget.removeClass('x-move-disable');
      }
      if(index === slibings.length - 1){
        this.moveDownTarget.addClass('x-move-disable');
      } else {
        this.moveDownTarget.removeClass('x-move-disable')
      }
    }

    return Node;
  })()

  Tree = (function(){
    function Tree(table, settings) {
      this.table = table
      this.settings = settings;
      this.tree = {};

      //下面两个缓存是用于快速定位的
      this.nodes = [];
      this.roots = [];
      this.fragments = {};//用于缓存没有显示的结点，拉出页面
    }

    Tree.prototype.getNextRootId = function() {
      var maxId = 0;
      this.roots.forEach(function(node) {
        if(node.id > maxId) {
          maxId = node.id;
        }
      })
      return maxId + 1;
    }

    Tree.prototype.loadRows = function(rows) {
      var node, row, i;
      if(rows !== null) {
        for(var i = 0, len = rows.length; i < len; i++) {
          row = $(rows[i]);
          if(row.data(this.settings.nodeIdAttr) !== null) {
            node = new Node(row, this.tree, this, this.settings);
            this.nodes.push(node);
            this.tree[node.id] = node;

            if(node.parentId != null && this.tree[node.parentId]) {
              this.tree[node.parentId].addChild(node);
            } else {
              this.roots.push(node);
            }
          }
        }
      }

      for(i = 0, len = this.nodes.length; i < len; i++) {
        this.nodes[i].updateBranchLeafClass();
      }
      if(this.settings.moveable) {
        for(i = 0, len = this.nodes.length; i < len; i++) {
          this.nodes[i].updateMoveableClass();
        }
      }
      console.log(this.roots)

      return this;
    }

    Tree.prototype.render = function() {
      var root;
      for(var i = 0, len = this.roots.length; i< len; i++) {
        root = this.roots[i];
        root.show();
      }
      return this;
    }

    Tree.prototype.move = function(node, direction) {
      console.log(direction)
      node.move(direction); 
      return this;
    }

    Tree.prototype.removeNode = function(node) {
      //删除所有子节点
      this.unloadBranch(node);

      //从DOM树中删除
      node.row.remove();

      //更新父节点的数据
      if(node.parentId !== null) {
        node.parentNode().removeChild(node);
        node.parentNode().firstChild().updateMoveableClass();
        node.parentNode().lastChild().updateMoveableClass();
      } else {
        this.roots.splice($.inArray(node, this.roots),1)
        this.roots[0].updateMoveableClass();
        this.roots[this.roots.length-1].updateMoveableClass();
      }
      delete this.tree[node.id];

      this.nodes.splice($.inArray(node, this.nodes), 1);
      return this;
    }

    Tree.prototype.unloadBranch = function(node) {
      var children = node.children.slice(0);
      for(var i = 0, len = children.length; i < len; i++) {
        this.removeNode(children[i])
      }

      node.children = [];
      node.updateBranchLeafClass();
      return this;
    }

    Tree.prototype.findLastNode = function(node) {
      return node.findLastNode()
    }

    //因为模板上的数据是没有从属关系的，所以要用内部的roots和children来模拟，也就是保持roots与children的数据和页面上的对应; 内部为了高效使用fragment
    Tree.prototype.move = function(node,direction) {
      node.move(direction);
      return this;
    }

    Tree.prototype.sortBranch = function(node, sortFun) {
      //还没有增加对
      node.children.sort(sortFunc);
      this._updateChildRows(node);
    }

    Tree.prototype._updateChildRows = function(parentNode) {
      return this._moveRows(parentNode, parentNode);
    }

    //当node = destination时可达到更新children的作用；主要问题在于其效率不是很高，如果是直接用在上下移动的话，所以上下移动是用了fragment进行移动
    Tree.prototype._moveRows = function(node, destination) {
      var children = node.children;
      node.row.insertAfter(destination.row);
      node.render();

      //注意对应关系，都是插入到父节点的后面的
      for(var i = children.length - 1; i >= 0; i--) {
        this._moveRows(children[i], node);
      }
    } 

    return Tree;
  })();

  //用于拓展div的功能，使其像table一样
  likeTable = {
    getRows: function(table) {
      return $(table).find('.x-tbody .x-tr');
    }
  }


  //在生成模板的时候，注意应该把数据的转换与数据嵌入模板分离开来，因为这样可以不用在生成模块的时候边考虑数据形式，genTrp里面的 parseLists函数就是为了在生成模板时不用去计算ttid和进行递归而直接对数据行进行了处理成一个tr，tr方便后面模板的生成
  function genTpl(thead, lists, options) {
    var tdArr = [],
      trArr = [],
      settings = options;
    var headTpl = genthead(thead, options),
      bodyTpl = gentbody(lists, options),
      footTpl = gentfoot(options);

    var tpl = headTpl + bodyTpl + footTpl;
    return tpl;

    function genthead(thead) {
      var tpl = `
        <div class="x-treetable">
          <div class="x-thead">
            <div class="x-tr">
      `;
      thead.forEach(function(value) {
        tpl += `<span class="x-th">${value}</span>`;
      })

      tpl += "</div></div>";
      return tpl;
    }

    function gentbody(lists) {
      parseTable(lists)

      var tpl = '<div class="x-tbody">';
      trArr.forEach(function(tr) {
        tpl += genTr(tr);
      })
      tpl += '</div>'
      return tpl;
    }

    function genTr(tr, action) {
      var dataTpl = '';
      dataTpl += ` data-tt-id="${tr.data.ttid}" ` 
      if(tr.data.parentid) {
        dataTpl += ` data-tt-parent-id="${tr.data.parentid}" `
      }
    
      var tdTpl = '';
      tr.tds.forEach(function(td) {
        var dataTpl = '';
        for(var key in td) {
          if(key !== 'name') {
            dataTpl += ` data-${key}="${td[key]}"" `
          }
        }
        tdTpl += `<span class="x-td" ${dataTpl}><span class="x-content">${td.name}</span></span>`
      })
      var moveTpl = ''
      if(settings.moveable) {
        moveTpl = `<span class="x-td x-action"><span class="x-action-move x-arrow-up">&#8593;</span><span class="x-action-move x-arrow-down">&#8595;</span></span>`
      }

      var tpl =  `
        <div class="x-tr" ${dataTpl}>
          ${tdTpl}
          ${moveTpl}
        </div>
      `
      return tpl;
    }

    function gentfoot(options) {
      return ''
    }

    //列数据转成行数据
    function parseTable(table) {
      //将所有的单个td都放入到trArr中，
      for (var i = 0, len = table.length; i < len; i++) {
        parseColumn(table[i]);
      }
      //将td进行分组，成一个个tr, trArr里面的length是td的总数，只要计算出有多个个tr就可以进行分配了。
      getTr1(lists);
      //将得到的tdArr再进行一步操作，将其格式变为一个数级，数组里面的单项为{data:{}, td:[]}, data是ttid, parentid
      if(trArr === false) {
        return;
      }
      getTr2();
      console.log(trArr)
    }

    function getTr1(table) {
      var trNum = getTrNum(table[0]),
        average = tdArr.length / trNum;
      if (!isInteger(average)) {
        alert('输入的结构有误,数据之间没有对应');
        trArr = false;
        return;
      }

      trArr = new Array(trNum);
      for (var i = 0; i < trNum; i++) {
        trArr[i] = new Array();
      }

      var index = 0;
      for (var i = 0, tdlen = tdArr.length; i < tdlen; i++) {
        index = index === trNum ? 0 : index;
        trArr[index++].push(tdArr[i])
      }
    }

    function getTr2() {
      var result = [];
      trArr.forEach(function(tr) {  
        var rsl = separateData(tr);
        result.push(rsl);
      })
      trArr = result;
    }

    function separateData(tr) {
      var data = {},
        tds = [];
      data.ttid = tr[0].parentid ? '' + tr[0].parentid + tr[0].ttid : '' + tr[0].ttid;
      data.parentid = tr[0].parentid;

      tr.forEach(function(td) {
        delete td.ttid;
        delete td.parentid;
        tds.push(td);
      })
      return {
        data: data,
        tds: tds
      }
    }

    function getTrNum(column) {
      var count = 0;
      (function(column) {
        for (var i = 0, len = column.length; i < len; i++) {
          ++count;
          if (column[i].sub.length !== 0) {
            arguments.callee(column[i].sub)
          }
        }
      })(column)
      return count;
    }

    function isInteger(num) {
      return Math.floor(num) === num;
    }

    function parseColumn(column) {
      var ttid = 1,
        parentid = undefined;
      for (var i = 0; i < column.length;i++) {
        parseTree(column[i], ttid++, parentid);
      }
    }

    function parseTree(tree, ttid, parentid) {
      var td = {
        name: tree.name,
        ttid: ttid,
        parentid: parentid
      };
      tdExtend(td, tree);
      tdArr.push(td);
      var subTreeSet = tree.sub;
      if (subTreeSet.length !== 0) {
        var parentid = parentid ? parseInt('' + parentid + ttid) : ttid; //这里要转成真正的ttid，是以parentid为前缀的
        ttid = 1;
        for (var i = 0, len = subTreeSet.length; i < len; i++) {
          parseTree(subTreeSet[i], ttid++, parentid)
        }
      }
    }

    function tdExtend(td, column) {
      for (var name in column) {
        if (name !== 'sub' && name !== 'name') {
          td[name] = column[name]
        }
      }
    }
  }

  //用于根据数据来生成一个tr,这个是要添加到对应的node里面的
  function genTrTpl(table, node, tds) {
    var ttid, parentid;
    if(node == null) {
      ttid = table.data('xtreetable').getNextRootId();
      parentid = undefined;
    } else {
      ttid = '' + node.id + node.getNextChildId();
      parentid = node.id;
    }
    var dataTpl = ` data-tt-id="${ttid}" `
    if(parentid) {
      dataTpl += ` data-tt-parent-id="${parentid}" `
    }

    var tdTpl =""
    tds.forEach(function(td) {
      var dataTpl = '';
      for(var key in td) {
        if(key !== 'name') {
          dataTpl += ` data-${key}="${td[key]}"" `
        }
      }
      tdTpl += `<span class="x-td" ${dataTpl}><span class="x-content">${td.name}</span></span>`
    })

    var moveTpl = ''
    if(table.data('xtreetable').settings.moveable) {
      moveTpl = `<span class="x-td x-action-move"><span class="x-arrow-up">&#8593;</span><span class="x-arrow-down"> &#8595;</span></span>`
    }


    var tpl = `<div class="x-tr" ${dataTpl}> ${tdTpl} ${moveTpl} </div>`
    return tpl;
  }
  methods = {
    /**
      用于生成对应的类表格tpl并插入到this里面，
      thead: 表格的头部标题；为一个两个数数组['功能'， 'action']
      lists: 是用于生成对于的每一列的数据,是一个数组，每一项的格式为

      //这里的好处在于一次性生成模板数据，然后一次性放入到页面，然后再基于原本的页面table DOM去生成对应的tree树对应到DOM树；
    **/
    genTable: function(thead, lists, options) {
      var tpl = genTpl(thead, lists, options);
      $(this).empty();
      $(this).append($(tpl));
      $(this).find('.x-treetable').xtreetable('init', options)
    },
    /*
      用于初始化对应的this为容器下面的table为一个treetable
    */
    init: function(options) {
      var settings;

      settings = $.extend({
        indent: 19 ,//每级的缩进量,
        initialState: 'collapsed', //开始的状态
        nodeIdAttr: 'ttId', //对应到data-tt-id,
        parentIdAttr: 'ttParentId', //对应到data-tt-parent-id
        branchAttr: 'ttBranch',
        columnElClass: ".x-td",
        column: 0,
        expandable: true,
        moveUpElClass: '.x-arrow-up',
        moveDownElClass: '.x-arrow-down'
      }, options)
      //防止被改
      settings.nodeIdAttr = 'ttId';
      settings.parentIdAttr = 'ttParentId';

      return this.each(function() {
        var table = $(this), tree;
        if(table.data('xtreetable') === undefined) {
          tree = new Tree(table, settings);
          
          tree.loadRows(likeTable.getRows(table)).render();
          table.data('xtreetable', tree);
        }

        return table;
      })
    },
    node: function(id) {
      return this.data("xtreetable").tree[id];
    },
    move: function(node, direction) {
      var settings = this.data('xtreetable').settings,
        tree = this.data('xtreetable');
      if(!settings.moveable) {
        alert('没有配置moveable参数')
      } else {
        if(node) {
          tree.move(node, direction);
        } else {
          alert('无效的node')
        }
      }
      return this;
    },
    removeNode: function(id) {
      var node = this.data('xtreetable').tree[id];
      if(node) {
        this.data('xtreetable').removeNode(node);
      } else {
        throw new Error('Unknow node ' + id);
      }
      return this;
    },
    //data的格式为[td, td, td], td = {name: ...}
    addNode: function(node, tds) {
      var row = genTrTpl(this, node, tds);
      return $(this).xtreetable('loadBranch', node, row);
    },
    loadBranch: function(node, rows) {
      var settings = this.data("xtreetable").settings,
        tree = this.data("xtreetable").tree;
      rows = $(rows);
      if(node == null) {
        this.append(rows);
      } else {
        var lastNode = this.data("xtreetable").findLastNode(node)
        rows.insertAfter(lastNode.row);
      }
      this.data('xtreetable').loadRows(rows);

      //确保所有的节点都初始化;
      rows.filter('.x-tr').each(function() {
        tree[$(this).data(settings.nodeIdAttr)].show();
      })

      if(node != null) {
        node.render().expand();
      }
      return this;
    },
    sortBranch: function(node, columnOrFunction, direction) {
      var settings = this.data('xtreetablee').settings,
        sortFunc;
      columnOrFunction = columnOrFunction || settings.column;
      sortFunc = columnOrFunction;
      if($.isNumeric(columnOrFunction)) {
        sortFunc = function(a, b) {
          var extractValue, valA, valB;
          extractValue = function(node) {
            var val = node.row.find('.x-td:eq('+columnOrFunction+')').text();
            return $.trim(val).toUpperCase();
          }
          valA = extractValue(a);
          valB = extractValue(b);
          if(direction == '+') {
            if(valA < valB)
              return -1;
            if(valB > valB)
              return 1;
          } else {
            if(valA > valB)
              return -1;
            if(valB < valB)
              return 1;
          }
          return 0
        }
      }
      this.data('xtreetable').sortBranch(node, sortFunc);
      return this;
    }
  }

  $.fn.xtreetable = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else {
      return $.error('Method ' + method + " does not exist on jQuery.xtreetable")
    }
  };
})(window, $)
