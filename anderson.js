const startBtn2 = document.getElementById('start-btn2')
const stopBtn2 = document.getElementById('stop-btn2')
let websocket2

// get parameters
const dsEl = document.getElementById('ds')


let myEchart2_1 = echarts.init(document.getElementById('chart3_1'))
let myEchart2_2 = echarts.init(document.getElementById('chart3_2'))

let running2 = false

startBtn2.onclick = () => {
    if (running2) {
        alert('正在运行中, 请先结束')
        return
    }
    running2 = true
    if (!dsEl.value) {
        alert('请输入参数')
        return
    }

    maskEl.style.display = 'flex'

    websocket2 = new WebSocket('ws://localhost:8888/')

    websocket2.onopen = () => {
        console.log('WebSocket2 连接成功.')

        // send parameters to Python

        websocket2.send(
            JSON.stringify({
                plot: 'anderson',
                type2: 'start',
                disorder_strength: Number(dsEl.value)
            })
        )
    }
    websocket2.onmessage = event => {
        const data = JSON.parse(event.data)

        maskEl.style.display = 'none'
        renderEcharts2_1(data)
        renderEcharts2_2(data)
        // console.log(data)
    }
}

stopBtn2.onclick = () => {
    running2 = false
    if (websocket2) {
        websocket2.send(
            JSON.stringify({
                type2: 'stop'
            })
        )
        websocket2.close()
        console.log('WebSocket2 连接关闭.')
        websocket2 = null
    }
}


// plot setup
const renderEcharts2_1 = data => {
    const option1 = {
        title: {
            text: "periodic, "+data.title,
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
                data: data.line3,
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

    myEchart2_1.setOption(option1)
};
const renderEcharts2_2 = data => {
    const option2 = {
        title: {
            text: "disordered, "+data.title,
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
                data: data.line4,
                animation: false,
                showSymbol: false,
                color: '#598dbd',
                type: 'line'
            },
            {
                data: data.line2,
                animation: false,
                showSymbol: false,
                color: '#f09040',
                type: 'line',
                smooth: true
            }
        ]
    }

    myEchart2_2.setOption(option2)
}