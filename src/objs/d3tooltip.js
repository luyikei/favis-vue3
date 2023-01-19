
import * as d3 from "d3";
export class Tooltip {
  constructor(div) {
    this.tip = d3.select(div)
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "3px")
      .style("font-size", "0.7em")
      .style("padding", "5px");
  }

  // Three function that change the tooltip when user hover / move / leave a cell
  mouseover(event, d) {
  }

  mousemove(event, d) {
    this.tip.style("opacity", 1).style("z-index", "100");
    const [x, y] = [event.clientX, event.clientY];
    this.tip
      .html(!d.codebook ? `Variable: ${d.variable}<br>Factor: ${d.factor}` : `Variable: ${d.variable}<br>Factor: ${d.factor} <br><br>${Tooltip.formatCodebook(d.codebook)}`)
      .style("position", "fixed")
      .style("left", `${x + 7}px`)
      .style("top", `${y + 7}px`);
  }

  mouseleave(event) {
    this.tip.style("opacity", 0).style("z-index", "-1");
  }

  static formatCodebook(codebook) {
    return Object.keys(codebook).map((key) => `${key}: ${codebook[key]}`).join("<br>");
  }
}