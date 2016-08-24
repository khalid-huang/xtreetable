var trArr = [],
  tdArr = []

function parseLists(lists) {
  for (var i = 0, len = lists.length; i < len; i++) {
    parseList(lists[i]);
  }
  getTr1(lists);
  getTr2();    
  return trArr;
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
  tr.forEach(function(td) {
    _separateData(data, td);
    tds.push(td);
  })

  return {
    data: data,
    tds: tds
  }

  function _separateData(data, td) {
    for(var name in td) {
      if(name !== 'name') {
        data[name] = td[name];
        delete td[name];
      }
    }
  }
}


function getTr1(lists) {
  var trNum = getTrNum(lists[0]),
    average = tdArr.length / trNum;
  console.log(tdArr)
  console.log(tdArr.length)
  console.log(trNum)
  if (!isInteger(average)) {
    alert('输入的结构有误,数据之间没有对应');
    trArr = false;
    return;
  }

  trArr = new Array(trNum);
  for(var i = 0; i < trNum; i++) {
    trArr[i] = new Array();
  }

  var index = 0;
  for(var i = 0, tdlen = tdArr.length; i < tdlen;i++) {
    index = index === trNum ? 0 : index;
    trArr[index++].push(tdArr[i])
  }
}

function getTrNum(list) {
  var count = 0;
  (function(list) {
    for (var name in list) {
      ++count;
      if (objKeyNum(list[name].sub) !== 0) {
        arguments.callee(list[name].sub)
      }
    }
  })(list)
  return count;
}

function isInteger(num) {
  return Math.floor(num) === num;
}

function parseList(list) {
  var ttid = 1,
    parentid = undefined;
  for (var name in list) {
    parseColumn(name, list[name], ttid++, parentid);
  }
}

function parseColumn(name, column, ttid, parentid) {
  var td = {
    name: name,
    ttid: ttid,
    parentid: parentid
  };
  tdExtend(td, column);
  tdArr.push(td);
  var list = column.sub;
  if (objKeyNum(list) !== 0) {
    var parentid = ttid,
      ttid = 1;
    for (var name in list) {
      parseColumn(name, list[name], ttid++, parentid)
    }
  }
}

function tdExtend(td, column) {
  for (var name in column) {
    if (name !== 'sub') {
      td[name] = column[name]
    }
  }
}

function objKeyNum(obj) {
  var count = 0;
  for (var key in obj) {
    ++count;
  }
  return count;
}
//id都是直接加到tr上的，也就是说td里面除了name,parentid, ttid之外的都是附加到tr上;下面的方式有问题啊，在对象里面是不能有同名key值的，不然会覆盖的，怎么玩；可以换成数组吧。
var lists = [{
  login: {
    id: 1,
    ppka: 'some data after',
    sub: {
      loginSub1: {
        id: 11,
        sub: {}
      },
      loginSub2: {
        id: 3,
        sub: {}
      }
    }
  },
  logout: {
    id: 2,
    sub: {}
  }
}, {
  dir: {
    sub: {
      file: {
        id: 2,
        sub: {}
      },
      file2: {
        id: 3,
        sub: {}
      }
    }
  },
  file: {
    id: 1,
    sub: {}
  }
}];

console.log(parseLists(lists))
