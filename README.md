### 调用形式
+ 统一使用`$().xtreetable(methodName, arg1, arg2,...)`的形式来调用，其中methodName是方法名，arg2, arg3为传入methodName方法的参数

### 支持功能
+ 内容可编辑
+ 排序
+ 搜索并且滚动定位
+ 上下移动
+ 根据数据生成html再加工成对应的table, 或是直接html加工成table

### 概念说明
+ 因为这个是一个类table的组件，所以下文直接使用tr表示每一行，td表示行里面的每一列
+ 假设有一个数组结构`tdNode = {name:'', sub:[tdNode, tdNode, ...], other}`其中other表示其他的键值对；
+ `table = [[tdNode, tdNode],[tdNode, tdNode]]`
+ Nodex结构，是实现里面的一个结构，每一个Node对应于一个tr
+ Tree结构，是实现里面的一个结构，Tree对应于整个table
### 接口
+ genTable
    - 基于传入的符合格式的数据进行生成对应的模板并渲染在页面上；
    - 例子 
        * `$('#contain').xtreetable('genTable', thead, lists, options);`
    - 参数说明
        * `#contain`是对应的容器的id,也就是说生成的table将置于该contain下面；
        * `thead`是一个数组，用于命名table每列头的名称，比如`['功能']`表示只有一列，该列的名称为'功能'
        * `lists`是用于设计表格内容的数据结构，对应于概念说明里的`table`数据结构，一个双层的数组，内层的每个数组都对应table一个单独的列，每个数组的每一个对象对应于一个单独的列的树型；比如
        ```
            lists2 = [[{
      name: 'login',
      toggle: 'lka',
      sub: [{
        name: 'loginSub1',
        sub:[{
          name: '123',
          sub:[{
            name:'1234',
            sub:[]
          }]
        }]
      }, {
        name: 'loginSub2',
        sub: []
      }]
    }]]
        ```
         - 可以看出内层只有一层数组，所以是一个只有一列的table,其中name是将成为对应tr的内容，sub是其下的子结点，其余的信息都将以`data-`的形式附加到对应的td; 
       
        * `options`参数，用于配置，是一个键值的对应，目前参数有
            - moveable:为true时表示支持每个tr的上下移动
            - contenteditable:为true时，表示 内容支持可编辑，编辑形式为点击对应的内容；
            - editPreCallback:配合contenteditable为true时使用，可不传，当传入函数时其运行的时机是编辑内容前，主要可以用于自行做前置操作；其函数签名为`function(e, oldVal)`,其中e表示对应发生的事件，通过e.target就可以获取发生编辑事件的对应, oldVal表示原本的内容
            - edirAfterCallback:同editPreCallback，其运行时机是对应的内容编辑完成时(失去焦点),其函数签名`function(e, oldVal, newVal)`

+ init
    - 基于页面上已有的模板数据进行加工成x-treetable
    - 例子
        * html:
        ```html

        ```
        * js: `$('.x-treetable').xtreetable('init', options)`
    - 参数说明
        * options同genTable时的options；

+ node
    - 用于获取对应的结点Node
    - 函数签名为`function(id)`
    - 参数说明
        - id:是对应data-ttid对应的值，是唯一标识一个node和其所属的值
+ move
    - 实现上下移动的函数
    - 函数签名为`function(node, direction)`
    - 参数说明
        * node:表示一个node结点
        * direction:为'+'表示向上移动，'-'表示向下移动
+ removeNode
    - 实现删除结点
    - 函数签名为`function(id)`
    - 参数说明
        * id:表示要删除的节点，其data-ttid为id
+ addNode
    - 增加结点
    - 函数签名`function(node, tds)`
    - 参数说明
        * node:不为空时，表示新增结点要插入的父结点；为空时，表示新增结点是要作为根结点插入的
        * tds:是要生成DOM的数据，其格式为`[tdNode, tdNode, tdNode]`
+ extendsTree
    - 基于原本的table进行从根结点进行拓展table
    - 函数签名`function(lists, options)`
    - 参数说明
        * lists:与一开始构造table时的data一样
        * options: 配置
+ sortBranch【还没有测，不可用】
    - 用于排序
    - 函数签名`function(node, columnOrFunction)`
    - 参数说明
        * node:要进行排序的树对应的父结点；为空时针对整个table进行排序
        * columnOrFunction:如果为数字时，表示以只一列的数据作为排序主体，进行一般的数字或是字符排序；为函数时，表示自定义比较函数；

### 设计
+ **重要**
    - 这个插件的设计来自[ludo/jquery-treetable](https://github.com/ludo/jquery-treetable)，本人只是基于原有的设计上进行自己的改造与封装
+ 整体的设计理念
    - 有两个构造函数，一个是Node, 一个是Tree,其中Tree对应于每个table,Node对应每个tr。
    - 相关的数据都存储在对应的Node或是Tree中，每个.x-treetable的jquery对象的data上都挂载了对应Tree实例后的对象，来形成对应
    - 整个Tree数据结构与DOM树的对应关系是，首先是Tree实例化对象里面的roots数组，里面的元素是Node，元素的顺序与页面上的table的根.x-tr是相对应的；而每个Node有一个children数组，里面保存了该.x-tr下面的子.x-tr(这里的子.x-tr只是逻辑上的，在DOM树上其实都是并列的.x-tr)的Node,其顺序与是与DOM树中对应的子.x-tr对应的
+ setting的主要参数
    - indent:number, 是每隔一级之间的缩进；
    - initailState:'collpsed'表示一开始时树的郑诚是收缩的，如果不设置表示一开始是展开的
    - nodeIdAttr:'ttId'对应到data-ttid
    - parentIdAttr:'ttParentId'对应到data-tt-parent-id
    - columnElClass:'.x-td' 用于标识每个列元素的class,实现中是'.x-td'
    - column:number, 表示主列
    - expandable: true，表示是否可以进行展开
    - moveable: true表示是否支持上下移动
    - moveUpElClass: '.x-arrow-up'表示tr中点击可进行移动的元素的class
    - moveDownElClass:'.x-arrow-down'对应于moveUpElClass
    - contenteditable:true表示是否支持内容可编辑
    - editPreCallback:function :表示编辑前应运行的函数
    - editAfterCallback:function表示编辑完成后运行的函数(失焦后)
+ Tree 主要参数
    - table保存了对应的.x-treetable的对应的jquery对象
    - settings包括所有针对本xtreetable的设置
    - tree保存了所有本table里面的结点(tr)，是一个对象，键为数字ttid,为对应的ttid的Node
    - nodes缓存了Node的引用；
    - roots缓存了所有的根.x-tr的结点
+ Node 主要参数
    - row表示该Node对应的DOM .x-tr结点
    - table表示该Node所属的对应的Tree实例对象
    - tree是一个指向Tree实例对象的tree数组的引用
    - settings是关于本table的全部设置的引用
    - id与页面上的ttid对应，是每个结点的唯一标识
    - parentId是其父结点，如果没有的话，表示是一个root结点
    - treeCell是用于触发收缩与张开的元素【目前本人实现中没有使用这个参数】
    - moveUpTarget是每个Node.row中用于点击进行向上移动的DOM对象
    - moveDownTarget是每个Node.row中用于点击进行向下移动的DOM对象
    - children用于保存其所属的所有子结点，也就是parentId为本结点的id的缜
    - initailized表示是否已经进行初始化过的，初始化的对象是附加上本table的一些class和事件

                



