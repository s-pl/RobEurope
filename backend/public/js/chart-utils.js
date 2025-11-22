// Utilidades globales para gráficas D3
window.chartUtils = {
  colors: ['#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
  
  createTooltip() {
    return d3.select('body')
      .append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('padding', '8px 12px')
      .style('background', 'rgba(15, 23, 42, 0.95)')
      .style('color', '#e2e8f0')
      .style('border', '1px solid #0ea5e9')
      .style('border-radius', '6px')
      .style('pointer-events', 'none')
      .style('font-size', '0.85rem')
      .style('z-index', '1000')
      .style('opacity', '0');
  },

  formatNumber(num) {
    return Math.round(num * 10) / 10;
  },

  createGradient(svg, id, color1, color2) {
    svg.append('defs').append('linearGradient')
      .attr('id', id)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')
      .selectAll('stop')
      .data([
        { offset: '0%', color: color1 },
        { offset: '100%', color: color2 }
      ])
      .enter()
      .append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color);
  }
};
