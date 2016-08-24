### 调用形式
+ 统一使用`$().xtreetable(methodName, arg1, arg2,...)`的形式来调用，其中methodName是方法名，arg1, arg2为传入methodName方法的参数

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
                <div class="x-treetable">
          <div class="x-thead">
            <div class="x-tr">
              <span class="x-th">功能</span>
              <span class="x-th">操作</span>
              <span class="x-th">操作</span>
            </div>
          </div>
          <div class="x-tbody">
            <div class="x-tr" data-tt-id="1">
              <span class="x-td">
                <span class="x-content">test</span>
              </span>
              <span class="x-td">
                <span class="x-content">删除</span>
              </span>
              <span class="x-td">
                <span class="x-content">删除</span>
              </span>       
            </div>
            <div class="x-tr" data-tt-id="11" data-tt-parent-id="1">
              <span class="x-td">
                <span class="x-content" style="padding-left: 19px">test</span>
              </span>
              <span class="x-td">
                <span class="x-content">删除</span>
              </span>
              <span class="x-td">
                <span class="x-content">删除</span>
              </span>       
            </div>      
            <div class="x-tr" data-tt-id="2">
              <span class="x-td">
                <span class="x-content">test</span>
              </span>
              <span class="x-td">
                <span class="x-content">删除</span>
              </span>
              <span class="x-td">
                <span class="x-content">删除</span>
              </span>       
            </div>
          </div>
          <div class="x-tfoot">

          </div>
        </div>
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
+ sortBranch【还没有测，不可用】
    - 用于排序
    - 函数签名`function(node, columnOrFunction)`
    - 参数说明
        * node:要进行排序的树对应的父结点；为空时针对整个table进行排序
        * columnOrFunction:如果为数字时，表示以只一列的数据作为排序主体，进行一般的数字或是字符排序；为函数时，表示自定义比较函数；
    