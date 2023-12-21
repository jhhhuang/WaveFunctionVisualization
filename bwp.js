const startBtn = document.getElementById('start-btn')
const stopBtn = document.getElementById('stop-btn')
let websocket

// get parameters
const U0El = document.getElementById('U0')
const aEl = document.getElementById('a')
const pwEl = document.getElementById('pw')
const E0El = document.getElementById('E0')

const maskEl = document.querySelector('.mask')

let myEchart = echarts.init(document.getElementById('chart2'))

let running = false

startBtn.onclick = () => {
    if (running) {
        alert('正在运行中, 请先结束')
        return
    }
    running = true
    if (!U0El.value || !aEl.value || !pwEl.value) {
        alert('请输入参数')
        return
    }

    maskEl.style.display = 'flex'

    websocket = new WebSocket('ws://localhost:8888/')

    websocket.onopen = () => {
        console.log('WebSocket 连接成功.')

        // send parameters to Python

        websocket.send(
            JSON.stringify({
                plot: 'bwp',
                type: 'start',
                U0: Number(U0El.value),
                a: Number(aEl.value),
                pw: Number(pwEl.value),
                E0: Number(E0El.value)
            })
        )
    }
    websocket.onmessage = event => {
        const data = JSON.parse(event.data)

        maskEl.style.display = 'none'
        renderEcharts(data)
    }
}

stopBtn.onclick = () => {
    running = false
    if (websocket) {
        websocket.send(
            JSON.stringify({
                type: 'stop'
            })
        )
        websocket.close()
        console.log('WebSocket 连接关闭.')
        websocket = null
    }
}


// plot setup
const renderEcharts = data => {
    const option = {
        title: {
            text: data.title,
            left: 'center'
        },
        xAxis: {
            min: -40,
            max: 40,
            interval: 10,
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            }
        },
        yAxis: {
            max: 1,
            min: 0,
            interval: 0.2,
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            }
        },
        series: [
            {
                data: data.line2,
                animation: false,
                showSymbol: false,
                color: '#598dbd',
                type: 'line'
            },
            {
                data: data.line1,
                animation: false,
                showSymbol: false,
                color: '#f09040',
                type: 'line',
                smooth: true
            }
        ]
    }

    myEchart.setOption(option)
}