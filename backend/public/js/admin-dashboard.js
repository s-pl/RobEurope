// Simple D3 bar chart for stats passed via data attributes
(function() {
  const el = document.getElementById('stats-chart');
  if (!el) return;
  const data = JSON.parse(el.getAttribute('data-stats'));
  const entries = Object.entries(data).map(([k,v]) => ({ label: k, value: v }));

  const width = 420;
  const height = 200;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  const svg = d3.select(el)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .classed('w-full', true);

  const x = d3.scaleBand()
    .domain(entries.map(d => d.label))
    .range([margin.left, width - margin.right])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(entries, d => d.value) || 1])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg.append('g')
    .selectAll('rect')
    .data(entries)
    .enter()
    .append('rect')
    .attr('x', d => x(d.label))
    .attr('y', d => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', d => y(0) - y(d.value))
    .attr('rx', 4)
    .attr('fill', '#1d7fe6');

  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('font-size', '10px');

  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5))
    .selectAll('text')
    .style('font-size', '10px');
})();