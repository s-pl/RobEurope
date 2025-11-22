// Competitions Page - Charts
function waitForDependencies(callback) {
  if (typeof d3 !== 'undefined' && typeof window.chartUtils !== 'undefined') {
    callback();
  } else {
    setTimeout(() => waitForDependencies(callback), 100);
  }
}

async function loadCompetitionChart() {
  try {
    const response = await fetch('/admin/api/competitions-stats');
    const data = await response.json();
    renderCompetitionChart(data);
  } catch (error) {
    console.error('Error loading competition stats:', error);
  }
}

function renderCompetitionChart(data) {
  if (!data || data.length === 0) {
    document.getElementById('competitionChart').innerHTML = '<text y="50" text-anchor="middle" fill="#94a3b8">No hay datos disponibles</text>';
    return;
  }

  const margin = { top: 20, right: 30, bottom: 60, left: 60 };
  const width = window.innerWidth > 768 ? 1100 - margin.left - margin.right : 300 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select('#competitionChart')
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleBand()
    .domain(data.map(d => d.title))
    .range([0, width])
    .padding(0.3);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.registrations)])
    .range([height, 0]);

  const tooltip = window.chartUtils.createTooltip();
  const colors = window.chartUtils.colors;

  // Barras
  g.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.title))
    .attr('y', d => yScale(d.registrations))
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - yScale(d.registrations))
    .attr('fill', (d, i) => colors[i % colors.length])
    .on('mouseover', function(event, d) {
      d3.select(this).style('opacity', 0.8);
      tooltip.style('opacity', 1)
        .html(`<strong>${d.title}</strong><br/>Registraciones: ${d.registrations}`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this).style('opacity', 1);
      tooltip.style('opacity', 0);
    });

  // Valores en barras
  g.selectAll('.bar-label')
    .data(data)
    .enter()
    .append('text')
    .attr('x', d => xScale(d.title) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.registrations) - 5)
    .attr('text-anchor', 'middle')
    .style('fill', '#e2e8f0')
    .style('font-weight', 'bold')
    .style('font-size', '0.85rem')
    .text(d => d.registrations);

  // Eje X
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .style('font-size', '0.85rem')
    .selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end')
    .style('fill', '#cbd5e1');

  // Eje Y
  g.append('g')
    .call(d3.axisLeft(yScale))
    .style('font-size', '0.85rem')
    .style('color', '#cbd5e1');

  // Etiqueta Y
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('fill', '#cbd5e1')
    .style('font-size', '0.85rem')
    .text('Registraciones');
}

// Función de búsqueda
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchCompetition');
  if (searchInput) {
    searchInput.addEventListener('keyup', function() {
      const searchTerm = this.value.toLowerCase();
      document.querySelectorAll('.competition-row').forEach(row => {
        const search = row.dataset.search;
        row.style.display = search.includes(searchTerm) ? '' : 'none';
      });
    });
  }

  waitForDependencies(loadCompetitionChart);
});
