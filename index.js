'use strict';

// 把html字符串转换成对应的json字符串
// 元素匹配时不区分tagName的大小写，统一转换成小写；
// 可以配置 tagMap 指定对应的小写tagName输出的tagName
const parseHtml = function (source, options) {
  // 整个html代码由 开始块、普通文本块、结束块、注释 构成，逐个解析
  // 第二部分正则用于匹配script，由于开始块模式是匹配脚本的正则的前缀，所以优先匹配脚本
  const rblock = /([^<>]+)|<\/([\w_-]+)|(<!--(?:(?:[\s\S](?!-->))*[\s\S])?-->)|(<script(\s[^>]*)?>((?:(?:[\s\S](?!<\/script>|$))*[\s\S]){0,1}?)(?:<\/script>|$))|<([\w_-]+)(?:|\s+([^>]*[^\s\/]))\s*\/?>/gi;

  const rattr = /([\w-]+)\s{0,}(=\s{0,}(?:'([^'']*)'|"([^"]*)"|(\S+))){0,1}/g;

  const rtrim = /^\s+|\s+$/g;

  // 匹配样式属性及值
  const rStylePart = /([\w-]*)\s*:\s*([^;]+)/g;

  // 在源代码外面包一层div(使用数组结构表示存储信息，分别为tagName，attrs，children)
  const rootNode = ['#root', null, []];

  let currentOpenedNode = rootNode;

  let match = null,
    attrName,
    attrVal;
  const stack = []; // 存储当前节点所有父节点的队列

  const camelCase = function (str) {
    const words = str.split(/-/);
    return words.reduce((result, word, index) => {
      if (!word) return result;

      word = word.toLowerCase();
      return result + (index ? (word.charAt(0).toUpperCase() + word.slice(1)) : word);
    }, '');
  };
  const defalutMap = function(str) {
    return (str || '').toLowerCase();
  }
  // 处理选项
  const opts = options || {};
  const parseStyle = opts.parseStyle !== false;
  const ignoreScript = opts.ignoreScript !== false;
  const ignoreComment = opts.ignoreComment !== false;

  // 属性映射，可配置
  const attrMap = opts.attrMap || defalutMap;
  // 元素名称map，解析时忽略tagName大小写，这个map用于调整输出的tagName
  const tagMap = opts.tagMap || defalutMap;

  // 自闭合标签，可自定义扩展元素 (tagName is case insensitive)
  let selfClosingTags = [].concat(opts.customSelfClosingTags || [], opts.selfClosingTags || Object.keys({
    meta: true,
    link: true,
    base: true,
    input: true,
    img: true,
    hr: true,
    br: true,
    embed: true,
    param: true,
    source: true,
    option: true,
    col: true,
    area: true,
  })).map(item => item.toLowerCase());

  // 解析元素的属性
  const parseAttrs = function(strAttrs) {
    if (!strAttrs) {
      return null;
    }

    const attrs = {};
    let attrCounter = 0;
    let attrMatch;
    while (attrMatch = rattr.exec(strAttrs)) {
      ++attrCounter;
      const originalAttrName = attrMatch[1];
      // 获取属性名称
      let name = originalAttrName;
      if (typeof attrMap === 'function') {
        name = attrMap(name);
      } else if (typeof attrMap === 'object') {
        name = attrMap[name] || name;
      }

      // 属性值为空认为是boolean属性
      attrVal = attrMatch[2] ? (attrMatch[3] || attrMatch[4] || attrMatch[5]) : true;

      if (parseStyle && originalAttrName.toLowerCase() === 'style') {
        // 把对应的样式转换为等价的js对象
        const attrValObj = {};
        let styleAttrCounter = 0;
        let styleAttr,
          styleAttrVal;
        let styleMatch;

        while (styleMatch = rStylePart.exec(attrVal)) {
          ++styleAttrCounter;
          styleAttr = camelCase(styleMatch[1]);
          styleAttrVal = styleMatch[2];

          attrValObj[styleAttr] = styleAttrVal;
        }
        if (styleAttrCounter) {
          attrVal = attrValObj;
        }
      }

      attrs[name] = attrVal;
    }
    return attrs;
  };
  // 获取tagName
  const getTagName = function(originalTagName) {
    let name = originalTagName;

    if (typeof tagMap === 'function') {
      name = tagMap(name);
    } else if (typeof tagMap === 'object') {
      name = tagMap[name] || name;
    }
    return name;
  };

  while (match = rblock.exec(source)) {
    if (match[1]) { // 匹配纯文本
      // 忽略首位的空白字符
      const text = match[1].replace(rtrim, '');
      if (text) {
        currentOpenedNode[2] = currentOpenedNode[2] || [];
        currentOpenedNode[2].push(text);
      }
    } else if (match[7]) { // 匹配开始标签
      // 创建新的节点,并作为当前节点
      const originalTagName = match[7];
      const newNode = [getTagName(originalTagName)];
      newNode[1] = parseAttrs(match[8]);
      currentOpenedNode[2] = currentOpenedNode[2] || [];
      currentOpenedNode[2].push(newNode);

      if (selfClosingTags.indexOf(originalTagName.toLowerCase()) === -1) {
        stack.push(currentOpenedNode);
        currentOpenedNode = newNode;
      }
    } else if (match[2]) { // 关闭标签
      // 如果当前节点为根节点，或者关闭的元素和当前节点不匹配，说明此时的闭合标签是多余的，直接忽略
      // 否则关闭当前节点，其父节点成为当前节点
      if (currentOpenedNode !== rootNode
        && getTagName(match[2]) === currentOpenedNode[0]) {
        currentOpenedNode = stack.pop();
      }
    } else if (match[4]) { // 匹配到脚本节点
      if (!ignoreScript) {
        const scriptNode = [getTagName('script')];
        scriptNode[1] = parseAttrs(match[5]);
        if (match[6]) {
          scriptNode[2] = [match[6]];
        }
        currentOpenedNode[2] = currentOpenedNode[2] || [];
        currentOpenedNode[2].push(scriptNode);
      }
    } else if (match[3]) {
      if (!ignoreComment) {
        const comment = match[3].slice(4, match[3].length - 3);
        currentOpenedNode[2] = currentOpenedNode[2] || [];
        currentOpenedNode[2].push(['#comment', {text: comment}]);
      }
    } else {
      throw `match error! matched: ${match[0]}`;
    }
  }

  // 返回节点数组
  return rootNode[2];
};


module.exports = parseHtml;
