let protonBtn = document.createElement('button');
protonBtn.innerHTML = '+';
document.body.appendChild(protonBtn);

let electronBtn = document.createElement('button');
electronBtn.innerHTML = '-';
document.body.appendChild(electronBtn);

//open and connect socket to the inputs namespace on the server
let socket = io('/input');

socket.on('connect', function () {
    console.log('connected');
});

protonBtn.addEventListener('click', function () {
    console.log('input.js: proton is emitted')
    socket.emit('atom', {
        charge: 1,
    })
});

electronBtn.addEventListener('click', function () {
    console.log('input.js: electron is emitted')
    socket.emit('atom', {
        charge: -1,
    })
});


