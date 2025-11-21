// Dashboard bar chart using local D3 (served from /vendor/d3.min.js)
(function(){
  const root = document.getElementById('stats-chart');
  if(!root || typeof d3 === 'undefined') return;
  let data;
  try { data = JSON.parse(root.getAttribute('data-stats')); } catch(e){ return; }
  const entries = Object.entries(data).map(([k,v]) => ({ label:k, value: v }));

  const width = root.clientWidth || 520;
  const height = 220;
  const margin = { top: 10, right: 10, bottom: 30, left: 45 };

  const svg = d3.select(root)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('class','chart-svg')
    .style('width','100%')
    .style('height','100%');

  const x = d3.scaleBand()
    .domain(entries.map(d=>d.label))
    .range([margin.left, width - margin.right])
    .padding(0.35);
  const y = d3.scaleLinear()
    .domain([0, d3.max(entries, d=>d.value) || 1])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg.append('g')
    .selectAll('rect')
    .data(entries)
    .enter()
    .append('rect')
    .attr('x', d=>x(d.label))
    .attr('y', d=>y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', d=>y(0) - y(d.value))
    .attr('rx', 5)
    .attr('fill', 'var(--accent)')
    .append('title')
    .text(d=>`${d.label}: ${d.value}`);

  const xAxis = g => g
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .call(g => g.select('.domain').attr('stroke','var(--border)'));

  const yAxis = g => g
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5))
    .call(g => g.select('.domain').attr('stroke','var(--border)'));

  svg.append('g').call(xAxis);
  svg.append('g').call(yAxis);
})();