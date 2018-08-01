# html2json
a js tool parsing html to json.


install
=======
```
npm install '@lizc/html2json'
```


[show example](./test.js)
========
  [show result](./test.log.json)


options
=========
```
parseStyle @boolean default false
  whether parse style attr in element.
```

```
ignoreScript @boolean default true

  if set false, the script's text will be the only child of the script node.

```

```
ignoreComment @boolean default true

  if set false, a comment node which own a tagName '#comment' and has only a text attr will output.
```


```
tagMap @object or @function
  describe a tagName map relationship
  {
    _acustomelement: 'CustomAnyTagName'
  }

  or

  function(tagName) {return newTagName}

  default: function(name) {
    return (name||'').toLowerCase();
  }
```


```
attrMap @object or @function  
  describe a attr map relationship
  {
    'tabindex': 'tabIndex'
  }

  or

  function(attrName) {return newAttrName}


  default: function(name) {
    return (name||'').toLowerCase();
  }
```

```
nocloseTags @array[string]
describle which element is self closed(means which do not need a close tag).
default value:  all self close element in html, example input, link and so on.
```

```
customNoCloseTags @array[string]
add custom self closed element.
```


[Licence](./LICENSE)
======
