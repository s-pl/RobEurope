// Users Page - Charts and Filters
const usersData = window.usersDataGlobal || [];

// Calcular estadísticas
function calculateStats() {
  const stats = {
    byRole: {},
    byStatus: {}
  };

  usersData.forEach(u => {
    // Por rol
    stats.byRole[u.role] = (stats.byRole[u.role] || 0) + 1;
    
    // Por estado
    const status = u.is_active ? 'Activos' : 'Inactivos';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
  });

  return stats;
}

// Gráfica: Distribución de roles
function renderRoleDistribution() {
  const stats = calculateStats();
  const data = Object.entries(stats.byRole).map(([role, count]) => ({
    role: role === 'super_admin' ? '👑 Admin' : '👤 Usuario',
    count
  }));

  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const width = 300 - margin.left - margin.right;
  const height = 250 - margin.top - margin.bottom;

  const svg = d3.select('#userRoleDistribution')
    .attr('viewBox', `0 0 300 250`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleBand()
    .domain(data.map(d => d.role))
    .range([0, width])
    .padding(0.4);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count)])
    .range([height, 0]);

  const colors = ['#0ea5e9', '#f59e0b'];

  g.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.role))
    .attr('y', d => yScale(d.count))
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - yScale(d.count))
    .attr('fill', (d, i) => colors[i])
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).style('opacity', 0.8);
    })
    .on('mouseout', function() {
      d3.select(this).style('opacity', 1);
    });

  // Valores en barras
  g.selectAll('.bar-label')
    .data(data)
    .enter()
    .append('text')
    .attr('x', d => xScale(d.role) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.count) - 5)
    .attr('text-anchor', 'middle')
    .style('fill', '#e2e8f0')
    .style('font-weight', 'bold')
    .text(d => d.count);

  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .style('font-size', '0.85rem');

  g.append('g')
    .call(d3.axisLeft(yScale))
    .style('font-size', '0.85rem');
}

// Gráfica: Estados de usuarios
function renderStatusChart() {
  const stats = calculateStats();
  const data = Object.entries(stats.byStatus).map(([status, count]) => ({ status, count }));

  const width = 300;
  const height = 250;
  const radius = Math.min(width, height) / 2 - 40;

  const svg = d3.select('#userStatusChart')
    .attr('viewBox', `0 0 300 250`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);

  const pie = d3.pie().value(d => d.count);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  const statusColors = {
    'Activos': '#10b981',
    'Inactivos': '#ef4444'
  };

  g.selectAll('.pie-slice')
    .data(pie(data))
    .enter()
    .append('path')
    .attr('class', 'pie-slice')
    .attr('d', arc)
    .attr('fill', d => statusColors[d.data.status])
    .style('stroke', '#0f172a')
    .style('stroke-width', 2);

  // Etiquetas
  g.selectAll('.label')
    .data(pie(data))
    .enter()
    .append('text')
    .attr('transform', d => `translate(${arc.centroid(d)})`)
    .attr('dy', '.35em')
    .style('text-anchor', 'middle')
    .style('fill', '#fff')
    .style('font-size', '0.75rem')
    .style('font-weight', 'bold')
    .text(d => d.data.count);
}

// Funciones de filtrado
function applyFilters() {
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const roleFilter = document.getElementById('roleFilter')?.value || '';
  const statusFilter = document.getElementById('statusFilter')?.value || '';

  document.querySelectorAll('.user-row').forEach(row => {
    const search = row.dataset.search;
    const role = row.dataset.role;
    const active = row.dataset.active;

    let show = true;

    if (searchTerm && !search.includes(searchTerm)) show = false;
    if (roleFilter && role !== roleFilter) show = false;
    if (statusFilter && active !== statusFilter) show = false;

    row.style.display = show ? '' : 'none';
  });
}

function resetFilters() {
  const searchInput = document.getElementById('searchInput');
  const roleFilter = document.getElementById('roleFilter');
  const statusFilter = document.getElementById('statusFilter');
  
  if (searchInput) searchInput.value = '';
  if (roleFilter) roleFilter.value = '';
  if (statusFilter) statusFilter.value = '';
  applyFilters();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const roleFilter = document.getElementById('roleFilter');
  const statusFilter = document.getElementById('statusFilter');

  if (searchInput) searchInput.addEventListener('keyup', applyFilters);
  if (roleFilter) roleFilter.addEventListener('change', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);

  renderRoleDistribution();
  renderStatusChart();
});
