'use strict'

const net = require('net')

const STR_CLOSE = '__CLOSE__'
const SOCKET_TIMEOUT = 60 * 1000 * 10 // 10 min

let server = null
let socket_timeout = SOCKET_TIMEOUT

let handle_before_end = []
const call_handle_before_end = () => {
    handle_before_end.forEach((handle) => {
        handle()
    })
}
const close_socket = (socket) => () => {
    call_handle_before_end()
    setTimeout(() => socket.end(), 1000)
}

console.log(`Client should send ${STR_CLOSE} to close his connection`)
console.log('Press Ctrl+C to exit\n')




const app = require('http').createServer()
const io = require('socket.io')(app)

const read = (socket, format) => new Promise((resolve, reject) => {
    if (!format) {
        throw new Error('argument format is required')
    }
    
    socket.once('data', (data) => {
        data = data.toString().trim()
        
        if (data === STR_CLOSE) {
            return close_socket(socket)
        }
        
        if (format.test(data)) {
            resolve(data)
        } else {
            reject(data)
        }
    })
})

const configure = (socket) => {
    process.on('SIGINT', close_socket(socket))
    
    socket.println = (text) => socket.emit('message', text + '\r\n')
    
    socket.on('end', () => console.log('socket closed'))
    socket.on('timeout', close_socket(socket))
    socket.setTimeout(socket_timeout)
    
    socket.ask = (question, format = /.+/) => new Promise((resolve, reject) => {
        socket.write(question)
        read(socket, format)
            .then(resolve)
            .catch(reject)
    })
    
    socket.before = (event, callback) => {
        switch (event) {
            case 'end':
                handle_before_end.push(callback)
                break
        }
    }
}

let server_port = 9911

const self = {
    configure: (options) => new Promise((resolve) => {
        server_port = options.port || server_port
        server_name = options.host || server_name
        socket_timeout = options.socketTimeout || socket_timeout
        
        resolve()
    }),
    open: () => new Promise((resolve, reject) => {
        if (server) {
            return reject(new Error('The server is already open'))
        }
        
        app.listen(server_port)
        
        io.on('connection', (socket) => {
            configure(socket)
            resolve(socket)
        })
        
//         server = net.createServer((socket) => {
//             configure(socket)
//             resolve(socket)
//         }).on('error', (err) => {
//             if (err.code === 'EADDRINUSE') {
//                 console.log('Address in use, retrying...')
//                 
//                 return setTimeout(() => {
//                     server.close()
//                     server.listen(server_port, server_name)
//                 }, 1000)
//             }
//             
//             reject(err)
//         })
//         
//         server.on('connect', () => {
//             process.on('SIGINT', self.close)
//         })
//         
//         server.listen(server_port, server_name, () => {
//             console.log('opened server on', server.address())
//         })
    }),
    close: () => new Promise((resolve, reject) => {
        server.close((err) => {
            if (err) {
                return reject(err)
            }
            
            resolve()
        })
        
    })
}

module.exports = self
