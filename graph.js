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

function bestFit(xVals, yVals) {
  let n = 0;
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;

  for (let i = 0; i < xVals.length; i++) {
    const x = xVals[i];
    const y = yVals[i];
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

    n++;
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

  let idxName = header.indexOf("Region, subregion, country or area *");
  let idxPop = header.indexOf("Total Population, as of 1 January (thousands)");
  let idxNat = header.indexOf("Rate of Natural Change (per 1,000 population)");
  let idxGrowth = header.indexOf("Population Growth Rate (percentage)");
  let idxMig = header.indexOf("Net Migration Rate (per 1,000 population)");

  if (idxName === -1) idxName = 0;
  if (idxPop === -1) idxPop = 2;
  if (idxNat === -1) idxNat = 3;
  if (idxGrowth === -1) idxGrowth = 4;
  if (idxMig === -1) idxMig = 5;

  const yearVals = [];
  for (let i = 0; i < 72; i++) yearVals.push(1950 + i);

  const map = new Map();
  const seenCount = new Map();
  let orderCounter = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 6) continue;

    const rawName = cols[idxName] ?? "";
    const name = rawName.replace(/[^A-Za-z0-9]+/g, "_");

    if (!map.has(name)) {
      map.set(name, { order: orderCounter++, pop: [], growth: [], migration: [] });
      seenCount.set(name, 0);
    }

    const idx = seenCount.get(name);
    if (idx >= 72) continue;
    seenCount.set(name, idx + 1);

    const popVal = parseFloat(cols[idxPop]);
    const natVal = parseFloat(cols[idxNat]);
    const growthVal = parseFloat(cols[idxGrowth]);
    const migVal = parseFloat(cols[idxMig]);

    map.get(name).pop[idx] = popVal;
    map.get(name).growth[idx] = growthVal;

    if (Number.isFinite(natVal) && Number.isFinite(migVal)) {
      map.get(name).migration[idx] = (natVal + migVal) / 10;
    } else {
      map.get(name).migration[idx] = growthVal;
    }
  }

  const rows = [];

  for (const [name, rec] of map.entries()) {
    const gFit = bestFit(yearVals, rec.growth);
    const mFit = bestFit(yearVals, rec.migration);

    const averageSlope = (gFit.slope + mFit.slope) / 2;
    const averageIntercept = (gFit.intercept + mFit.intercept) / 2;

    const g2030 = averageSlope * 2030 + averageIntercept;

    let lastPop = rec.pop[rec.pop.length - 1];
    const gConst = averageSlope * (2022 + rec.order) + averageIntercept;

    for (let j = 0; j < 9; j++) {
      lastPop = lastPop + lastPop * (gConst / 100);
    }

    rows.push({ name, growth: g2030, population: lastPop });
  }

  rows.sort((a, b) => b.growth - a.growth);
  const top10 = rows.slice(0, 10);

  const country = top10.map(r => r.name);
  const gr = top10.map(r => r.growth);
  const pop = top10.map(r => r.population);

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
