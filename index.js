$(function() {
  var thead = ['功能'
    ],

    //格式说明,最外层是一个大的数组，里面的每个元素表示一个table的一个整列(第一行的对应序号的td集合)；每一列是一个数组，列里面的每一项表示一个树，树里面的name表示内容，sub表示子树，其余的信息表示要附加到对应的td上的内容；
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

    list3 = [[{name:'1', sub:[{name:'12', sub:[]},{name:'1',sub:[]}, {name:'10',sub:[]}]}, {name: '22', sub:[{name: '12', sub:[]}, {name: '10', sub:[]}]}, {name: '2', sub:[]}, {name: '31', sub: []}]]

    lists1 = [[{
      name: 'login',
      toggle: 'lka',
      sub: [{
        name: '11',
        sub:[{
          name: '123',
          sub:[]
        }]
      }, {
        name: '2',
        sub: []
      },{
        name: '3',
        sub: []
      }]
    }, {
      name: 'login2',
      toggle: 'kakaka',
      sub: [
      ]
    }, {
      name: 'loginwe',
      toggle: 'lka',
      sub: [{
        name: 'loginSubf11',
        sub:[]
      }, {
        name: 'loginSub422',
        sub: []
      }]
    }], [{
      name: 'dir1',
      id: '12',
      sub:[{
        name: 'file12',
        sub:[{
          name: 'fileafa',
          sub:[]
        }]
      }, {
        name: 'fi32lfadsfe',
        sub:[]
      },{
        name: 'fi32le',
        sub:[]
      }]
    }, {
      name: 'fil51e',
      id: '12',
      sub:[]
    },{
      name: 'difafr1',
      id: '12',
      sub:[{
        name: 'file1fadfasd2',
        sub:[]
      }, {
        name: 'fi32l123e',
        sub:[]
      }]
    }],[{
      name: 'dir12r',
      id: '12',
      sub:[{
        name: 'fiqfdafele',
        sub:[{
          name: 'fadfa',
          sub:[]
        }]
      }, {
        name: 'fil12aaaae',
        sub:[]
      },{
        name: 'fil12e',
        sub:[]
      }]
    }, {
      name: 'fil125e',
      id: '12',
      sub:[]
    },{
      name: 'dir12312r',
      id: '12',
      sub:[{
        name: 'fiqelzvzcxve',
        sub:[]
      }, {
        name: 'fil12e',
        sub:[]
      }]
    }]
    ]

  var options = {
    moveable: true,
    searchable:true,
    contenteditable: true,
    editPreCallback: function(e, oldVal) {
      return true;
    },
    editAfterCallback: function(e, oldVal, newVal) {
      return true;
    }
  }
  $('#contain').xtreetable('genTable', thead, list3, options);
  $('#contain .x-treetable').xtreetable('extendsTree', list3, options)
  $('#contain .x-treetable').xtreetable('extendsTree', list3, options)
  $('#contain .x-treetable').xtreetable('extendsTree', list3, options)
  $('#contain .x-treetable').xtreetable('extendsTree', list3, options)
  var node = $('#contain .x-treetable').xtreetable('node', 1)
  console.log(node)
  $('#contain .x-treetable').xtreetable('sortBranch', node, 0, '-')
/*  for(var i = 3; i < 10000; i++) {
    var tpl = `
    <div class="x-tr" data-tt-id="${i}">
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
    `
    $('.x-tbody').append($(tpl));
  }
  $('.x-treetable').xtreetable('init', options)*/
})
