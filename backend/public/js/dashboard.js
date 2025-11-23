
function waitForDependencies(callback) {
  if (typeof d3 !== 'undefined' && typeof window.chartUtils !== 'undefined') {
    callback();
  } else {
    setTimeout(() => waitForDependencies(callback), 100);
  }
}

async function loadCharts() {
  try {
    
    const userRoleResponse = await fetch('/admin/api/users-by-role');
    const userRoleData = await userRoleResponse.json();

  
    const registrationResponse = await fetch('/admin/api/registrations-stats');
    const registrationData = await registrationResponse.json();

   
    const timelineResponse = await fetch('/admin/api/users-timeline');
    const timelineData = await timelineResponse.json();

   
    renderUserRoleChart(userRoleData);
    renderRegistrationChart(registrationData);
    renderTimelineChart(timelineData);
  } catch (error) {
    console.error('Error loading chart data:', error);
  }
}


function renderUserRoleChart(data) {
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const width = 400 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = d3.select('#userRoleChart')
    .attr('viewBox', `0 0 400 300`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleBand()
    .domain(data.map(d => d.role))
    .range([0, width])
    .padding(0.3);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count)])
    .range([height, 0]);

  const tooltip = window.chartUtils.createTooltip();
  const colors = window.chartUtils.colors;

  g.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.role))
    .attr('y', d => yScale(d.count))
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - yScale(d.count))
    .attr('fill', (d, i) => colors[i % colors.length])
    .on('mouseover', function(event, d) {
      d3.select(this).style('opacity', 0.8);
      tooltip.style('opacity', 1)
        .html(`<strong>${d.role}</strong><br/>Usuarios: ${d.count}`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this).style('opacity', 1);
      tooltip.style('opacity', 0);
    });


  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .style('font-size', '0.85rem')
    .style('color', '#cbd5e1');

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
    .text('Cantidad');
}


function renderRegistrationChart(data) {
  const width = 400;
  const height = 300;
  const radius = Math.min(width, height) / 2 - 30;

  const svg = d3.select('#registrationChart')
    .attr('viewBox', `0 0 400 300`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);

  const pie = d3.pie()
    .value(d => d.count);

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  const tooltip = window.chartUtils.createTooltip();
  const colors = window.chartUtils.colors;

  const statusColors = {
    'pending': '#f59e0b',
    'approved': '#10b981',
    'rejected': '#ef4444'
  };

  g.selectAll('.pie-slice')
    .data(pie(data))
    .enter()
    .append('path')
    .attr('class', 'pie-slice')
    .attr('d', arc)
    .attr('fill', d => statusColors[d.data.status] || colors[0])
    .style('stroke', '#0f172a')
    .style('stroke-width', 2)
    .on('mouseover', function(event, d) {
      d3.select(this).style('opacity', 0.8);
      const percentage = (d.data.count / d3.sum(data, dd => dd.count) * 100).toFixed(1);
      tooltip.style('opacity', 1)
        .html(`<strong>${d.data.status}</strong><br/>
                Registraciones: ${d.data.count}<br/>
                Porcentaje: ${percentage}%`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this).style('opacity', 1);
      tooltip.style('opacity', 0);
    });

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

// Gráfica de línea: Línea temporal
function renderTimelineChart(data) {
  if (!data || data.length === 0) return;

  const margin = { top: 20, right: 30, bottom: 50, left: 60 };
  const width = window.innerWidth > 768 ? 1100 - margin.left - margin.right : 300 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = d3.select('#timelineChart')
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => new Date(d.date)))
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count)])
    .range([height, 0]);

  // Crear gradiente
  window.chartUtils.createGradient(svg, 'lineGradient', 'rgba(14, 165, 233, 0.5)', 'rgba(14, 165, 233, 0)');

  const line = d3.line()
    .x(d => xScale(new Date(d.date)))
    .y(d => yScale(d.count));

  const area = d3.area()
    .x(d => xScale(new Date(d.date)))
    .y0(height)
    .y1(d => yScale(d.count));

  // Área bajo la línea
  g.append('path')
    .datum(data)
    .attr('class', 'line-area')
    .attr('d', area);

  // Línea
  g.append('path')
    .datum(data)
    .attr('class', 'line')
    .attr('d', line);

  // Puntos
  const tooltip = window.chartUtils.createTooltip();

  g.selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', d => xScale(new Date(d.date)))
    .attr('cy', d => yScale(d.count))
    .attr('r', 4)
    .attr('fill', '#0ea5e9')
    .attr('stroke', '#0f172a')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).attr('r', 6);
      tooltip.style('opacity', 1)
        .html(`<strong>Fecha: ${new Date(d.date).toLocaleDateString()}</strong><br/>Nuevos usuarios: ${d.count}`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this).attr('r', 4);
      tooltip.style('opacity', 0);
    });

  // Eje X
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks(5))
    .style('font-size', '0.85rem')
    .style('color', '#cbd5e1');

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
    .text('Usuarios');
}

// Cargar gráficas cuando el DOM y las dependencias estén listos
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    waitForDependencies(loadCharts);
  });
} else {
  waitForDependencies(loadCharts);
}
