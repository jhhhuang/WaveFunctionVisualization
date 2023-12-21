const pltBtn = document.getElementById('plot-btn');



var dom = document.getElementById('chart1');
var myChart = echarts.init(dom, null, {
    renderer: 'canvas',
    useDirtyRect: false
});

pltBtn.onclick = () => {
    var U0 = document.getElementById('U0').value;
    var a = document.getElementById('a').value;
    var pw = document.getElementById('pw').value;
    var E0 = document.getElementById('E0').value;

    var data1 = kp_dispersion(U0, a, pw);
    var xmin = -3.14/(a*pw);
    var xmax = 3.14/(a*pw);
    var data2 = [[xmin,E0],[xmax,E0]];


    var option;
    option = {
        xAxis: {
            min: xmin,
            max: xmax,
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            }
        },
        yAxis: {
            min: 0.5 * U0,
            max: 2 * U0,
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            }
        },
        series: [
            {
                animation:false,
                data: data1,
                showSymbol: false,
                type: 'line',
                lineStyle: {
                    color: '#5470C6',
                    width: 5
                },
            },
            {
                animation:false,
                data: data2,
                showSymbol: false,
                type: 'line',
                lineStyle: {
                    color: '#f09040',
                    width: 2
                },
            },

        ],
        animation: {
            duration: 0
        }
    };
    myChart.setOption(option);

}
