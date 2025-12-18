function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out;
}

function lineBestFitFromIndex(yVals) {
  const n = yVals.length;
  const startYear = 1950;

  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;

  for (let i = 0; i < n; i++) {
    const x = startYear + i;
    const y = yVals[i];

    sumX += x;
    sumY += y;
    sumXX += x * x;
    sumXY += x * y;
  }

  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = n === 0 ? 0 : (sumY - slope * sumX) / n;

  return { slope, intercept };
}

async function buildChart() {
  const res = await fetch("./data.csv");
  const text = await res.text();
  const lines = text.replace(/\r/g, "").trim().split("\n");
  if (lines.length < 2) return;

  const header = parseCsvLine(lines[0]);

  const idxName = header.indexOf("Region, subregion, country or area *");
  const idxPop = header.indexOf("Total Population, as of 1 January (thousands)");
  const idxNat = header.indexOf("Rate of Natural Change (per 1,000 population)");
  const idxGrowth = header.indexOf("Population Growth Rate (percentage)");
  const idxMig = header.indexOf("Net Migration Rate (per 1,000 population)");

  const map = new Map();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < header.length) continue;

    const rawName = cols[idxName] ?? "";
    const name = rawName.replace(/[^A-Za-z0-9]+/g, "_");

    const popVal = parseFloat(cols[idxPop]);
    const natVal = parseFloat(cols[idxNat]);
    const growthVal = parseFloat(cols[idxGrowth]);
    const migVal = parseFloat(cols[idxMig]);

    if (!isFinite(popVal) || !isFinite(natVal) || !isFinite(growthVal) || !isFinite(migVal)) continue;

    if (!map.has(name)) {
      map.set(name, { growth: [], mig: [], pop: [] });
    }

    const rec = map.get(name);
    rec.growth.push(growthVal);
    rec.mig.push((natVal + migVal) / 10);
    rec.pop.push(popVal);
  }

  const rows = [];

  for (const [name, rec] of map.entries()) {
    if (!rec.growth.length || !rec.mig.length || !rec.pop.length) continue;

    const gFit = lineBestFitFromIndex(rec.growth);
    const mFit = lineBestFitFromIndex(rec.mig);

    const averageSlope = (gFit.slope + mFit.slope) / 2;
    const averageIntercept = (gFit.intercept + mFit.intercept) / 2;

    let lastPop = rec.pop[rec.pop.length - 1];

    for (let year = 2022; year <= 2030; year++) {
      const g = averageSlope * year + averageIntercept;
      lastPop = lastPop + lastPop * (g / 100);
    }

    const g2030 = averageSlope * 2030 + averageIntercept;

    rows.push({
      name,
      growth: g2030,
      population: lastPop
    });
  }

  rows.sort((a, b) => b.growth - a.growth);
  const top10 = rows.slice(0, 10);

  const country = top10.map(r => r.name);
  const gr = top10.map(r => Number(r.growth.toFixed(3)));
  const pop = top10.map(r => Number(r.population.toFixed(3)));

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
        percent: {
          type: 'linear',
          position: 'left',
          grid: {
            display: false
          }
        },
        population: {
          type: 'linear',
          position: 'right'
        }
      }
    }
  };

  new Chart(
    document.getElementById('myChart'),
    config
  );
}

window.addEventListener("load", buildChart);
