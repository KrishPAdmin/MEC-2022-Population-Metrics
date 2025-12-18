const data = {
labels: country,
datasets: [{
    label: 'Country Growth Rate in 2030 (%)',
    data: gr,
    backgroundColor: ['#004bbc'],
    borderColor: ['rgba(255, 26, 104, 1)'],
    borderWidth: 1,
    yAxisID: 'percent'
},
{
    label: 'Total Country Population in 2030 (in thousands)',
    data: pop,
    backgroundColor: ['#FF451D'],
    borderColor: ['rgba(255, 26, 104, 1)'],
    borderWidth: 1,
    yAxisID: 'population'
}]
};
const config = {
type: 'bar',
data,
options: {
    scales: {
        percent:{
            type: 'linear',
            position: 'left',
            grid:{
                display: false
            }
        },
        population:{
            type: 'linear',
            position: 'right'
        }
    }
}
};


const myChart = new Chart(
    document.getElementById('myChart'),
    config
    );