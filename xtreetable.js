(function(window, $) {
  window.Test = []

  var Node, Tree, methods, likeTable, genTpl, Search;
  Node = (function(){
    function Node(row, nodesObj, tree, settings) {
      var parentId;
      this.row = row; //保存对应的DOM结点
      this.nodesObj = nodesObj;
      this.tree = tree;
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
      this.fragment; //用于暂缓存一些
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

      this.row.slideDown();

      if(this.expanded()) {
        this._showChildren();
      }
      return this;
    }

    Node.prototype.init = function() {
       if (!this.initialized) {
        this._initialize();
      }
      return this;     
    }


    Node.prototype.hide = function() {
      this._hideChildren();
      //this.row.hide();
      //root层的结点是不收缩的
      if(this.tree.roots.indexOf(this) == -1)
        this.row.slideUp()

      return this;
    }

    //获取node对应的集合
    Node.prototype.nodeSet = function() {
      if(this.parentNode() != null) {
        return this.parentNode().children;
      } else {
        return this.tree.roots;
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

      if(settings.expandable === true && settings.initialState === "Collapse") {
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
      if(this.row.hasClass('branch')) {
        var expender = this.row.find('.x-td').eq(0).children().eq(0)
        if(expender.hasClass('symbol')) {
          expender.remove()
        }
        var target = $(this.settings.collapserTemplate).css('left', this.level() * this.settings.indent + 'px')
        this.row.find('.x-td').eq(0).prepend(target);
      }
      
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
      if(this.row.hasClass('branch')) {
        var collapser = this.row.find('.x-td').eq(0).children().eq(0);
        if(collapser.hasClass('symbol')) {
          collapser.remove()
        }
        var target = $(this.settings.expanderTemplate).css('left', this.level() * this.settings.indent + 'px')      
        this.row.find('.x-td').eq(0).prepend(target);     
      }

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

        this.updateMoveableClass()
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
        return this.nodesObj[this.parentId]
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
      var slibings = this.parentId == null ? this.tree.roots :  this.parentNode().children,
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
      var slibings = this.parentId == null ? this.tree.roots : this.parentNode().children,
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

    Node.prototype.updateSearchClass = function() {
      if(this.searchActive) {
        this.row.addClass('x-search-active');
      } else {
        this.row.removeClass('x-search-active')
      }
      if(this.searchHightligth) {
        this.row.addClass('x-search-hightlight')
      } else {
        this.row.removeClass('x-search-hightlight')
      }
      return this;
    }

    Node.prototype.scrollTo = function() {
      if(this.parentId) {
        var parent = this.parentNode();
        while(parent) {
          parent.expand();
          parent = parent.parentNode();
        }
      }

      var top = getRowTop(this.tree.table, this.row, this.settings.trHeight);
      this.tree.scrollTo(top)


      //获取对应元素相对于tbody的真正高度,使用jquery的scrollTop会有问题，老是数据不准
      function getRowTop(table, row, height) {
        var trs = table.find('.x-tbody .x-tr').toArray();
        var index = trs.indexOf(row.toArray()[0]);
        trs.splice(index);
        trs = trs.filter(function(el) {
          return $(el).css('display') !== 'none';
        })
        return trs.length * height;
      }
    }

    return Node;
  })()

  Tree = (function(){
    function Tree(table, settings) {
      this.table = table
      this.settings = settings;
      this.nodesObj = {};

      //下面两个缓存是用于快速定位的
      this.nodes = [];
      this.roots = [];
      this.fragment = {}; //用于暂时的保存一些DOM,在fragmetn里面进行操作会高效很多；

      //增加一些整个表的操作
    }

    Tree.prototype.collapseAll = function() {
      var result = []
      for(var i = 0, len = this.nodes.length; i < len; i++) {
        result.push(this.nodes[i].collapse());
      }
      return result
    }

    //用于获取下一个要生成的Node的ttid
    Tree.prototype.getNextRootId = function() {
      var maxId = 0;
      this.roots.forEach(function(node) {
        if(node.id > maxId) {
          maxId = node.id;
        }
      })
      return maxId + 1;
    }

    //用于根据目前的roots数组的位置信息更新DOM位置,策略是将使用detach将元素从DOM树移出，但保留引用，然后再去一个个插入;传入的sortFunc是用于判断当有的话，对子元素也进行排序;对DOM的操作都集中在fragment里面进行操作，不直接在document里面操作，这样会更加高效,防止多次回流
    Tree.prototype.updateRootRows = function(sortFunc) {

      var roots = this.roots;
      this.table.find('.x-tbody').children().detach();

      this.fragment = $(document.createDocumentFragment());

      for(var i = 0, len = this.roots.length; i < len; i++) {
        this._updateRootRows(this.roots[i], sortFunc);
      }
    }

    //保留引用在DOM里面，直接按顺序insertAfter到tbody后面就可以了
    Tree.prototype._updateRootRows = function(root, sortFunc) {
      var children = root.children;
      if(sortFunc) {
        children.sort(sortFunc);
      }
      root.row.appendTo(this.fragment);
      //root.row.appendTo(this.table.find('.x-tbody'))
      root.render();

      for(var i = children.length - 1; i >= 0; i--) {
        this._updateChildRows(root);
      }

      this.table.find('.x-tbody').append(this.fragment)
    }

    Tree.prototype.loadRows = function(rows) {
      var node, row, i;

      if(rows !== null) {
        for(var i = 0, len = rows.length; i < len; i++) {
          row = $(rows[i]);
          if(row.data(this.settings.nodeIdAttr) !== null) {
            node = new Node(row, this.nodesObj, this, this.settings);
            this.nodes.push(node);
            this.nodesObj[node.id] = node;
            if(node.parentId != null && this.nodesObj[node.parentId]) {
              this.nodesObj[node.parentId].addChild(node);
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
      delete this.nodesObj[node.id];

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

    Tree.prototype.sortBranch = function(node, sortFunc) {
      
      if(!node) {
        this.roots.sort(sortFunc);
        console.log(this.roots)
        this.updateRootRows(sortFunc);
      } else {
        node.children.sort(sortFunc);
        this._updateChildRows(node);
      }
    }

    Tree.prototype._updateChildRows = function(parentNode) {
      return this._moveRows(parentNode, parentNode);
    }

    //当node = destination时可达到更新children的作用；主要问题在于其效率不是很高，如果是直接用在上下移动的话，所以上下移动是用了fragment进行移动
    Tree.prototype._moveRows = function(node, destination) {
      var children = node.children;
      if(node.row !== destination.row) {
        node.row.insertAfter(destination.row);
        node.render();
      }
      //注意对应关系，都是插入到父节点的后面的
      for(var i = children.length - 1; i >= 0; i--) {
        this._moveRows(children[i], node);
      }
    } 

    Tree.prototype.search = function(text) {
      var nodes = this.nodes,
        results = [],
        texts = [],
        search = text;//text.toLowCase()
      for(var i = 0, len = nodes.length; i < len; i++) {
        texts = [];
        texts = getTexts(nodes[i]);
        for(var j = 0, len1 = texts.length; j < len1; j++) {
          if(texts[j].indexOf(search) != -1) {
            results.push(nodes[i]);
            break;
          } 
        }
      }
      return results;

      function getTexts(node) {
        var el = node.row,
          texts = [],
          str = '',
          contentEls = el.find('.x-content');
        contentEls.each(function(index, contentEl) {
          str = $(contentEl).text().trim();
          str = str; //str.toLowCase();
          texts.push(str);
        })
        return texts;
      }
    }

    Tree.prototype.scrollTo = function(top) {
      var tbody = this.table.find('.x-tbody').get(0);
      if(tbody) {
        var tree = this;
        if(tree.animateTimeout) {
          clearTimeout(tree.animateTimeout);
          delete tree.animateTimeout;
        }
        var height = tbody.clientHeight,
          bottom = tbody.scrollHeight - height,
          finalScrollTop = Math.min(Math.max(top - height / 3, 0), bottom);
        console.log('top', top)
        console.log('height',height)
        console.log('bottom', bottom)
        //$(tbody).scrollTop(finalScrollTop)
        //下面是用于实现动画的，但是有些bug
        var animate = function() {
          console.log(height, bottom, finalScrollTop)
          var scrollTop = tbody.scrollTop;
          var diff = finalScrollTop - scrollTop;
          if(Math.abs(diff) > 10) {
            var newScrollTop = tbody.scrollTop + diff / 3;
            $(tbody).scrollTop(newScrollTop);
            //this.animateCallback = callback;
            //这个是为了避免出现没有引用的animateTimeout而设置的
            if(this.animateTimeout) {
              clearTimeout(this.animateTimeout)
            }
            this.animateTimeout = setTimeout(animate, 100); //用于实现动画的，但是有个bug。
          } else {
            //finished
            $(tbody).scrollTop(finalScrollTop);
            clearTimeout(this.animateTimeout)
            delete this.animateTimeout;
            //delete this.animateCallback;
          }
        }
        animate();
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
  genTpl = (function(){
    function genTpl(obj) {
      this.tdArr = [];
      this.trArr = [];
      this.options = {};
      //this.initTtid = 1;
      this.thead = [];
      this.data = {}; //用于构建树的主要数据
      //下面为上述部分对象赋值
      for(var key in obj) {
        this[key] = obj[key];
      }
    }

    genTpl.prototype.genTable = function() {
      var headTpl = this.genthead(),
        bodyTpl = this.gentbody(),
        footTpl = this.gentfoot();

      return headTpl + bodyTpl + footTpl;
    }

    genTpl.prototype.genExtendBody = function() {
      this.parseTable();
      var tpl = '',
        self = this;
      this.trArr.forEach(function(tr) {
        tpl += self.genTr(tr);
      })
      return tpl;
    }

    genTpl.prototype.genthead = function() {
      var tpl = `
        <div class="x-treetable">
          <div class="x-thead">
            <div class="x-tr">
      `;
      this.thead.forEach(function(value) {
        tpl += `<span class="x-th">${value}</span>`;
      })

      var searchTpl = ''
      console.log(this.options)
      if(this.options.searchable) {
        searchTpl = `<span class="x-th x-search"><div class="x-search-box"><span><input placeholder="搜索"></span><span class="x-search-next">&#9660;</span><span class="x-search-pre">&#9650;</span></div></span>`
      }

      tpl += searchTpl;

      tpl += "</div></div>";
      return tpl;      
    }

    genTpl.prototype.gentbody = function() {
      this.parseTable()

      var tpl = '<div class="x-tbody">',
        self = this;
      this.trArr.forEach(function(tr) {
        tpl += self.genTr(tr);
      })
      tpl += '</div>'
      return tpl;      
    }

    genTpl.prototype.genTr = function(tr) {
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
      if(this.options.moveable) {
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

    genTpl.prototype.gentfoot = function() {
      return ''
    }

    //列数据转成行数据
    genTpl.prototype.parseTable = function() {
      //将所有的单个td都放入到trArr中，
      for (var i = 0, len = this.data.length; i < len; i++) {
        this.parseColumn(this.data[i]);
      }
      //将td进行分组，成一个个tr, trArr里面的length是td的总数，只要计算出有多个个tr就可以进行分配了。
      this.getTr1();
      //将得到的tdArr再进行一步操作，将其格式变为一个数级，数组里面的单项为{data:{}, td:[]}, data是ttid, parentid
      if(trArr === false) {
        return;
      }
      this.getTr2();
    }

    genTpl.prototype.getTr1 = function() {
      var trNum = getTrNum(this.data[0]),
        average = tdArr.length / trNum;

      if (!isInteger(average)) {
        alert('输入的结构有误,数据之间没有对应');
        this.trArr = false;
        return;
      }

      this.trArr = new Array(trNum);
      for (var i = 0; i < trNum; i++) {
        this.trArr[i] = new Array();
      }

      var index = 0;
      for (var i = 0, tdlen = this.tdArr.length; i < tdlen; i++) {
        index = index === trNum ? 0 : index;
        this.trArr[index++].push(this.tdArr[i])
      }
    }
    
    genTpl.prototype.getTr2 = function() {
      var result = [];
      this.trArr.forEach(function(tr) {  
        var rsl = separateData(tr);
        result.push(rsl);
      })
      this.trArr = result;
    }

    genTpl.prototype.parseColumn = function(column) {
      var parentid = undefined;
      for (var i = 0; i < column.length;i++) {
        var ttid = uuid();
        this.parseTree(column[i], ttid, parentid)
      }
    }

    genTpl.prototype.parseTree = function(nodesObj, ttid, parentid) {

      var td = {
        name: nodesObj.name,
        ttid: ttid,
        parentid: parentid
      };
      tdExtend(td, nodesObj);
      this.tdArr.push(td);
      var subTreeSet = nodesObj.sub;
      if (subTreeSet.length !== 0) {
        var parentid = ttid;
        for (var i = 0, len = subTreeSet.length; i < len; i++) {
          var ttid = uuid();
          this.parseTree(subTreeSet[i], ttid, parentid);
        }
      }
    }

    //辅助函数
    function separateData(tr) {
      var data = {},
        tds = [];
      data.ttid = tr[0].ttid;
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

    function tdExtend(td, column) {
      for (var name in column) {
        if (name !== 'sub' && name !== 'name') {
          td[name] = column[name]
        }
      }
    }
    return genTpl;
  })()

  Search = (function(){
    var search = function(table, tree) {
      this.contain = table.find('.x-search');
      this.table = table;
      this.tree = tree;
      this.inputEl = table.find('.x-search input');
      this.preEl = table.find('.x-search .x-search-pre');
      this.nextEl = table.find('.x-search .x-search-next');
      this.resultShow = table.find('.x-search .x-search-result');
      this.delay = 200; //ms
      this.timeout = undefined;
      this.lastText = '';
      this.results = [];
      this.resultIndex;
      this.activeResult;

      //判断事件
      var self = this;
      this.inputEl.on('input', function(e) {
        self._onDelayedSearch(e);
      })
      this.inputEl.on('change', function(e) {
        self._onSearch();
      })
      this.inputEl.on('keydown', function(e) {
        self._onKeyDown(e);
      })
      this.inputEl.on('keyup', function(e) { //for IE9
        self._onKeyUp(e);
      })

      this.preEl.on('click', function() {
        self.previous()
      })

      this.nextEl.on('click', function() {
        self.next()
      })
    }

    search.prototype._clearDelay = function() {
      if(this.timeout != undefined) {
        clearTimeout(this.timeout);
        delete this.timeout;
      }
    }

    search.prototype._onDelayedSearch = function(e) {
      this._clearDelay();
      var self = this;
      this.timeout = setTimeout(function(event) {
        self._onSearch();
      }, this.delay);
    } 

    search.prototype._onSearch = function(forceSearch) {
      this._clearDelay();
      var value = this.inputEl.val();
      var text = (value.length > 0) ? value : undefined;
      if(text != this.lastText || forceSearch) {
        this.lastText = text;
        this.results.forEach(function(node) {
          delete node.searchHightligth;
          node.updateSearchClass();
        })
        this.results = this.tree.search(text);
        console.log(this.results)

        this.results.forEach(function(node) {
          node.searchHightligth = true;
          node.updateSearchClass();
        })
        this._setActiveResult(0);

        if(text != undefined) {
          var resultCount = this.results.length;
          switch (resultCount) {
            case 0: this.resultShow.text('no&nbsp;results'); break;
            default: this.resultShow.text(resultCount + ' results'); break
          }
        } else {
          this.resultShow.text('');
        }
      }
    }

    search.prototype._onKeyDown = function(event) {
      var keynum = event.which;
      if(keynum == 27) { //ESC
        this.inputEl.val('');
        this._onSearch();
        event.preventDefault();
        event.stopPropagation();
      } else if(keynum == 13) { //Enter
        if(event.ctrlKey) { //force to search again
          this._onSearch(true);
        } else if(event.shiftKey) {
          this.previous();   //move to the previous search result
        } else {
          this.next() //move to the next search result
        }
        event.preventDefault();
        event.stopPropagation();
      }
    }

    search.prototype._onKeyUp = function (event) {
      var keynum = event.keyCode;
      if (keynum != 27 && keynum != 13) { // !show and !Enter
        this._onDelayedSearch(event);   // For IE 9
      }
    };

    search.prototype.clear = function() {
      this.inputEl.val('');
      this._onSearch();
    }

    search.prototype.destroy = function() {
      this.tree = null;
      this.contain.remove();
      this.results = null;
      this.activeResult =null;

      this._clearDelay();
    }

    search.prototype._setActiveResult = function(index) {
      if(this.activeResult) {
        var preNode = this.activeResult
        delete preNode.searchActive;
        preNode.updateSearchClass();
      }
      if(!this.results || !this.results[index]) {
        this.resultIndex = undefined;
        this.activeResult = undefined;
        return;
      }

      this.resultIndex = index;
      var node = this.results[this.resultIndex];
      node.searchActive = true;
      this.activeResult = this.results[this.resultIndex];
      node.updateSearchClass();
      node.scrollTo();
    } 

    search.prototype.next = function() {
      if(this.results != undefined) {
        var index = (this.resultIndex != undefined) ? this.resultIndex + 1 : 0;
        if(index > this.results.length - 1) {
          index = 0;
        }
      }
      this._setActiveResult(index, focus);
    }

    search.prototype.previous = function() {
      if(this.results != undefined) {
        var max = this.results.length - 1;
        var index = (this.resultIndex != undefined) ? this.resultIndex - 1 : max;
        if(index < 0) {
          index = max;
        }
      }
      this._setActiveResult(index)
    }

    return search;
  })()


  //用于根据数据来生成一个tr,这个是要添加到对应的node里面的
  function genTrTpl(table, node, tds) {
    var ttid, parentid;
    if(node == null) {
      ttid = uuid();
      parentid = undefined;
    } else {
      ttid = uuid();
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

  //用随机数模拟uuid
/*  function uuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
 
    var uuid = s.join("");
    return uuid;
  }*/
  //使用外部的库
  function uuid() {
    return (new UUID()).toString()
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
        gen = new genTpl({thead: thead, data: lists, options: options});
        tpl = gen.genTable()
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
        initialState: 'Collapse', //开始的状态
        nodeIdAttr: 'ttId', //对应到data-tt-id,
        parentIdAttr: 'ttParentId', //对应到data-tt-parent-id
        branchAttr: 'ttBranch',
        columnElClass: ".x-td",
        column: 0,
        expandable: true,
        moveUpElClass: '.x-arrow-up',
        moveDownElClass: '.x-arrow-down',
        expanderTemplate: '<span class="symbol">&#9662;</span>',
        collapserTemplate: '<span class="symbol">&#8227;</span>',
        trHeight: 36 //每个tr的高度
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
        if(settings.searchable) {
          var search = new Search(table, tree);
        }
        return table;
      })
    },

    node: function(id) {
      return this.data("xtreetable").nodesObj[id];
    },

    move: function(node, direction) {
      var settings = this.data('xtreetable').settings,
        nodesObj = this.data('xtreetable');
      if(!settings.moveable) {
        alert('没有配置moveable参数')
      } else {
        if(node) {
          nodesObj.move(node, direction);
        } else {
          alert('无效的node')
        }
      }
      return this;
    },

    removeNode: function(id) {
      var node = this.data('xtreetable').nodesObj[id];
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

    //用于继承扩展树，主要是用于针对分批加载table和后继增长的情况，是在root上增长的;
    //tds的结构类似一开始的genTable时的数据一样，是一个双层数组
    extendsTree: function(tds, options) {
      var xtreetable = this;
      if(!$(this).hasClass('x-treetable')) {
        xtreetable = $(this).find('.x-treetable');
      }
      var initTtid = xtreetable.data('xtreetable').getNextRootId(),
        gen = new genTpl({data: tds, options: options, initTtid: initTtid});
        tpl = gen.genExtendBody();
      $(xtreetable).xtreetable('loadBranch', undefined, tpl);
    },

    collapseAll: function() {
      this.data("xtreetable").collapseAll();
      return this;
    },    

    //node为空时表示，作为根结点插入
    loadBranch: function(node, rows) {
      var settings = this.data("xtreetable").settings,
        nodesObj = this.data("xtreetable").nodesObj;
      rows = $(rows).filter('.x-tr'); //确保只进行xtr的对应，不要把.x-content也包进行了

      if(node == null) {
        this.find('.x-tbody').append(rows);
      } else {
        var lastNode = this.data("xtreetable").findLastNode(node)
        rows.insertAfter(lastNode.row);
      }
      this.data('xtreetable').loadRows(rows);

      //确保所有的节点都初始化;
      rows.filter('.x-tr').each(function() {
        nodesObj[$(this).data(settings.nodeIdAttr)].init();
      })

      if(settings.initialState === 'Collapse') {
        rows.filter('.x-tr').each(function() {
          nodesObj[$(this).data(settings.nodeIdAttr)].hide();
        })
      }

      if(node != null) {
        node.render().expand();
      }
      return this;
    },

    sortBranch: function(node, columnOrFunction, direction) {
      var settings = this.data('xtreetable').settings,
        sortFunc;
      columnOrFunction = columnOrFunction || settings.column;
      sortFunc = columnOrFunction;
      if($.isNumeric(columnOrFunction)) {
        sortFunc = function(a, b) {
          var extractValue, valA, valB;
          extractValue = function(node) {
            var val = node.row.find('.x-td:eq('+columnOrFunction+')').find('.x-content').text();
            return $.trim(val).toUpperCase();
          }
          valA = extractValue(a);
          valB = extractValue(b);
          if(direction == '+') {
            if(valA < valB)
              return -1;
            if(valA > valB)
              return 1;
          } else {
            if(valA > valB)
              return -1;
            if(valA < valB)
              return 1;
          }
          return 0;
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
