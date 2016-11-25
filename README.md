# bot-interface-socket.io

A socket interface for your bot (ibot)

## Install

```sh
npm install --save bot-interface-socket.io
```

## Usage

```js
// server.js

const iSocketIO = require('bot-interface-socket.io')
const bot = require('./lib/your-ibot')

bot.configure({
    interface: iSocketIO
})

process.on('SIGINT', () => {
    bot.exit()
    process.exit()
});

bot.run()
```

```js
// index.html

<script src="/socket.io/socket.io.js"></script>
<script>
  var socket = io('http://localhost:9911');
  socket.on('message', function (message) {
    console.log(data);
    socket.emit('data', 'hello');
  });
</script>
```

## License

Under the MIT license. See [LICENSE](https://github.com/demsking/bot-interface-socket.io/blob/master/LICENSE) file for more details.
