'use strict'

const http = require('http')
const SocketIO = require('socket.io')

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

const read = (socket, format) => new Promise((resolve, reject) => {
    if (!format) {
        throw new Error('argument format is required')
    }
    
    socket.once('data', (data) => {
        if (!data) {
            return reject(data)
        }
        
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
//     socket.setTimeout(socket_timeout)
    
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
let server_handler = null

const self = {
    configure: (options) => new Promise((resolve) => {
        server_port = options.port || server_port
        server_handler = options.handle || server_handler
        socket_timeout = options.socketTimeout || socket_timeout
        
        resolve()
    }),
    open: () => new Promise((resolve, reject) => {
        if (server) {
            return reject(new Error('The server is already open'))
        }
        
        server = http.createServer(server_handler)
        
        const io = SocketIO(server)
        
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log('Address in use, retrying...')
                
                return setTimeout(() => {
                    server.close()
                    server.listen(server_port)
                }, 1000)
            }
            
            reject(err)
        })
        
        server.on('connect', () => {
            process.on('SIGINT', self.close)
        })
        
        server.listen(server_port, () => {
            console.log('opened server on', server.address())
        })
        
        io.on('connection', (socket) => {
            console.log('new user')
            configure(socket)
            resolve(socket)
        })
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
