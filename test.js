const parseHtml = require('./index');

const source = `<P style="background-color: #red; position: relative;  width: 456px" data-index="123 asf奥斯丁阿萨 奥斯丁f" data-INDEX="456" custom-attr-name="46t"   checked href=\'1232 asdf \' alt = hello    >
    <!--asdf-->  aaa   \n\rbbbb  \tcccc    \n\r\t<br/> sdfsa
    <input data-index="123d" type=text />
  </p>
  <img src="imageurl" alt="345">
  <a>bbb
    <span>111ccc
      <_CustomTagName>12312</_CustomTagName>
        <script src="asdfs.js"></script>
    </span>
    <div><script>
      var a = '123';
      var arr = [];
      arr.push('<a>12112</a>'); // test a tag
    </script>
    </div>
  `;
console.log(JSON.stringify(parseHtml(source, {
  parseStyle: true,
  ignoreScript: false,
  ignoreComment: false,
  tagMap: {
    _customtagname: 'ACustomElementName', // custom tags map
  },
  attrMap: function(attrName) {// camelize
    const words = attrName.split(/-/);
    return words.reduce((result, word, index) => {
      if (!word) return result;

      word = word.toLowerCase();
      return result + (index ? (word.charAt(0).toUpperCase() + word.slice(1)) : word);
    }, '');
  }
}), null, 2));
