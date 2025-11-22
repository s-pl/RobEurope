// System Logs Page - Charts and Filters
async function loadLogsCharts() {
  try {
    const response = await fetch('/admin/api/logs-stats');
    const data = await response.json();
    renderActionsChart(data.byAction);
    renderEntitiesChart(data.byEntity);
  } catch (error) {
    console.error('Error loading logs stats:', error);
  }
}

function renderActionsChart(data) {
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const width = 300 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = d3.select('#actionsChart')
    .attr('viewBox', `0 0 300 300`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleBand()
    .domain(data.map(d => d.action))
    .range([0, width])
    .padding(0.3);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count)])
    .range([height, 0]);

  const actionColors = {
    'CREATE': '#10b981',
    'UPDATE': '#0ea5e9',
    'DELETE': '#ef4444',
    'LOGIN': '#06b6d4',
    'LOGOUT': '#f59e0b',
    'REGISTER': '#8b5cf6'
  };

  g.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.action))
    .attr('y', d => yScale(d.count))
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - yScale(d.count))
    .attr('fill', d => actionColors[d.action] || '#0ea5e9');

  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .style('font-size', '0.75rem');

  g.append('g')
    .call(d3.axisLeft(yScale))
    .style('font-size', '0.75rem');
}

function renderEntitiesChart(data) {
  const width = 300;
  const height = 300;
  const radius = Math.min(width, height) / 2 - 40;

  const svg = d3.select('#entitiesChart')
    .attr('viewBox', `0 0 300 300`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);

  const pie = d3.pie().value(d => d.count);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  const colors = window.chartUtils.colors;

  g.selectAll('.pie-slice')
    .data(pie(data))
    .enter()
    .append('path')
    .attr('class', 'pie-slice')
    .attr('d', arc)
    .attr('fill', (d, i) => colors[i % colors.length])
    .style('stroke', '#0f172a')
    .style('stroke-width', 2);

  g.selectAll('.label')
    .data(pie(data))
    .enter()
    .append('text')
    .attr('transform', d => `translate(${arc.centroid(d)})`)
    .attr('dy', '.35em')
    .style('text-anchor', 'middle')
    .style('fill', '#fff')
    .style('font-size', '0.7rem')
    .style('font-weight', 'bold')
    .text(d => d.data.count);
}

function resetLogFilters() {
  const searchLog = document.getElementById('searchLog');
  const actionFilter = document.getElementById('actionFilter');
  
  if (searchLog) searchLog.value = '';
  if (actionFilter) actionFilter.value = '';
  applyLogFilters();
}

function applyLogFilters() {
  const searchInput = document.getElementById('searchLog');
  const actionFilterElement = document.getElementById('actionFilter');
  
  const searchTerm = searchInput?.value.toLowerCase() || '';
  const actionFilter = actionFilterElement?.value || '';

  document.querySelectorAll('.log-row').forEach(row => {
    const search = row.dataset.search;
    const action = row.dataset.action;

    let show = true;
    if (searchTerm && !search.includes(searchTerm)) show = false;
    if (actionFilter && action !== actionFilter) show = false;

    row.style.display = show ? '' : 'none';
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const searchLog = document.getElementById('searchLog');
  const actionFilter = document.getElementById('actionFilter');

  if (searchLog) searchLog.addEventListener('keyup', applyLogFilters);
  if (actionFilter) actionFilter.addEventListener('change', applyLogFilters);

  loadLogsCharts();
});
